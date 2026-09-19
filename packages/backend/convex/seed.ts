// Demo data for the admin console, and nothing else.
//
// The console's whole value is that every number on it means something, which
// makes it untestable against a deployment holding two users: a funnel reads
// 1 → 1 → 1, a trend is one dot, and a correct dashboard is indistinguishable
// from a broken one. This file exists to make it reviewable.
//
// ## Three rules this file obeys, two of them enforced by the build
//
//  1. **Everything is an `internalMutation`.** Nothing here is reachable from a
//     client, only from `npx convex run`, which needs deployment credentials.
//
//  2. **No `releaseBundles`.** Inserting one requires `lockedKey`, and
//     `scripts/verify-invariants.mjs` fails the build if that token appears
//     outside the files allowed to touch it. The seed bends around it: every
//     seeded heir reads as "never built".
//
//  3. **No `auditLog` rows.** The log is append-only by the same build gate, so
//     anything written here could never be wiped. Audit-derived views run on
//     real rows only.
//
// ## How the wipe is made safe
//
// Every seeded owner's `externalId` starts with `seed_`. Clerk ids start with
// `user_`, so the two sets cannot overlap, and `wipe` deletes only rows reachable
// from a `seed_` owner. A real account is unreachable from that set by
// construction — not by a filter someone has to remember to write.
import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalAction, internalMutation } from "./_generated/server"
import { DAY_MS as FLOW_DAY_MS, VETO_WINDOW_DAYS } from "./model/claimFlow"
import { identityNumberHash } from "./model/identityHash"
import type { Id } from "./_generated/dataModel"

/** The marker. `user_…` is Clerk's prefix, so these can never collide. */
const SEED_PREFIX = "seed_"

const DAY_MS = 24 * 60 * 60 * 1000
const OWNER_COUNT = 40

/**
 * A tiny deterministic generator, so two runs produce the same fixture and a
 * screenshot stays comparable. Convex seeds `Math.random()` per execution, which
 * would also work, but "the same command gives the same data" is worth more
 * here than variety.
 */
function lcg(seed: number): () => number {
  let state = seed >>> 0
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0
    return state / 0x100000000
  }
}

/** `v.bytes()` wants an ArrayBuffer. Contents are irrelevant — nothing reads them. */
function fakeBytes(length: number): ArrayBuffer {
  return new ArrayBuffer(length)
}

const FIRST = [
  "فاطمة", "خالد", "نورة", "عبدالله", "مريم", "سلطان", "هند", "ياسر",
  "لطيفة", "بندر", "ريم", "ماجد", "سارة", "طارق", "جواهر", "فيصل",
]
const LAST = [
  "المنصوري", "العتيبي", "القحطاني", "الدوسري", "الشمري", "الحربي",
  "الغامدي", "الزهراني",
]

const IDENTITY_SPREAD = [
  "verified", "verified", "verified", "verified", "verified",
  "pending", "pending",
  "unverified", "unverified",
  "rejected",
] as const

const ESCALATION_SPREAD = [
  "idle", "idle", "idle", "idle",
  "day0", "day0",
  "day7",
  "day14",
  "countdown",
] as const

const ASSET_TYPES = [
  "crypto", "bank", "document", "photos", "digital", "note",
] as const

const CLAIM_SPREAD = [
  "submitted", "submitted", "submitted",
  "awaiting_veto", "awaiting_veto",
  "released",
  "vetoed",
  "locked",
] as const

/**
 * Build the fixture.
 *
 * `confirm` is a literal rather than a boolean so the command cannot be run by
 * tab-completion or by pasting half a line — you have to type the word. Combined
 * with `internalMutation`, that is proportionate: this writes ~400 rows.
 */
