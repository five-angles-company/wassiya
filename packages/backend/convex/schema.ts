import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// Wassiya's data model. The rule that shapes every table here: the server may
// hold ciphertext and non-sensitive metadata, never plaintext key material.
// Anything typed `v.bytes()` below is output from `@workspace/crypto` and is
// opaque to this deployment — see AGENTS.md "Wassiya product rules".

const identityStatus = v.union(
  v.literal("unverified"),
  v.literal("pending"),
  v.literal("verified"),
  v.literal("rejected")
)

// Audit meta and notification payloads are deliberately typed as scalars only.
// There is no shape of this record that can carry a `v.bytes()` field, so key
// material cannot be smuggled into the two tables that get read the most.
const scalarRecord = v.record(
  v.string(),
  v.union(v.string(), v.number(), v.boolean(), v.null())
)

export default defineSchema({
  // Clerk users, synced by the webhook in http.ts. Clerk owns the profile; this
  // table exists so functions can join user data without a network call and so
  // other tables have a stable `Id<"users">` to reference.
  //
  // Every Wassiya field is optional so the Clerk webhook's upsert keeps working
  // for a user who has not onboarded yet — and `upsertFromClerk` patches only
  // the three Clerk-owned fields, so a sync can never clobber them.
  users: defineTable({
    // The Clerk user id — the `sub` claim of the JWT Convex validates.
    externalId: v.string(),
    name: v.union(v.string(), v.null()),
    email: v.union(v.string(), v.null()),

    // Onboarding profile. Country is a parameter, never a branch.
    country: v.optional(v.string()), // ISO 3166-1 alpha-2
    locale: v.optional(v.string()), // BCP 47, e.g. "ar-SA"
    criticalContacts: v.optional(
      v.array(v.object({ kind: v.string(), value: v.string() }))
    ),

    // Didit identity verification. Blocking for owners at onboarding.
    identityStatus: v.optional(identityStatus),
    identityVerifiedName: v.optional(v.string()),
    identityDocType: v.optional(v.string()),
    identityVerifiedAt: v.optional(v.number()),
    diditSessionId: v.optional(v.string()),
    // Failed Didit attempts. Incremented in `applyWebhookResult` on a
    // rejection, not when a session opens — the flow caps *failures* at three,
    // and a user who merely dismisses the hosted flow has not failed anything.
    identityAttempts: v.optional(v.number()),

    // "admin" gates the claims-review functions used by apps/admin. Assigned
    // out of band (dashboard / CLI), never by anything a client can call.
    role: v.optional(v.union(v.literal("owner"), v.literal("admin"))),

    /** Name + email, for the console's owner search. See the index below. */
    searchText: v.optional(v.string()),

    subscription: v.optional(
      v.object({
        plan: v.string(),
        renewsAt: v.optional(v.number()),
        storageBytesUsed: v.optional(v.number()),
      })
    ),
  })
    .index("by_externalId", ["externalId"])
    // The Didit webhook identifies the subject by session id, not by JWT.
    .index("by_diditSessionId", ["diditSessionId"])
    // How a death claim names the deceased. See `claims.submit`, which answers
    // uniformly whether or not the lookup hits, so this is not an oracle.
    .index("by_email", ["email"])
    // The admin console's identity breakdown and activation funnel. `admin.ts`
    // predicted this one: counting verification states without it means reading
    // the whole table, which is the shape this backend avoids everywhere else.
    // Rows predating the seeding of `identityStatus` sit outside every range —
    // `upsertFromClerk` has always seeded it on insert, so that set is empty,
    // but the funnel reports its total as the sum of the buckets rather than a
    // separate table count so the two can never disagree.
    .index("by_identityStatus", ["identityStatus"])
    /**
     * Name and email in one column, for the console's owner lookup.
     *
     * Denormalised for the same reason `claims.searchText` is: a Convex search
     * index searches exactly one field, and an operator with a support ticket
     * has either a name or an address and should not have to know which box
     * takes which. Written by `upsertFromClerk`, which is the only thing that
     * writes either half — `saveProfile` touches country, locale and contacts
     * and nothing else, so there is one place to keep in step rather than two.
     */
    .searchIndex("search_owner", { searchField: "searchText" }),

  // Device inventory for the settings screen and for revocation. The enclave
  // wrap of MK never leaves the device, so there is no ciphertext column here —
  // revoking a row is a UX and audit act, and the device's local copy of MK is
  // what its own OS keystore controls.
  devices: defineTable({
    userId: v.id("users"),
    // Client-generated, written to the device keystore *before* the first
    // `register` call, so a crash between the two cannot mint a duplicate row
    // on retry. It identifies an install, not a person.
    installId: v.string(),
    name: v.string(),
    platform: v.union(v.literal("ios"), v.literal("android"), v.literal("web")),
    lastUnlockAt: v.optional(v.number()),
    revoked: v.boolean(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_installId", ["userId", "installId"]),

  // One active row per user: the recovery leg, which is 1-of-1. The server
  // holds the wrapper and never the paper share — and no longer holds a
  // guardian half, because K_rec = S_paper alone. `paperVersion` is bound into
  // the wrapper's AAD, so the two are written together or not at all.
  keyring: defineTable({
    userId: v.id("users"),
    mkWrappedByRecovery: v.bytes(),
    paperVersion: v.number(),
    /**
     * Which construction built `mkWrappedByRecovery`. **Absent means v1** — the
     * old `S_paper ⊕ S_guardian` with no AAD, which the current code cannot
     * open and must never try to.
     *
     * It cannot be inferred from `paperVersion`: a v1 wrapper can sit at paper
     * version 3, because reprinting rotated the sheet without changing the
     * construction. Without this field the break is silent — the owner's sheet
     * simply stops working on the day they need it, which is the one day they
     * cannot recover from. `setup-flow` reads it to force a re-wrap **while the
     * device still holds MK**, which is the only window in which it is fixable.
     */
    wrapperVersion: v.optional(v.number()),
    paperPrintedAt: v.optional(v.number()),
    paperUsedAt: v.optional(v.number()),
    rotatedAt: v.number(),
  }).index("by_userId", ["userId"]),

  guardians: defineTable({
    userId: v.id("users"),
    // Bound at accept time, once the guardian signs up through Clerk.
    guardianUserId: v.optional(v.id("users")),
    name: v.string(),
    relation: v.string(),
    status: v.union(
      v.literal("invited"),
      v.literal("accepted"),
      v.literal("revoked")
    ),
    // Published by the guardian's device at accept; a public key, not a secret.
    x25519PublicKey: v.optional(v.bytes()),
    inviteToken: v.string(),
    inviteExpiresAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_inviteToken", ["inviteToken"])
    .index("by_guardianUserId_and_status", ["guardianUserId", "status"])
    // "How many guardianships are actually live?", for the console.
    // `by_guardianUserId_and_status` cannot answer it: that index is keyed on
    // the **guardian's** own user id, so it finds the vaults one person guards,
    // never the population of accepted guardianships.
    .index("by_status", ["status"]),

  assets: defineTable({
    userId: v.id("users"),
    type: v.union(
      v.literal("crypto"),
      v.literal("bank"),
      v.literal("document"),
      v.literal("photos"),
      v.literal("digital"),
      v.literal("note")
    ),
    // The asset's name and its at-a-glance subtitle, sealed under the asset's
    // own DEK by `@workspace/crypto/label`. Opaque here, like every other
    // `v.bytes()` column.
    //
    // Under the DEK rather than MK on purpose: heirs never receive MK, so a
    // label wrapped by it would reach an heir as content they hold the key to
    // and cannot name. This way the label travels with the asset.
    //
    // It is not a nicety. A plaintext `title` column would hold
    // "مصرف الراجحي" and "iCloud · fatima@icloud.com", which is precisely what
    // section ١ promises the server cannot read.
    labelSealed: v.bytes(),
    // Non-sensitive only: counts, sizes, mime, reminder dates. Never a secret,
    // never a filename that gives away contents. The descriptive half of a row
    // lives in `labelSealed`; anything here is a number the server may know.
    meta: v.object({
      itemCount: v.optional(v.number()),
      byteSize: v.optional(v.number()),
      mimeType: v.optional(v.string()),
      expiryRemindAt: v.optional(v.number()),
    }),
    dekWrappedByMk: v.bytes(),
    storageIds: v.array(v.id("_storage")),
    recipientRule: v.union(v.literal("default"), v.literal("explicit")),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_type", ["userId", "type"]),

  assetRecipients: defineTable({
    assetId: v.id("assets"),
    // Denormalised owner, so an authorisation check is one indexed read rather
    // than a join back through `assets`.
    userId: v.id("users"),
    recipient: v.union(
      v.object({ kind: v.literal("heir"), heirId: v.id("heirs") }),
      v.object({ kind: v.literal("executor") }),
      v.object({ kind: v.literal("allHeirs") })
    ),
    // Denormalised copies of the union's discriminant and its heir id, because
    // Convex indexes columns, not branches of a union. Both are written only by
    // `routing.setRecipients`, in the same statement as `recipient` itself.
    //
    // `recipientKind` is not redundant with `recipientHeirId`: executor and
    // allHeirs rows share `recipientHeirId: undefined`, so without it an
    // "allHeirs" lookup would have to scan every executor row and could silently
    // miss one past the take() window — which would drop an asset out of an
    // heir's bundle without any error.
    recipientKind: v.union(
      v.literal("heir"),
      v.literal("executor"),
      v.literal("allHeirs")
    ),
    recipientHeirId: v.optional(v.id("heirs")),
    instructionsCiphertext: v.optional(v.bytes()),
  })
    .index("by_assetId", ["assetId"])
    .index("by_userId_and_recipientHeirId", ["userId", "recipientHeirId"])
    .index("by_userId_and_recipientKind", ["userId", "recipientKind"]),

  heirs: defineTable({
    userId: v.id("users"),
    name: v.string(),
    relation: v.string(),
    phone: v.string(),
    /**
     * Every heir is silent: they learn nothing until release.
     *
     * There was a "notified" mode — invited, still seeing no content — and it
     * was removed as a product decision, not a cleanup. It never worked either:
     * nothing in this deployment has ever sent an invite, so `inviteStatus` was
     * only ever written as "none" and a notified heir sat at "pending" forever.
     *
     * Both stay as one-member unions rather than being dropped, because
     * removing a field a live document still carries fails schema validation.
     * Widening either back is one literal.
     */
    mode: v.literal("silent"),
    inviteStatus: v.literal("none"),
    // When this heir's routing last changed. Compared against the matching
    // `releaseBundles.rebuiltAt` to find heirs still owed a rebuild — see
    // `routing.staleHeirs`. Written only by `routing.setRecipients`.
    routingChangedAt: v.optional(v.number()),
    // The message itself is encrypted; only its kind and blob id live here.
    messageMeta: v.optional(
      v.object({
        kind: v.union(
          v.literal("text"),
          v.literal("audio"),
          v.literal("video")
        ),
        storageId: v.id("_storage"),
      })
    ),
  }).index("by_userId", ["userId"]),

  // One row per heir per rebuild. `serverShare` is the crown jewel: it is half
  // of K_h, and the ONLY public function permitted to return it is
  // `release.releasedBundleForHeir`, hard-gated on a released claim.
  releaseBundles: defineTable({
    userId: v.id("users"),
    heirId: v.id("heirs"),
    bundleStorageId: v.id("_storage"),
    serverShare: v.bytes(),
    guardianShareSealed: v.bytes(),
    rebuiltAt: v.number(),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_heirId", ["userId", "heirId"])
    .index("by_heirId", ["heirId"]),

  checkinConfig: defineTable({
    userId: v.id("users"),
    cadenceMonths: v.number(),
    graceDays: v.number(),
    lastConfirmedAt: v.number(),
    escalationState: v.union(
      v.literal("idle"),
      v.literal("day0"),
      v.literal("day7"),
      v.literal("day14"),
      v.literal("countdown")
    ),
    nextDueAt: v.number(),
  })
    .index("by_userId", ["userId"])
    // Drives the escalation cron; must never become a `filter` scan.
    //
    // Keyed on the state first so that advancing a row moves it OUT of the
    // bucket the sweep is draining. A plain `by_nextDueAt` index cannot do
    // that: an already-correct row stays at the front of the overdue window
    // forever and starves everything behind it. See `checkin.sweep`.
    .index("by_escalationState_and_nextDueAt", [
      "escalationState",
      "nextDueAt",
    ])
    // The console's overdue list. The compound index above cannot serve it:
    // its first key is the state, so ordering by due date across *several*
    // states — or none — is not a range it can express. One key, one order,
    // and "who is furthest past due" reads the same however the states are
    // filtered.
    .index("by_nextDueAt", ["nextDueAt"]),

  claims: defineTable({
    /**
     * The vault this claim is against — **absent when the address matched no
     * vault**, which is a real and expected state rather than a broken row.
     *
     * Filing used to insert nothing at all in that case, so a bereaved person
     * filled in the form and was then shown "no reports yet". Every filing is
     * now a claim; this column is what tells a matched one from an unmatched.
     *
     * ⚠️ An unmatched claim can never leave `submitted` except to `closed`:
     * `adminSetNameMatch` is the only way forward and it refuses a claim with
     * no subject. So every guarded path downstream — `guardianConfirm`,
     * `release.*`, `pendingApprovals` — only ever sees a claim that has one,
     * and `requireSubject` in `claims.ts` is where that is asserted rather
     * than assumed.
     */
    subjectUserId: v.optional(v.id("users")),
    /**
     * The address the claimant typed, normalised (`trim().toLowerCase()`)
     * **server-side**.
     *
     * Kept whether or not it matched, because it is the only way to resolve an
     * unmatched claim later — a typo is by far the commonest cause, and staff
     * need to see what was actually entered. It is also the honest dedupe and
     * lockout key: the old one was the typed contact string, which a claimant
     * can simply change.
     */
    subjectEmail: v.optional(v.string()),
    claimantName: v.string(),
    claimantContact: v.string(),
    // Set once the claimant signs in through Clerk, so their own client can
    // read the claim back without a token in the URL.
    claimantUserId: v.optional(v.id("users")),
    // Which heir record this claimant is, set by the guardian/admin review.
    // Until it is set there is nothing to release, whatever the status says.
    heirId: v.optional(v.id("heirs")),
    claimantIdentityStatus: identityStatus,
    certificateStorageId: v.optional(v.id("_storage")),
    certificateName: v.optional(v.string()),
    // Admin-set: does the certificate name match the owner's verified legal
    // name? Never derived by string comparison in code.
    nameMatch: v.optional(v.boolean()),
    status: v.union(
      v.literal("submitted"),
      v.literal("awaiting_veto"),
      v.literal("vetoed"),
      v.literal("guardian_review"),
      v.literal("released"),
      v.literal("locked"),
      /**
       * Ended without a verdict — today only "no vault matched that address".
       *
       * Distinct from `locked`, which is a refusal after review and carries a
       * 90-day bar. `closed` carries none: the commonest cause is a typo, and
       * the right next step is to file again with the right address.
       */
      v.literal("closed")
    ),
    vetoDeadline: v.optional(v.number()),
    lockedUntil: v.optional(v.number()),
    guardianConfirmedAt: v.optional(v.number()),

    /**
     * Why a claim closed, in terms a claimant may safely be told.
     *
     * ⚠️ Never carries a review verdict. `publicStatus` documents the rule: a
     * claimant who learns *which* check failed learns how to make it pass. A
     * rejection says only that review did not go further; `staffNote` is where
     * the actual reason lives, and it never leaves the console.
     */
    closedReason: v.optional(
      v.union(v.literal("no_vault_matched"), v.literal("review_failed"))
    ),
    /** Admin-only. Never returned to a claimant or a guardian by any function. */
    staffNote: v.optional(v.string()),

    /**
     * When this claim last moved, and when it entered each state that has no
     * timestamp of its own.
     *
     * The case page is a timeline, and a timeline needs dates. Before these
     * the only ones a claim carried were `_creationTime`, `guardianConfirmedAt`
     * and `vetoDeadline` — so four of a heir's eight steps could be shown as
     * done but never as *when*.
     *
     * The audit log records all of it and cannot serve this: it is keyed on the
     * **subject's** `userId`, so a claimant reading it would read the owner's
     * check-ins, devices and recovery history.
     *
     * Five nullable timestamps rather than a `claimEvents` table because the
     * flow is strictly linear and each state is entered exactly once —
     * `attachCertificate` refuses anything but `submitted`, so even the
     * document cannot arrive twice. An event table earns its place the day an
     * event repeats or needs an actor, and can be added then without changing
     * any of this.
     *
     * ⚠️ `updatedAt` has no trigger. Convex has none, so every writer must
     * stamp it and a missed one fails silently — the same trap `searchText`
     * documents above. `patchClaim` in `claims.ts` is the only thing allowed
     * to write this table, and `scripts/verify-invariants.mjs` fails the build
     * if anything else calls `ctx.db.patch` on it.
     */
    updatedAt: v.optional(v.number()),
    certificateAttachedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    releasedAt: v.optional(v.number()),
    closedAt: v.optional(v.number()),
    /**
     * Claimant name, contact and certificate name in one string, for the
     * console's search box.
     *
     * Denormalised because a Convex search index searches exactly **one**
     * field, and an operator typing into a single box expects it to match any
     * of the three — the contact is rendered directly under the name in the
     * table, so searching it and getting nothing is the first thing they would
     * try. Maintained by `setSearchText` in `claims.ts`; optional only so rows
     * written before it existed still validate.
     */
    searchText: v.optional(v.string()),
  })
    .index("by_subjectUserId", ["subjectUserId"])
    // Sorting the console's workspace by claimant. The only sort other than
    // creation order that the table offers, because each one costs an index.
    .index("by_claimantName", ["claimantName"])
    // The console's search box. No `filterFields`: status is a multi-select
    // there and a search filter field only supports equality on one value, so
    // the statuses are applied with `.filter()` after the search instead.
    .searchIndex("search_text", { searchField: "searchText" })
    // What a guardian is being asked about, per vault they guard. Without it
    // `guardians.pendingApprovals` reads a fixed window of a subject's claims
    // and filters by status in memory — so a subject with more claims than the
    // window could hide a real one from its guardian, silently and with no
    // error. Every barred re-attempt inserts a row, so that window fills.
    .index("by_subjectUserId_and_status", ["subjectUserId", "status"])
    .index("by_subjectUserId_and_claimantContact", [
      "subjectUserId",
      "claimantContact",
    ])
    .index("by_claimantUserId", ["claimantUserId"])
    // The claimant's own cases, split by state. The Didit webhook reads it to
    // notify each open claim when a verification lands, and it is what lets a
    // case list separate open from closed without scanning.
    .index("by_claimantUserId_and_status", ["claimantUserId", "status"])
    // Dedupe and the 90-day veto lockout, keyed on the *person* and the address
    // they filed against. The old key was `claimantContact` — a typed string,
    // so a vetoed claimant escaped their own bar by entering a different phone
    // number. It also works for unmatched claims, which have no subject id.
    .index("by_claimantUserId_and_subjectEmail", [
      "claimantUserId",
      "subjectEmail",
    ])
    // The admin review queue, and the scheduler's veto-expiry sweep.
    .index("by_status", ["status"])
    // The unmatched queue: `.eq("status", "submitted").eq("subjectUserId", undefined)`.
    // `undefined` is a real index value in Convex — `notifications` already
    // ranges on it via `by_userId_and_readAt`.
    .index("by_status_and_subjectUserId", ["status", "subjectUserId"])
    .index("by_status_and_vetoDeadline", ["status", "vetoDeadline"]),

  // Append-only. `audit.ts` exposes an internal insert and an owner-only read,
  // and there is deliberately no mutation anywhere that patches or deletes it.
  auditLog: defineTable({
    userId: v.id("users"),
    event: v.string(),
    deviceId: v.optional(v.id("devices")),
    meta: scalarRecord,
    at: v.number(),
  })
    .index("by_userId_and_at", ["userId", "at"])
    // Read across every account, newest first — the console's email log, and
    // the Records group's audit view after it. Without it "what happened
    // recently" is a full scan of the one table that only ever grows.
    .index("by_at", ["at"]),

  /**
   * A heartbeat per cron invocation.
   *
   * The audit log records *effects*: `checkin.escalated` when a rung advances,
   * `claim.released` when a claim does. An hourly sweep that correctly finds
   * nothing due writes nothing at all — so "the switch is quiet" and "the
   * switch is dead" are the same absence of data, in a product where the second
   * one means no estate is ever delivered.
   *
   * This separates them. One row per invocation, written from the counts both
   * crons already return and currently hand to a scheduler that discards them.
   *
   * `rescheduled` marks a full batch that queued a continuation, so one logical
   * run can be several rows — which is why the console shows the most recent
   * run *and* the most recent one that changed something.
   */
  jobRuns: defineTable({
    name: v.string(),
    ranAt: v.number(),
    scanned: v.number(),
    changed: v.number(),
    rescheduled: v.boolean(),
  }).index("by_name_and_ranAt", ["name", "ranAt"]),

  notifications: defineTable({
    userId: v.id("users"),
    kind: v.string(),
    payload: scalarRecord,
    /**
     * The claim this is about, where there is one.
     *
     * A column rather than a `payload` key because `payload` is a `v.record`
     * and therefore unindexable — the same reason `auditLog` cannot answer
     * "everything about this claim" without a scan. This is what lets a case
     * page carry its own history instead of filtering a global feed.
     *
     * Optional because the owner-facing kinds (`checkin.*`, `recovery.*`) are
     * about a vault rather than a claim.
     */
    claimId: v.optional(v.id("claims")),
    readAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_readAt", ["userId", "readAt"])
    .index("by_userId_and_claimId", ["userId", "claimId"]),
})
