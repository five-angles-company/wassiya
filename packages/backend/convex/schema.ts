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
    .index("by_email", ["email"]),

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

  // One active row per user: the recovery leg of the 2-of-3. The server holds
  // the wrapper and the guardian's sealed half, and never the paper share.
  keyring: defineTable({
    userId: v.id("users"),
    mkWrappedByRecovery: v.bytes(),
    paperVersion: v.number(),
    paperPrintedAt: v.optional(v.number()),
    paperUsedAt: v.optional(v.number()),
    guardianId: v.optional(v.id("guardians")),
    guardianShareSealed: v.optional(v.bytes()),
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
    .index("by_guardianUserId_and_status", ["guardianUserId", "status"]),

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
    title: v.string(),
    // Non-sensitive only: counts, sizes, mime, reminder dates. Never a secret,
    // never a filename that gives away contents.
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
    // "silent" heirs learn nothing until release; "notified" ones know they are
    // named and see no content either way.
    mode: v.union(v.literal("silent"), v.literal("notified")),
    inviteStatus: v.union(
      v.literal("none"),
      v.literal("invited"),
      v.literal("accepted")
    ),
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
    ]),

  claims: defineTable({
    subjectUserId: v.id("users"),
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
      v.literal("locked")
    ),
    vetoDeadline: v.optional(v.number()),
    lockedUntil: v.optional(v.number()),
    guardianConfirmedAt: v.optional(v.number()),
  })
    .index("by_subjectUserId", ["subjectUserId"])
    .index("by_subjectUserId_and_claimantContact", [
      "subjectUserId",
      "claimantContact",
    ])
    .index("by_claimantUserId", ["claimantUserId"])
    // The admin review queue, and the scheduler's veto-expiry sweep.
    .index("by_status", ["status"])
    .index("by_status_and_vetoDeadline", ["status", "vetoDeadline"]),

  // Append-only. `audit.ts` exposes an internal insert and an owner-only read,
  // and there is deliberately no mutation anywhere that patches or deletes it.
  auditLog: defineTable({
    userId: v.id("users"),
    event: v.string(),
    deviceId: v.optional(v.id("devices")),
    meta: scalarRecord,
    at: v.number(),
  }).index("by_userId_and_at", ["userId", "at"]),

  notifications: defineTable({
    userId: v.id("users"),
    kind: v.string(),
    payload: scalarRecord,
    readAt: v.optional(v.number()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_readAt", ["userId", "readAt"]),
})