export const demo = internalMutation({
  args: {
    confirm: v.literal("seed-dev"),
    /**
     * Also build one owner whose report can be driven end to end: verified
     * reporter, two heirs, a matching certificate name. Off by default because
     * it is the one scenario that implies a real flow rather than numbers.
     */
    withScenario: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db.query("users").take(500)
    if (existing.length >= 500) {
      throw new Error(
        "Refusing to seed: this deployment already holds 500+ users and does not look like a dev toy."
      )
    }
    if (existing.some((user) => user.externalId.startsWith(SEED_PREFIX))) {
      throw new Error(
        "Refusing to seed: seeded rows are already present. Run seed:wipe first."
      )
    }

    const rand = lcg(20260827)
    const now = Date.now()
    const pick = <T,>(list: readonly T[]): T =>
      list[Math.floor(rand() * list.length)]!

    const ownerIds: Id<"users">[] = []

    for (let i = 0; i < OWNER_COUNT; i += 1) {
      const identityStatus = pick(IDENTITY_SPREAD)
      const name = `${pick(FIRST)} ${pick(LAST)}`

      // Spread sign-ups over the last 90 days so the trend chart has a shape.
      // `_creationTime` is system-assigned and cannot be set, so the trend is
      // "seeded today" — see the note in `demo`'s caveats below.
      const verified = identityStatus === "verified"

      const userId = await ctx.db.insert("users", {
        externalId: `${SEED_PREFIX}${i}_${Math.floor(rand() * 1e9)}`,
        name,
        email: `seed${i}@example.test`,
        country: pick(["SA", "AE", "DZ", "EG"]),
        locale: "ar-SA",
        identityStatus,
        identityVerifiedName: verified ? name : undefined,
        identityVerifiedAt: verified ? now - Math.floor(rand() * 60) * DAY_MS : undefined,
        // Only a literal decline burns an attempt, so most rejected owners sit
        // at zero — see `identity.ts`. A few have exhausted all three and are
        // the ones the console flags for support.
        identityAttempts:
          identityStatus === "rejected" ? (rand() < 0.4 ? 3 : 1) : 0,
        role: "owner" as const,
        subscription: {
          plan: "free",
          storageBytesUsed: Math.floor(rand() * 900_000_000),
        },
      })
      ownerIds.push(userId)

      await ctx.db.insert("devices", {
        userId,
        installId: `${SEED_PREFIX}install_${i}`,
        name: pick(["iPhone 15", "Galaxy S24", "Pixel 8"]),
        platform: pick(["ios", "android"] as const),
        revoked: rand() < 0.1,
      })

      // Only verified owners can have a vault: `keyring.save` calls
      // `assertIdentityVerified` on the first write. The funnel's biggest drop
      // is meant to be real, not manufactured.
      const hasVault = verified && rand() < 0.8
      if (hasVault) {
        await ctx.db.insert("keyring", {
          userId,
          mkWrappedByRecovery: fakeBytes(72),
          paperVersion: 1,
          paperPrintedAt: rand() < 0.65 ? now - Math.floor(rand() * 40) * DAY_MS : undefined,
          rotatedAt: now - Math.floor(rand() * 40) * DAY_MS,
        })

        const assetCount = Math.floor(rand() * 6)
        for (let a = 0; a < assetCount; a += 1) {
          const type = pick(ASSET_TYPES)
          const routed = rand() < 0.6
          const assetId = await ctx.db.insert("assets", {
            userId,
            type,
            labelSealed: fakeBytes(96),
            meta: {
              byteSize:
                type === "photos" || type === "document"
                  ? Math.floor(rand() * 40_000_000)
                  : undefined,
              itemCount: 1,
            },
            dekWrappedByMk: fakeBytes(60),
            storageIds: [],
            recipientRule: routed ? "explicit" : "default",
          })
          if (routed) {
            await ctx.db.insert("assetRecipients", {
              assetId,
              userId,
              recipient: { kind: "allHeirs" },
              recipientKind: "allHeirs",
            })
          }
        }

        const heirCount = Math.floor(rand() * 4)
        for (let h = 0; h < heirCount; h += 1) {
          await ctx.db.insert("heirs", {
            userId,
            name: `${pick(FIRST)} ${pick(LAST)}`,
            relation: pick(["ابنة", "ابن", "زوجة", "أخ"]),
            phone: `+9665${Math.floor(rand() * 90_000_000 + 10_000_000)}`,
            mode: "silent" as const,
            inviteStatus: "none" as const,
            // Varied so the risk table's ordering and per-owner roll-up are
            // exercised. Every one still reads as stale, because the seed
            // cannot write a release bundle — see the header.
            routingChangedAt:
              rand() < 0.7 ? now - Math.floor(rand() * 30) * DAY_MS : undefined,
          })
        }

        if (rand() < 0.75) {
          const escalationState = pick(ESCALATION_SPREAD)
          const cadenceMonths = pick([3, 6, 12])
          await ctx.db.insert("checkinConfig", {
            userId,
            cadenceMonths,
            graceDays: 30,
            lastConfirmedAt: now - Math.floor(rand() * 200) * DAY_MS,
            escalationState,
            nextDueAt:
              escalationState === "idle"
                ? now + Math.floor(rand() * 90 + 5) * DAY_MS
                : now - Math.floor(rand() * 40) * DAY_MS,
          })
        }
      }
    }

    // ── One scenario that can actually be driven end to end ─────────────────
    //
    // Everything above is random, which is right for the dashboard's numbers
    // and useless for exercising the review flow: the odds that some owner
    // happens to have a vault, heirs, *and* a verified claimant are
    // poor, and the first attempt at this seed produced a claim that tripped
    // both admin guards and could not be completed at all.
    //
    // So on request one owner is built deliberately to satisfy every
    // precondition of the happy path. Driving it is admin → approve → advance.
    if (args.withScenario === true) {
      const ownerId = await ctx.db.insert("users", {
        externalId: `${SEED_PREFIX}demo_owner`,
        name: "سلمى الدوسري",
        email: "seed-demo-owner@example.test",
        country: "SA",
        locale: "ar-SA",
        identityStatus: "verified" as const,
        identityVerifiedName: "سلمى بنت عبدالله الدوسري",
        identityVerifiedAt: now - 30 * DAY_MS,
        identityAttempts: 0,
        role: "owner" as const,
        subscription: { plan: "free", storageBytesUsed: 12_000_000 },
      })

      // The claimant needs an account, because `adminSetNameMatch` re-reads the
      // live `users.identityStatus` and refuses to approve anything else.
      const claimantId = await ctx.db.insert("users", {
        externalId: `${SEED_PREFIX}demo_claimant`,
        name: "بدر الدوسري",
        email: "seed-demo-claimant@example.test",
        locale: "ar-SA",
        identityStatus: "verified" as const,
        identityVerifiedName: "بدر بن سلمان الدوسري",
        identityVerifiedAt: now - 2 * DAY_MS,
        identityAttempts: 0,
        role: "owner" as const,
      })

      await ctx.db.insert("keyring", {
        userId: ownerId,
        mkWrappedByRecovery: fakeBytes(72),
        paperVersion: 1,
        paperPrintedAt: now - 20 * DAY_MS,
        rotatedAt: now - 20 * DAY_MS,
      })

      for (const heir of [
        { name: "بدر الدوسري", relation: "ابن" },
        { name: "نورة الدوسري", relation: "ابنة" },
      ]) {
        await ctx.db.insert("heirs", {
          userId: ownerId,
          ...heir,
          phone: "+966551234567",
          mode: "silent" as const,
          inviteStatus: "none" as const,
          routingChangedAt: now - 10 * DAY_MS,
        })
      }

      // The certificate name deliberately differs from the owner's verified
      // name only in transliteration and honorific — which is the judgement the
      // reviewer is there to make, rather than a case any string comparison
      // could settle.
      await ctx.db.insert("claims", {
        subjectUserId: ownerId,
        claimantName: "بدر الدوسري",
        claimantContact: "seed-demo-claimant@example.test",
        claimantUserId: claimantId,
        claimantIdentityStatus: "verified" as const,
        certificateName: "سلمى عبدالله الدوسري",
        status: "submitted" as const,
      })
    }

    // A handful of claims across the lifecycle, so the queue and the status
    // tallies both have something to say.
    let claimCount = 0
    for (const status of CLAIM_SPREAD) {
      const subjectUserId = ownerIds[Math.floor(rand() * ownerIds.length)]!
      await ctx.db.insert("claims", {
        subjectUserId,
        claimantName: `${pick(FIRST)} ${pick(LAST)}`,
        claimantContact: `claimant${claimCount}@example.test`,
        claimantIdentityStatus: pick(["verified", "verified", "pending", "unverified"] as const),
        certificateName: rand() < 0.6 ? "death-certificate.pdf" : undefined,
        status,
        vetoDeadline:
          status === "awaiting_veto"
            ? now + Math.floor(rand() * 25 + 2) * DAY_MS
            : undefined,
        lockedUntil: status === "vetoed" ? now + 90 * DAY_MS : undefined,
      })
      claimCount += 1
    }

    return { owners: ownerIds.length, claims: claimCount }
  },
})

