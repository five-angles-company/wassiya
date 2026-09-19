// Three security invariants that are cheap to state and expensive to lose.
//
// They are enforced here rather than in a code review because each one fails
// silently: a second `lockedKey` read path, an `auditLog` patch, or a
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
 * Comments are prose, not a leak. `release.ts` documents `lockedKey` heavily
 * on purpose, and every check below is about code, so strip comments first.
 */
const BLOCK_COMMENT = new RegExp("/\\*[\\s\\S]*?\\*/", "g")
const LINE_COMMENT = new RegExp("(^|[^:])//.*$", "gm")
const code = (path) =>
  read(path).replace(BLOCK_COMMENT, "").replace(LINE_COMMENT, "$1")
const rel = (path) => relative(convexDir, path).replaceAll("\\", "/")

// ── 1. The locked heir key has one write path and one unlock path ──────────
//
// `lockedKey` is K_h locked to the escrow key. It may appear in the schema, in
// `release.saveBundles` (the write) and `release.releaseGate` (the one read),
// and in `escrow.ts`, whose only export `openDelivery` is the one unlock path.
// Anything else touching it, calling the gate, reading the dev private key or
// importing `@workspace/crypto` is a new way for an heir's key to leave.
{
  const ALLOWED_FILES = ["schema.ts", "release.ts", "escrow.ts"]
  const ALLOWED_RELEASE_EXPORTS = ["saveBundles", "releaseGate"]
  const ESCROW_ONLY = [
    "releaseGate",
    "ESCROW_DEV_PRIVATE_KEY",
    "privateDecrypt",
    "@google-cloud/kms",
    "cloudkms.googleapis.com",
    "GCP_SERVICE_ACCOUNT",
    "@workspace/crypto",
  ]

  for (const file of files) {
    const name = rel(file)
    const source = code(file)
    if (source.includes("lockedKey") && !ALLOWED_FILES.includes(name)) {
      failures.push(
        `lockedKey appears in ${name} — only ${ALLOWED_FILES.join(", ")} may mention it.`
      )
    }
    for (const token of ESCROW_ONLY) {
      if (name === "escrow.ts") continue
      if (token === "releaseGate" && name === "release.ts") continue
      if (source.includes(token)) {
        failures.push(`${token} appears in ${name} — only escrow.ts may use it.`)
      }
    }
  }

  const releasePath = files.find((f) => rel(f) === "release.ts")
  const escrowPath = files.find((f) => rel(f) === "escrow.ts")
  if (releasePath === undefined || escrowPath === undefined) {
    failures.push("release.ts or escrow.ts is missing — the gated path is gone.")
  } else {
    // Split on top-level `export const <name> =` and see which blocks mention it.
    const blocks = code(releasePath).split(/\nexport const /)
    const touching = blocks
      .slice(1)
      .filter((block) => block.includes("lockedKey"))
      .map((block) => block.slice(0, block.indexOf(" ")))
    const unexpected = touching.filter(
      (name) => !ALLOWED_RELEASE_EXPORTS.includes(name)
    )
    if (unexpected.length > 0) {
      failures.push(
        `lockedKey is reachable from release.${unexpected.join(", release.")} — only ${ALLOWED_RELEASE_EXPORTS.join(" and ")} may touch it.`
      )
    }
    for (const expected of ALLOWED_RELEASE_EXPORTS) {
      if (!touching.includes(expected)) {
        failures.push(
          `release.${expected} no longer mentions lockedKey — did the gated path move?`
        )
      }
    }
    if (!/export const releaseGate = internalQuery\(/.test(code(releasePath))) {
      failures.push("release.releaseGate must stay an internalQuery.")
    }

    const escrowExports = [...code(escrowPath).matchAll(/export (?:const|function|async function) (\w+)/g)]
      .map((match) => match[1])
    if (escrowExports.join(",") !== "openDelivery") {
      failures.push(
        `escrow.ts exports ${escrowExports.join(", ") || "nothing"} — only openDelivery may be exported.`
      )
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
  "Backend invariants hold: one lockedKey unlock path, append-only audit log, no logged ciphertext, one claims writer."
)
