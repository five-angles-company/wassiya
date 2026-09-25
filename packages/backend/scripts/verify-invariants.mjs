// The invariants that are cheap to state and expensive to lose.
//
// They are enforced here rather than in a code review because each one fails
// silently: a second escrowed-key read path, an `auditLog` patch, a
// `console.log` of a ciphertext column, or a mutation that hands out a
// subscription all typecheck perfectly.
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
    } else if (entry.endsWith(".ts") && !entry.endsWith(".test.ts")) {
      out.push(path)
    }
  }
  return out
}

const files = sourceFiles()
const read = (path) => readFileSync(path, "utf8")

/**
 * Comments are prose, not a leak. The schema documents `escrowedDek` on
 * purpose, and every check below is about code, so strip comments first.
 */
const BLOCK_COMMENT = new RegExp("/\\*[\\s\\S]*?\\*/", "g")
const LINE_COMMENT = new RegExp("(^|[^:])//.*$", "gm")
const code = (path) =>
  read(path).replace(BLOCK_COMMENT, "").replace(LINE_COMMENT, "$1")
const rel = (path) => relative(convexDir, path).replaceAll("\\", "/")

// ── 1. Escrowed keys have write paths and exactly one unlock path ──────────
//
// `escrowedDek` and `messageKeyEscrowed` are keys sealed to the escrow key. They
// may appear in the schema, in the mutations that write them (`routing.ts`,
// `heirs.ts`) and in `escrow.ts`, whose `openDelivery` is the one unlock path.
// Outside `escrow.ts` no query may mention them, so none can return one. The
// escrow secret and `@workspace/crypto` live in `escrow.ts` alone.
{
  const KEY_COLUMNS = ["escrowedDek", "messageKeyEscrowed"]
  const WRITERS = ["routing.ts", "heirs.ts"]
  const ALLOWED_FILES = ["schema.ts", "escrow.ts", ...WRITERS]
  const ESCROW_ONLY = ["ESCROW_PRIVATE_KEY", "openFromEscrow", "@workspace/crypto"]
  const ESCROW_EXPORTS = "openDelivery"

  for (const file of files) {
    const name = rel(file)
    const source = code(file)
    for (const column of KEY_COLUMNS) {
      if (source.includes(column) && !ALLOWED_FILES.includes(name)) {
        failures.push(
          `${column} appears in ${name} — only ${ALLOWED_FILES.join(", ")} may mention it.`
        )
      }
    }
    if (name !== "escrow.ts") {
      for (const token of ESCROW_ONLY) {
        if (source.includes(token)) {
          failures.push(`${token} appears in ${name} — only escrow.ts may use it.`)
        }
      }
    }
    if (WRITERS.includes(name)) {
      for (const block of source.split(/\nexport const /).slice(1)) {
        const fn = block.slice(0, block.indexOf(" "))
        const mentions = KEY_COLUMNS.some((column) => block.includes(column))
        if (mentions && !/^\w+ = (internalMutation|mutation)\(/.test(block)) {
          failures.push(
            `${name}: ${fn} mentions an escrowed key and is not a mutation — only escrow.openDelivery may read one.`
          )
        }
      }
    }
  }

  const escrowPath = files.find((f) => rel(f) === "escrow.ts")
  if (escrowPath === undefined) {
    failures.push("escrow.ts is missing — the gated path is gone.")
  } else {
    const escrow = code(escrowPath)
    const exported = [
      ...escrow.matchAll(/export (?:const|function|async function) (\w+)/g),
    ]
      .map((match) => match[1])
      .sort()
      .join(",")
    if (exported !== ESCROW_EXPORTS) {
      failures.push(
        `escrow.ts exports ${exported || "nothing"} — only openDelivery may be exported.`
      )
    }
    if (!/export const openDelivery = mutation\(/.test(escrow)) {
      failures.push("escrow.openDelivery must stay a mutation, so its audit line and its read commit together.")
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

// ── 5. Entitlement has exactly one module ────────────────────────
//
// Three things decide who has paid and what they get: `subscription` (the
// plan), the `plans` table (what each plan allows) and `limitsOverride` (what
// one account allows). If any client-callable mutation can write one of them,
// the app bundle contains the instructions for a free subscription — and
// unlike a leaked key, nothing about that looks wrong in review.
//
// They are not equally loud. A granted subscription is one account; raising the
// free plan's caps is every account at once, and an override is the quietest of
// the three — nothing about that account looks unusual and it silently stops
// matching the plan every screen says it is on. So all three live in
// `billing.ts`, gated on `requireAdmin` and audited.
//
// Usage counters live *outside* `subscription` for this rule's sake —
// `storageBytesUsed` is bumped on every upload and would otherwise have to be
// an exception, which is how exceptions start.
//
// The match is on the object-literal key, i.e. a write. Reads spell it
// `user.subscription?.` and are none of this rule's business.
{
  const ALLOWED = ["schema.ts", "billing.ts"]
  const WRITES = ["subscription:", "limitsOverride:"]

  for (const file of files) {
    const name = rel(file)
    if (ALLOWED.includes(name)) {
      continue
    }
    const source = code(file)
    for (const token of WRITES) {
      const hits = source.split(token).length - 1
      if (hits > 0) {
        failures.push(
          `${name} writes ${token.slice(0, -1)} (${hits} time(s)). Only ${ALLOWED.join(", ")} may — see AGENTS.md "Entitlement has exactly one module".`
        )
      }
    }
    // The catalogue itself: a plan row is what every owner on that plan is
    // held to, so writing one is writing everybody's entitlement at once.
    for (const write of ["insert(\"plans\"", "patch(\"plans\"", "replace(\"plans\"", "delete(\"plans\""]) {
      if (source.includes(write)) {
        failures.push(
          `${name} writes the plans table (${write}…). Only billing.ts may.`
        )
      }
    }
  }

  // Once the store path exists, keep it internal: a public mutation that
  // applies a store event is a mutation anyone can call with any event. It
  // does not exist yet, so the check is conditional on the name appearing.
  const billingPath = files.find((f) => rel(f) === "billing.ts")
  if (billingPath !== undefined) {
    const billing = code(billingPath)
    if (
      billing.includes("applyStoreEvent") &&
      !billing.includes("export const applyStoreEvent = internalMutation(")
    ) {
      failures.push(
        "billing.applyStoreEvent must exist and stay an internalMutation."
      )
    }
    const writers = billing
      .split("export const ")
      .slice(1)
      .filter((declaration) => declaration.includes("subscription:"))
      .map((declaration) => declaration.slice(0, declaration.indexOf(" ")))
      .filter(
        (name) =>
          name !== "applyStoreEvent" &&
          name !== "adminSetPlan" &&
          name !== "adminSetOverride"
      )
    if (writers.length > 0) {
      failures.push(
        `billing.${writers.join(", billing.")} writes subscription — only applyStoreEvent and adminSetPlan may.`
      )
    }
  }
}

// ── 6. Authority has exactly one module ─────────────────────────────────────
//
// Three ways to lose RBAC, all of which typecheck. An `admin*` function that
// forgot its gate is open to every signed-in person. A hand-rolled
// `user.role === "admin"` is a second definition of authority that drifts from
// the catalogue — and `role` is *also* how owner metrics exclude staff, so the
// two readings of one column have to stay visibly apart. And a `staffRoles`
// writer that edits a role without recomputing its holders leaves every open
// console session running on permissions that were revoked a minute ago, with
// nothing anywhere to surface it.
{
  const ACCESS = "model/access.ts"
  const STAFF = "staff.ts"

  // 6.1 — `role` is compared in one file, through isStaffAccount/excludeStaff.
  const rawRole = /role\s*[!=]==?\s*["'](admin|owner)["']|q\.(neq|eq)\(\s*q\.field\(\s*["']role["']/
  for (const file of files) {
    const name = rel(file)
    if (name === ACCESS || name === "schema.ts") continue
    // `applyRoles` is the one writer of the column and says so in the model.
    if (name === "model/staff.ts") continue
    if (rawRole.test(code(file))) {
      failures.push(
        `${name} compares users.role directly — use isStaffAccount/excludeStaff from ${ACCESS}, so a metric filter can never be mistaken for an authority check.`
      )
    }
  }

  // 6.2 — every exported admin* function is gated, and requireAdmin is gone.
  let gated = 0
  for (const file of files) {
    const name = rel(file)
    const source = code(file)
    if (source.includes("requireAdmin")) {
      failures.push(
        `${name} still uses requireAdmin — authority is a permission now; call requirePermission with the key the function needs.`
      )
    }
    for (const block of source.split(/\nexport const /).slice(1)) {
      const fn = block.slice(0, block.indexOf(" "))
      if (!/^admin/.test(fn)) continue
      if (!block.includes("requirePermission(")) {
        failures.push(`${name}: ${fn} is exported ungated — it needs a requirePermission call.`)
      }
      gated += 1
    }
  }

  // 6.3 — every key a gate names exists in the catalogue.
  const catalogue = read(join(convexDir, "model/permissions.ts"))
  const keys = [...catalogue.matchAll(/\{ key: "([^"]+)"/g)].map((m) => m[1])
  if (keys.length === 0) {
    failures.push("Found no permission keys in model/permissions.ts — check the regex.")
  }
  let checked = 0
  for (const file of files) {
    for (const [, key] of code(file).matchAll(/requirePermission\(\s*\w+\s*,\s*"([^"]+)"/g)) {
      checked += 1
      if (!keys.includes(key)) {
        failures.push(`${rel(file)} gates on "${key}", which is not in the catalogue.`)
      }
    }
  }
  console.log(
    `Checked ${checked} permission gates and ${gated} admin* exports against ${keys.length} catalogue keys.`
  )

  // 6.4 — a role edit must fan out to its holders, and only staff.ts may write
  // either side of the denormalisation.
  for (const file of files) {
    const name = rel(file)
    const source = code(file)
    const writesRoles = /\.(insert|patch|replace|delete)\(\s*["']staffRoles["']/.test(source)
    if (writesRoles && name !== STAFF) {
      failures.push(
        `${name} writes staffRoles — only ${STAFF} may, because every write there has to recompute its holders.`
      )
    }
    if (writesRoles && name === STAFF) {
      for (const block of source.split(/\nexport const /).slice(1)) {
        const fn = block.slice(0, block.indexOf(" "))
        // An insert has no holders yet; only an edit can strand them.
        if (!/\.(patch|replace)\(\s*["']staffRoles["']/.test(block)) continue
        if (!block.includes("recomputeHolders(")) {
          failures.push(
            `${STAFF}: ${fn} edits a role without calling recomputeHolders — its holders keep the permissions it had before.`
          )
        }
      }
    }
    for (const token of ["staffPermissions:", "staffRoleIds:"]) {
      if (!source.includes(token)) continue
      if (name === "schema.ts" || name === "model/staff.ts") continue
      failures.push(
        `${name} writes ${token.slice(0, -1)} — it is denormalised, so model/staff.ts owns it.`
      )
    }
  }
}

// ── 7. Support never touches a vault, and staff-only data stays staff-only ──
//
// A support thread is not end-to-end encrypted and is read by staff, so it is
// the easiest place for vault data or key material to leak from. Support code
// may not name a vault table at all. Staff notes live in their own table so a
// requester query cannot return one by forgetting a filter, and the requester
// module may not even name them — or the staff member who wrote a message.
{
  const SUPPORT = (name) =>
    name.startsWith("support/") || name === "model/support.ts"
  const VAULT_TOKENS = [
    "keyring",
    "escrowedDek",
    "messageKeyEscrowed",
    "assetRecipients",
    "\"assets\"",
    "\"heirs\"",
    "dekWrappedByMk",
    "mkWrappedByRecovery",
    "messageMeta",
    "identityDocHashes",
    "idNumberHash",
    "@workspace/crypto",
  ]
  for (const file of files) {
    const name = rel(file)
    const source = code(file)
    if (SUPPORT(name)) {
      for (const token of VAULT_TOKENS) {
        if (source.includes(token)) {
          failures.push(`${name} mentions ${token} — support code may not touch a vault.`)
        }
      }
    }
    if (/\.insert\(\s*["']supportMessages["']/.test(source) && name !== "model/support.ts") {
      failures.push(
        `${name} inserts supportMessages — only appendMessage in model/support.ts may, so a thread's status and read marks stay in step.`
      )
    }
    if (
      source.includes("supportNotes") &&
      !["schema.ts", "support/admin.ts"].includes(name)
    ) {
      failures.push(`${name} mentions supportNotes — staff notes are read by support/admin.ts only.`)
    }
    if (name === "support/threads.ts" && source.includes("staffUserId")) {
      failures.push("support/threads.ts mentions staffUserId — a requester never learns which staff member replied.")
    }
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
  "Backend invariants hold: one escrow unlock path, append-only audit log, no logged ciphertext, one claims writer, one entitlement module, one authority module, support isolated from the vault."
)