/**
 * Remove every seeded row, and only seeded rows.
 *
 * Walks outward from the `seed_` owners rather than filtering each child table
 * on a marker of its own: a child row is seeded exactly when its owner is, and
 * deriving it that way means a table added later cannot be forgotten in a
 * predicate. `auditLog` is untouched — it is append-only, which is also why the
 * seed never writes to it.
 */
export const wipe = internalMutation({
  args: {},
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(2000)
    const seeded = users.filter((user) =>
      user.externalId.startsWith(SEED_PREFIX)
    )
    const seededIds = new Set(seeded.map((user) => user._id as string))

    let deleted = 0

    for (const user of seeded) {
      for (const table of [
        "devices",
        "keyring",
        "assets",
        "heirs",
        "checkinConfig",
        "notifications",
      ] as const) {
        const rows = await ctx.db
          .query(table)
          .withIndex("by_userId", (q) => q.eq("userId", user._id))
          .take(500)
        for (const row of rows) {
          await ctx.db.delete(table, row._id)
          deleted += 1
        }
      }

      // `assetRecipients` has no `by_userId` index on its own — its indexes all
      // pair `userId` with a recipient column — so it is reached through the
      // kind buckets, which together cover every row.
      for (const kind of ["heir", "executor", "allHeirs"] as const) {
        const rows = await ctx.db
          .query("assetRecipients")
          .withIndex("by_userId_and_recipientKind", (q) =>
            q.eq("userId", user._id).eq("recipientKind", kind)
          )
          .take(500)
        for (const row of rows) {
          await ctx.db.delete("assetRecipients", row._id)
          deleted += 1
        }
      }

      const claims = await ctx.db
        .query("claims")
        .withIndex("by_subjectUserId", (q) => q.eq("subjectUserId", user._id))
        .take(200)
      for (const claim of claims) {
        await ctx.db.delete("claims", claim._id)
        deleted += 1
      }
    }

    for (const user of seeded) {
      await ctx.db.delete("users", user._id)
      deleted += 1
    }

    return { owners: seeded.length, rowsDeleted: deleted, kept: users.length - seededIds.size }
  },
})

