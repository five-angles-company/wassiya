// Three security invariants that are cheap to state and expensive to lose.
//
// They are enforced here rather than in a code review because each one fails
// silently: a second `serverShare` read path, an `auditLog` patch, or a
// `console.log` of a ciphertext column all typecheck perfectly.
//
//   pnpm --filter @workspace/backend verify
import { readFileSync, readdirSync, statSync } from "node:fs"
import { join, relative } from "node:path"
import { fileURLToPath } from "node:url"

const convexDir = fileURLToPath(new URL("../convex", import.meta.url))
const failures = []

/** Every .ts file under convex/, minus the generated ones. */
function sourceFiles(dir = convexDir) {
  const out = []
  for (const entry of readdirSync(dir)) {
    if (entry === "_generated") {
      continue
    }
    const path = join(dir, entry)
    if (statSync(path).isDirectory()) {
      out.push(...sourceFiles(path))
    } else if (entry.endsWith(".ts")) {
      out.push(path)
    }
  }
  return out
}

const files = sourceFiles()
const read = (path) => readFileSync(path, "utf8")

/**
 * Comments are prose, not a leak. `release.ts` documents `serverShare` heavily
 * on purpose, and every check below is about code, so strip comments first.
 */
const BLOCK_COMMENT = new RegExp("/\\*[\\s\\S]*?\\*/", "g")
const LINE_COMMENT = new RegExp("(^|[^:])//.*$", "gm")
const code = (path) =>
  read(path).replace(BLOCK_COMMENT, "").replace(LINE_COMMENT, "$1")
const rel = (path) => relative(convexDir, path).replaceAll("\\", "/")

// ── 1. `serverShare` has exactly one read path ───────────────────────────────
//
// The token legitimately appears three times: the schema column, the write in
// `release.saveBundles`, and the one gated return in
// `release.releasedBundleForHeir`. Any fourth appearance is a new way for half
// of K_h to leave the deployment.
{
  const ALLOWED_FILES = ["schema.ts", "release.ts"]
  const ALLOWED_EXPORTS = ["saveBundles", "releasedBundleForHeir"]

  const mentioning = files.filter((f) => code(f).includes("serverShare"))
  for (const file of mentioning) {
    if (!ALLOWED_FILES.includes(rel(file))) {
      failures.push(
        `serverShare appears in ${rel(file)} — only ${ALLOWED_FILES.join(" and ")} may mention it.`
      )
    }
  }

  const releasePath = files.find((f) => rel(f) === "release.ts")
  if (releasePath === undefined) {
    failures.push("release.ts is missing — the gated read path is gone.")
  } else {
    // Split on top-level `export const <name> =` and see which blocks mention it.
    const blocks = code(releasePath).split(/\nexport const /)
    const guilty = blocks
      .slice(1)
      .filter((block) => block.includes("serverShare"))
      .map((block) => block.slice(0, block.indexOf(" ")))
    const unexpected = guilty.filter((name) => !ALLOWED_EXPORTS.includes(name))
    if (unexpected.length > 0) {
      failures.push(
        `serverShare is reachable from release.${unexpected.join(", release.")} — only ${ALLOWED_EXPORTS.join(" and ")} may touch it.`
      )
    }
    for (const expected of ALLOWED_EXPORTS) {
      if (!guilty.includes(expected)) {
        failures.push(
          `release.${expected} no longer mentions serverShare — did the gated path move?`
        )
      }
    }
  }
}

// ── 2. The audit log is append-only ─────────────────────────────────────────
{
  const mutating = /\.(patch|replace|delete)\(\s*["']auditLog["']/g
  for (const file of files) {
    const hits = code(file).match(mutating)
    if (hits !== null) {
      failures.push(
        `${rel(file)} mutates auditLog (${hits.join(", ")}). The log is append-only.`
      )
    }
  }
}

// ── 3. No ciphertext column is ever logged ──────────────────────────────────
//
// The field names are read out of the schema, so a new `v.bytes()` column is
// covered the moment it is declared — no list here to keep in sync.
{
  const schema = read(join(convexDir, "schema.ts"))
  const byteFields = [
    ...schema.matchAll(/(\w+):\s*v\.(?:optional\(v\.)?bytes\(/g),
  ].map((match) => match[1])
  if (byteFields.length === 0) {
    failures.push("Found no v.bytes() columns in schema.ts — check the regex.")
  }

  for (const file of files) {
    for (const line of code(file).split("\n")) {
      if (!/\bconsole\.\w+\(/.test(line)) {
        continue
      }
      const leaked = byteFields.filter((field) =>
        new RegExp(`\\b${field}\\b`).test(line)
      )
      if (leaked.length > 0) {
        failures.push(
          `${rel(file)} logs ciphertext columns (${leaked.join(", ")}): ${line.trim()}`
        )
      }
    }
  }
  console.log(
    `Checked ${byteFields.length} v.bytes() columns across ${files.length} files.`
  )
}

// ── 4. A claim is written in exactly one place ──────────────────────────────
//
// `claims.updatedAt` drives the case timeline, and Convex has no triggers — so a
// writer that forgets to stamp it leaves a row whose "last moved" is silently
// wrong. `patchClaim` in `claims.ts` always stamps it; this is what stops a
// second writer appearing beside it.
//
// The header comment in `claims.ts` mentions the call in prose, which is why
// every check in this file strips comments first.
{
  const patching = /\.patch\(\s*["']claims["']/g
  for (const file of files) {
    if (rel(file) === "claims.ts") {
      continue
    }
    const hits = code(file).match(patching)
    if (hits !== null) {
      failures.push(
        `${rel(file)} patches claims directly (${hits.join(", ")}). Use patchClaim from claims.ts — it stamps updatedAt.`
      )
    }
  }

  // And inside claims.ts there may be exactly one: patchClaim's own.
  const own = code(join(convexDir, "claims.ts")).match(patching)
  if (own === null || own.length !== 1) {
    failures.push(
      `claims.ts should contain exactly one ctx.db.patch("claims", …) — patchClaim's — but found ${own === null ? 0 : own.length}.`
    )
  }
}

if (failures.length > 0) {
  console.error("\nBackend invariant check FAILED:\n")
  for (const failure of failures) {
    console.error(`  ✗ ${failure}`)
  }
  process.exit(1)
}

console.log(
  "Backend invariants hold: one serverShare read path, append-only audit log, no logged ciphertext, one claims writer."
)