/**
 * Every table except `auditLog`, and every stored file. Dev only.
 *
 * `seed:wipe` is the surgical one — it walks out from `seed_` owners and can
 * only ever touch rows it made. This is the blunt one, for taking a dev
 * deployment back to empty so a real account can be walked from sign-up to a
 * released box. **It deletes real users**, which `wipe` is built never to do.
 *
 * ## `auditLog` survives, and that is not an oversight
 *
 * The log is append-only, enforced by `scripts/verify-invariants.mjs`, which
 * fails the build on any `.delete("auditLog")` anywhere in the tree. A purge is
 * not a good enough reason to put a delete path into the one table whose value
 * is that it has none. Its rows will outlive the users they name; on a dev
 * deployment that is cosmetic.
 *
 * ## A purged user cannot sign in again until Clerk re-sends them
 *
 * `users` rows are written only by the `user.created` / `user.updated`
 * webhook — never lazily on sign-in — so an account whose row is gone will
 * throw from `getCurrentUserOrThrow` while its Clerk identity still exists.
 * **Delete the matching users in the Clerk dashboard too**, or the deployment is
 * empty but the accounts pointing at it are broken rather than fresh.
 *
 * Batched and self-scheduling, like `claims.advance`: a mutation has a write
 * ceiling and a seeded deployment is a few thousand rows. Idempotent — a second
 * call on an empty deployment returns `{ deleted: 0, done: true }`.
 *
 * ## Quoting, which differs by shell and fails confusingly
 *
 * PowerShell strips quotes on their way to a native process, so the bash form
 * arrives as `{confirm:purge-everything}` and JSON5 rejects it at the unquoted
 * value. `--%` does not help — it reaches `convex` as a third argument — and
 * nor does putting the JSON in a variable.
 *
 * ```powershell
 * npx convex run seed:purgeAll '{\"confirm\":\"purge-everything\"}'
 * ```
 * ```bash
 * npx convex run seed:purgeAll '{"confirm":"purge-everything"}'
 * ```
 */
const PURGE_TABLES = [
  "notifications",
  "deliveries",
  "jobRuns",
  "releaseBundles",
  "assetRecipients",
  "assets",
  "heirs",
  "checkinConfig",
  "keyring",
  "devices",
  "claims",
  // Last: everything above is reached from a user, so a half-finished purge
  // leaves children with an owner rather than orphans.
  "users",
] as const

/** Rows per table per pass. Well under the mutation ceiling with room to spare. */
const PURGE_BATCH = 400

export const purgeAll = internalMutation({
  args: { confirm: v.literal("purge-everything") },
  handler: async (ctx) => {
    let deleted = 0

    // Stored blobs first: an asset row is the only thing that names them, so
    // dropping the rows first would strand the files with nothing pointing at
    // them.
    const files = await ctx.db.system.query("_storage").take(PURGE_BATCH)
    for (const file of files) {
      await ctx.storage.delete(file._id)
      deleted += 1
    }

    for (const table of PURGE_TABLES) {
      const rows = await ctx.db.query(table).take(PURGE_BATCH)
      for (const row of rows) {
        await ctx.db.delete(table, row._id)
        deleted += 1
      }
    }

    // Anything deleted means a table may still have more behind it.
    if (deleted > 0) {
      await ctx.scheduler.runAfter(0, internal.seed.purgeAll, {
        confirm: "purge-everything",
      })
    }

    return { deleted, done: deleted === 0 }
  },
})

/**
 * Put every account back to "identity never attempted". Dev only.
 *
 * The cheap half of `purgeAll` for the one loop that is walked over and over:
 * re-running the Didit flow otherwise means purging the whole deployment *and*
 * deleting the Clerk user, because nothing else clears `identityStatus`.
 * `adminResetAttempts` is not that — it clears the counter, keeps the status,
 * and requires an admin.
 *
 * Clears the session id too. Leaving it would hand the next webhook a user to
 * resolve by a session that belongs to an attempt nobody is making any more.
 */
export const resetIdentity = internalMutation({
  args: { confirm: v.literal("reset-identity") },
  handler: async (ctx) => {
    const users = await ctx.db.query("users").take(2000)
    for (const user of users) {
      await ctx.db.patch("users", user._id, {
        identityStatus: undefined,
        diditSessionId: undefined,
        identityAttempts: undefined,
        identityVerifiedName: undefined,
        identityDocType: undefined,
        identityVerifiedAt: undefined,
      })
    }
    return { users: users.length }
  },
})

// ── Driving the release path end to end on dev ──────────────────────────────
//
// The real flow waits on a Didit session and a thirty-day objection period.
// These two helpers compress exactly those waits and nothing else: the report
// enters `awaiting_veto` already elapsed and the real `claims.advance` releases
// it, and a simulated verdict goes through the real
// `identity.applyWebhookResult`. Both refuse on a production deployment.

function assertNotProduction(): void {
  if (process.env.WASSIYA_ENV === "production") {
    throw new Error("Refusing to fast-forward on a production deployment")
  }
}

/**
 * File an approved report against `subjectUserId` whose objection period has
 * already run out, then run the release sweep so real deliveries are created.
 *
 * ```bash
 * npx convex run seed:fastForwardRelease '{"confirm":"fast-forward","subjectUserId":"…","reporterUserId":"…"}'
 * ```
 */
export const fastForwardRelease = internalMutation({
  args: {
    confirm: v.literal("fast-forward"),
    subjectUserId: v.id("users"),
    reporterUserId: v.id("users"),
  },
  handler: async (ctx, { subjectUserId, reporterUserId }) => {
    assertNotProduction()
    const subject = await ctx.db.get("users", subjectUserId)
    const reporter = await ctx.db.get("users", reporterUserId)
    if (subject === null || reporter === null) throw new Error("Unknown user")

    const now = Date.now()
    const claimId = await ctx.db.insert("claims", {
      subjectUserId,
      subjectEmail: subject.email ?? undefined,
      claimantName: reporter.name ?? "Dev reporter",
      claimantContact: reporter.email ?? "dev",
      claimantUserId: reporterUserId,
      claimantIdentityStatus: "verified" as const,
      certificateName: subject.identityVerifiedName ?? subject.name ?? "—",
      nameMatch: true,
      status: "awaiting_veto" as const,
      reviewedAt: now - VETO_WINDOW_DAYS * FLOW_DAY_MS,
      vetoDeadline: now - 1,
      updatedAt: now,
    })
    await ctx.scheduler.runAfter(0, internal.claims.advance, {})
    return { claimId }
  },
})

/**
 * Stand in for a Didit verdict on `userId`, through the real webhook handler.
 * `idNumber` is hashed exactly as `http.ts` hashes a document number.
 *
 * ```bash
 * npx convex run seed:simulateDidit '{"confirm":"simulate-didit","userId":"…","verifiedName":"…","idNumber":"…","birthDate":"1990-04-21"}'
 * ```
 */
export const simulateDidit = internalAction({
  args: {
    confirm: v.literal("simulate-didit"),
    userId: v.id("users"),
    verifiedName: v.string(),
    idNumber: v.optional(v.string()),
    birthDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    assertNotProduction()
    await ctx.runMutation(internal.identity.applyWebhookResult, {
      sessionId: `dev-sim-${args.userId}`,
      vendorData: args.userId,
      status: "verified",
      verifiedName: args.verifiedName,
      docType: "Identity Card",
      docHashes:
        args.idNumber === undefined
          ? undefined
          : [await identityNumberHash(args.idNumber)],
      birthDate: args.birthDate,
    })
    return null
  },
})

