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
    // Keyed hashes of every identity number read off the verified document
    // (document number, personal number) — see `model/identityHash.ts`. What
    // an executor's delivery is matched against. Never the numbers themselves.
    identityDocHashes: v.optional(v.array(v.string())),
    // As printed on the verified document, "YYYY-MM-DD".
    identityBirthDate: v.optional(v.string()),
    // When the owner last confirmed every executor's phone and email are
    // still theirs, and that each still has their sheet. Numbers get recycled
    // and paper gets lost; the yearly prompt is the cheapest defence.
    executorsConfirmedAt: v.optional(v.number()),
    diditSessionId: v.optional(v.string()),
    // Failed Didit attempts. Incremented in `applyWebhookResult` on a
    // rejection, not when a session opens — the flow caps *failures* at three,
    // and a user who merely dismisses the hosted flow has not failed anything.
    identityAttempts: v.optional(v.number()),

    // ⚠️ Two different words called "owner" live in this schema. **This column
    // says what kind of account the row is**: "owner" is a vault-owning
    // customer, "admin" is a staff account. It is not authority — it is what
    // the console's owner metrics exclude, which is why `admin.ts` filters on
    // it. What a staff member may actually *do* is `staffPermissions` below,
    // and the seeded staff role called "Owner" is a superuser, not a customer.
    // Compare this field only through `isStaffAccount` / `excludeStaff` in
    // `model/access.ts`; `verify-invariants.mjs` fails the build on a raw
    // comparison anywhere else.
    role: v.optional(v.union(v.literal("owner"), v.literal("admin"))),

    /**
     * Staff authority: the roles this person holds, and the union of their
     * permission keys.
     *
     * `staffPermissions` is **denormalised** from `staffRoles`, deliberately.
     * Resolving roles per call would put every role document into every gated
     * query's read set, so renaming a role would invalidate the whole console;
     * this way a gated query depends on exactly one document — this one — and
     * revoking a role re-runs the victim's open tabs within the round trip.
     *
     * ⚠️ The price: **whatever edits a role must recompute its holders in the
     * same mutation** (`recomputeHolders` in `model/staff.ts`). A missed
     * fan-out leaves an open console running on rights that were taken away,
     * and nothing surfaces it. `verify-invariants.mjs` enforces the pairing.
     *
     * `["*"]` is the system Owner role and matches every key, including keys
     * added by a later deploy — an enumeration would lock the administrator
     * out of each new permission on the day it shipped.
     */
    staffRoleIds: v.optional(v.array(v.id("staffRoles"))),
    staffPermissions: v.optional(v.array(v.string())),
    staffSince: v.optional(v.number()),

    /** Name + email, for the console's owner search. See the index below. */
    searchText: v.optional(v.string()),

    // Entitlement, and nothing else. Written by exactly two paths — the
    // RevenueCat webhook (`billing.applyStoreEvent`) and the audited staff
    // grant (`billing.adminSetPlan`) — because any third one is a free
    // subscription for whoever reads the app bundle. Enforced by
    // `scripts/verify-invariants.mjs`, which is why usage lives outside this
    // object: a counter bumped on every upload would have to be an exception
    // to the rule, and that is how exceptions start.
    subscription: v.optional(
      v.object({
        plan: v.union(v.literal("free"), v.literal("annual")),
        renewsAt: v.optional(v.number()),
        source: v.optional(v.union(v.literal("store"), v.literal("staff"))),
        productId: v.optional(v.string()),
        store: v.optional(
          v.union(v.literal("app_store"), v.literal("play_store"))
        ),
        /** Superseded by the top-level counter; delete once backfilled. */
        storageBytesUsed: v.optional(v.number()),
      })
    ),
    // Denormalised because Convex has no sum operator and adding up every
    // asset would not scale. Counts are not denormalised — see
    // `model/entitlements.ts` for why bytes are the only thing that has to be.
    storageBytesUsed: v.optional(v.number()),

    // Set when a death report against this owner is released. A closed vault
    // refuses recovery and new devices, so the printed sheet cannot open, after
    // death, what the owner chose to let die with them. The one way back is
    // `claims.reopenVault`, run by hand for an owner proven alive.
    vaultClosedAt: v.optional(v.number()),

    // This account's limits, overriding its plan's field by field. For a pilot,
    // a support case, an owner who needs more room than their tier gives.
    //
    // An absent field is not an override, and `null` means unlimited — the two
    // have to stay distinguishable, so this cannot collapse to a plain number.
    //
    // It is entitlement, so it has the same two writers `subscription` has and
    // `verify-invariants` enforces that. An override is the quietest way to
    // give the product away: nothing about the account looks unusual, and it
    // stops matching the plan every screen says it is on.
    limitsOverride: v.optional(
      v.object({
        storageBytes: v.optional(v.union(v.number(), v.null())),
        assets: v.optional(v.union(v.number(), v.null())),
        executors: v.optional(v.union(v.number(), v.null())),
        photos: v.optional(v.boolean()),
        maxFileBytes: v.optional(v.union(v.number(), v.null())),
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
    // Staff are tens of rows in a table of customers. Without this, listing
    // them is a scan that gets slower as the product succeeds — and the role
    // fan-out above needs the same read on every role edit.
    .index("by_role", ["role"])
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

  /**
   * What a staff role may do.
   *
   * The split that shapes this table: **permission keys are code**
   * (`model/permissions.ts`, a deploy), **which keys a role holds is data**
   * (this table, an Owner in the console), and **which roles a person holds**
   * is `users.staffRoleIds`. A role is therefore editable without a deploy,
   * while the set of things that can be gated is not — nobody can invent
   * authority by typing a new string into a form.
   *
   * `permissions` is `v.string()` rather than the catalogue union on purpose:
   * a row written today must keep validating after a key is renamed in code.
   * The *mutation* rejects unknown keys, and resolution drops them, so an
   * orphan is inert rather than a schema failure on an unrelated deploy.
   *
   * Names are stored rather than kept in the console's string dictionaries
   * because the roles are the operator's, not ours — a role they created has
   * no key for a dictionary to be written against.
   */
  staffRoles: defineTable({
    /** Stable slug for the seeded roles; absent on an operator-made role. */
    key: v.optional(v.string()),
    name: v.object({ ar: v.string(), en: v.string() }),
    description: v.optional(v.object({ ar: v.string(), en: v.string() })),
    /** Catalogue keys, or the single entry `"*"` on the system Owner role. */
    permissions: v.array(v.string()),
    /** The Owner role: immutable, undeletable, and the only holder of `"*"`. */
    system: v.boolean(),
    createdBy: v.optional(v.id("users")),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  /**
   * A pending staff invitation.
   *
   * Staff are onboarded by email: an Owner names an address and the roles it
   * should get, and the invitation binds when a *Clerk-verified* account with
   * that address appears — see `bindInvitation` in `model/staff.ts`, which is
   * the only thing that may turn one of these into authority.
   *
   * Expiry is computed from `expiresAt`, never stored as a status. A sweep to
   * write "expired" would earn a row in the `jobs.ts` registry, and an
   * invitation nobody accepted is not worth one.
   */
  staffInvitations: defineTable({
    /** Normalised `trim().toLowerCase()`; the binding compares on this. */
    email: v.string(),
    roleIds: v.array(v.id("staffRoles")),
    invitedBy: v.id("users"),
    invitedAt: v.number(),
    expiresAt: v.number(),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("revoked")
    ),
    acceptedUserId: v.optional(v.id("users")),
    acceptedAt: v.optional(v.number()),
  })
    .index("by_email_and_status", ["email", "status"])
    .index("by_status_and_invitedAt", ["status", "invitedAt"]),

  // Device inventory for the settings screen and for revocation. The enclave
  // wrap of MK never leaves the device, so there is no ciphertext column here —
  // revoking a row is a UX and audit act, and the device's local copy of MK is
  // what its own OS keystore controls.
  // The plan catalogue, editable from the console so a tier can move without a
  // deploy. `model/plans.ts` still holds the defaults and is what a deployment
  // with no rows runs on — a missing row must never be able to take the product
  // down, and a fresh deployment has none.
  //
  // Prices are deliberately absent. They are set per storefront and rendered
  // from the store's own `priceString`; a price here would be wrong in every
  // country but one. `key` is a literal union rather than a string because a
  // store product points at it: renaming a key orphans every subscriber on it.
  plans: defineTable({
    key: v.union(v.literal("free"), v.literal("annual")),
    storageBytes: v.union(v.number(), v.null()),
    assets: v.union(v.number(), v.null()),
    executors: v.union(v.number(), v.null()),
    photos: v.boolean(),
    maxFileBytes: v.union(v.number(), v.null()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  // Deployment settings an operator can change without the CLI.
  //
  // **One row.** A key/value table would give up Convex's validators and the
  // typed form that comes with them, and this is configuration, not data.
  //
  // **Settings only — never a credential.** Every field here is safe to read
  // off a database export: a sender address, a toggle, a phone number, a URL.
  // API keys, webhook signing secrets and the identity HMAC stay in the
  // deployment env, where a leaked table cannot reach them.
  // `settings.status` reports whether each of those is present, as a boolean,
  // and never returns one.
  //
  // Every field is optional and falls back to its environment variable — see
  // `model/settings.ts`. A fresh deployment with no row runs entirely on env,
  // which is what makes this safe to add to a live deployment.
  settings: defineTable({
    /** The envelope sender, e.g. "Wassiya <no-reply@wassiya.sa>". */
    emailFrom: v.optional(v.string()),
    /** Resend's own guard. On until someone deliberately goes live. */
    emailTestMode: v.optional(v.boolean()),
    outreachProvider: v.optional(
      v.union(v.literal("off"), v.literal("twilio"))
    ),
    /** An E.164 sender, or a Twilio Messaging Service SID ("MG…"). */
    twilioFrom: v.optional(v.string()),
    /** Where apps/web is. Every link in every email is built from it. */
    appUrl: v.optional(v.string()),
    /** Where apps/admin is. Only a staff invitation links there. */
    consoleUrl: v.optional(v.string()),
    updatedAt: v.number(),
  }),

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
    /**
     * Expo push token. A push never carries content — only that something is
     * waiting — because a lock screen is an intercepted surface.
     */
    pushToken: v.optional(v.string()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_installId", ["userId", "installId"]),

  // One active row per user: the recovery leg, which is 1-of-1. The server
  // holds the wrapper and never the paper share, because K_rec = S_paper alone. `paperVersion` is bound into
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
    // The release key under MK (`@workspace/crypto/release`): the owner's copy,
    // and after death the fallback that lets the owner's recovery sheet open
    // what was handed over. Absent until the phone first needs it.
    releaseKeyWrappedByMk: v.optional(v.bytes()),
  }).index("by_userId", ["userId"]),

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
    // Under the DEK rather than MK on purpose: executors never receive MK, so
    // a label wrapped by it would reach an executor as content they hold the
    // key to and cannot name. This way the label travels with the asset.
    //
    // It is not a nicety. A plaintext `title` column would hold
    // "مصرف الراجحي" and "iCloud · fatima@icloud.com", which is precisely what
    // section ١ promises the server cannot read.
    labelSealed: v.bytes(),
    // The type's secret fields as JSON, sealed under the DEK by
    // `@workspace/crypto/secret`. Absent for a type that is only files.
    secretSealed: v.optional(v.bytes()),
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
    // Each file is one encrypted blob, decryptable on its own; a photo carries
    // its thumbnail beside it.
    files: v.array(
      v.object({
        storageId: v.id("_storage"),
        thumbnailId: v.optional(v.id("_storage")),
      })
    ),
    // The DEK wrapped under the owner's release key, bound to owner and asset.
    // Present exactly while the asset is handed over; absent means private — it
    // dies with the owner, because nothing but MK can open it.
    dekWrappedByRelease: v.optional(v.bytes()),
  })
    .index("by_userId", ["userId"])
    .index("by_userId_and_type", ["userId", "type"]),

  // الأوصياء. Each receives everything handed over, alone. Silent in the app:
  // no invitation, no account, nothing before release — the owner hands them
  // their printed sheet, or leaves it with the paper will.
  executors: defineTable({
    userId: v.id("users"),
    name: v.string(),
    phone: v.string(),
    // A second channel at release: if the number was recycled, the email may
    // still reach the real executor, and the other way round.
    email: v.optional(v.string()),
    // Keyed hash of the national ID number — see `model/identityHash.ts`.
    // Required: their verified document is matched against it before any
    // delivery opens.
    idNumberHash: v.string(),
    // The release key under this executor's printed sheet. Absent until the
    // sheet is printed and confirmed; `version` is bound into the wrapper, so a
    // reprint voids the old sheet the moment it is saved.
    sheet: v.optional(
      v.object({
        releaseKeyWrapped: v.bytes(),
        version: v.number(),
        printedAt: v.number(),
      })
    ),
  }).index("by_userId", ["userId"]),

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
    .index("by_escalationState_and_nextDueAt", ["escalationState", "nextDueAt"])
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
     * no subject. So every guarded path downstream — `advance`, deliveries,
     * `release.*` — only ever sees a claim that has one,
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
    certificateStorageId: v.optional(v.id("_storage")),
    certificateName: v.optional(v.string()),
    // Admin-set: does the certificate name match the owner's verified legal
    // name? Never derived by string comparison in code.
    nameMatch: v.optional(v.boolean()),
    status: v.union(
      v.literal("submitted"),
      v.literal("awaiting_veto"),
      v.literal("vetoed"),
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
    /** Admin-only. Never returned to a claimant or an executor by any function. */
    staffNote: v.optional(v.string()),

    /**
     * When this claim last moved, and when it entered each state that has no
     * timestamp of its own.
     *
     * The case page is a timeline, and a timeline needs dates. Before these
     * the only ones a claim carried were `_creationTime` and `vetoDeadline` —
     * so most steps could be shown as done but never as *when*.
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
    // A subject's reports by state, without reading a fixed window and
    // filtering in memory — every barred re-attempt inserts a row.
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

  /**
   * One executor's copy of a released death report.
   *
   * A report (`claims`) is about the owner and may be filed by anyone; a
   * delivery is about one executor. Created by `claims.advance` for every
   * executor when a report reaches `released`, never by a client.
   *
   *   awaiting_executor → identity_pending → ready → expired
   *                                        ↘ rejected (staff refused the match)
   *
   * `contactToken` is the capability in the link sent to the executor. It is
   * stored as-is because staff send it by hand until an SMS provider exists;
   * that is safe only because the link merely lets a signed-in person *claim*
   * the delivery — nothing is served until their own Didit identity matches
   * this executor, and nothing opens without their sheet. Returned to admins
   * only.
   */
  deliveries: defineTable({
    claimId: v.id("claims"),
    subjectUserId: v.id("users"),
    executorId: v.id("executors"),
    status: v.union(
      v.literal("awaiting_executor"),
      v.literal("identity_pending"),
      v.literal("ready"),
      v.literal("rejected"),
      v.literal("expired")
    ),
    contactToken: v.string(),
    contactedAt: v.optional(v.number()),
    // Set by staff when the executor is reached some other way; they win over
    // the executor record's phone and email for every later send.
    contactPhone: v.optional(v.string()),
    contactEmail: v.optional(v.string()),
    executorUserId: v.optional(v.id("users")),
    boundAt: v.optional(v.number()),
    identityMatch: v.optional(
      v.union(v.literal("id_number"), v.literal("staff"))
    ),
    readyAt: v.optional(v.number()),
    lastOpenedAt: v.optional(v.number()),
    // Release + one year. When the last delivery closes, the vault is deleted.
    expiresAt: v.number(),
    remindedAt: v.optional(v.number()),
    destroyedAt: v.optional(v.number()),
    /** Admin-only, like `claims.staffNote`. */
    staffNote: v.optional(v.string()),
  })
    .index("by_claimId", ["claimId"])
    .index("by_executorUserId", ["executorUserId"])
    .index("by_contactToken", ["contactToken"])
    .index("by_executorId", ["executorId"])
    .index("by_status", ["status"])
    .index("by_status_and_expiresAt", ["status", "expiresAt"]),

  /**
   * Every attempt to reach an executor, automatic or by staff. Append-only in
   * practice — nothing edits a past attempt — so it reads as the delivery's
   * contact timeline. Never carries the link: a note is free text staff type.
   */
  deliveryContacts: defineTable({
    deliveryId: v.id("deliveries"),
    at: v.number(),
    channel: v.union(
      v.literal("sms"),
      v.literal("email"),
      v.literal("call"),
      v.literal("whatsapp"),
      v.literal("visit"),
      v.literal("other")
    ),
    outcome: v.union(
      v.literal("sent"),
      v.literal("failed"),
      v.literal("reached"),
      v.literal("no_answer"),
      v.literal("wrong_person"),
      v.literal("other")
    ),
    note: v.optional(v.string()),
    // Absent for automatic sends.
    staffUserId: v.optional(v.id("users")),
  }).index("by_deliveryId", ["deliveryId"]),

  // Append-only. `audit.ts` exposes an internal insert and an owner-only read,
  // and there is deliberately no mutation anywhere that patches or deletes it.
  auditLog: defineTable({
    userId: v.id("users"),
    event: v.string(),
    deviceId: v.optional(v.id("devices")),
    /**
     * Who did it, when that is not the subject — a staff member acting on an
     * account. Absent on everything an owner or a cron does to itself.
     *
     * A column because `meta` is a `v.record` and therefore unindexable: the
     * actor used to be `meta.adminUserId`, which renders but cannot be asked
     * for. Rows written before this existed keep that key and nothing
     * backfills them — the table is append-only, so "every action by this
     * person" genuinely starts at the RBAC cutover, and the console says so
     * rather than letting an operator read silence as innocence.
     */
    actorUserId: v.optional(v.id("users")),
    meta: scalarRecord,
    at: v.number(),
  })
    .index("by_userId_and_at", ["userId", "at"])
    .index("by_actorUserId_and_at", ["actorUserId", "at"])
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

  /**
   * One support conversation. See `model/support.ts` for the rules.
   *
   * The requester is either a signed-in account (`requesterUserId`) or a guest
   * holding a browser token whose SHA-256 is `guestKeyHash`. A guest's name and
   * email are what they typed — **unverified**, never matched to an account,
   * and shown to staff as such.
   *
   * Chat is not end-to-end encrypted. Nothing here may ever hold key material,
   * and `verify-invariants.mjs` keeps every vault table out of `support/`.
   */
  supportThreads: defineTable({
    requesterUserId: v.optional(v.id("users")),
    guestKeyHash: v.optional(v.string()),
    guestName: v.optional(v.string()),
    guestEmail: v.optional(v.string()),
    /** SHA-256 of the single-use link in a guest's reply email. */
    resumeKeyHash: v.optional(v.string()),
    surface: v.union(v.literal("mobile"), v.literal("web")),
    topic: v.union(
      v.literal("account"),
      v.literal("kyc"),
      v.literal("billing"),
      v.literal("recovery"),
      v.literal("claim"),
      v.literal("delivery"),
      v.literal("other")
    ),
    /** Validated server-side as the caller's own; see `model/support.ts`. */
    claimId: v.optional(v.id("claims")),
    deliveryId: v.optional(v.id("deliveries")),
    locale: v.union(v.literal("ar"), v.literal("en")),
    /** open: staff owe a reply · waiting: requester does · resolved. */
    status: v.union(
      v.literal("open"),
      v.literal("waiting"),
      v.literal("resolved")
    ),
    assigneeUserId: v.optional(v.id("users")),
    lastMessageAt: v.number(),
    lastAuthor: v.union(v.literal("requester"), v.literal("staff")),
    preview: v.string(),
    /**
     * Flags rather than read timestamps: a reply and a read landing in the
     * same millisecond would otherwise leave "unread" to a coin toss. Written
     * by `appendMessage` and the two mark-read mutations.
     */
    requesterUnread: v.boolean(),
    staffUnread: v.boolean(),
    resolvedAt: v.optional(v.number()),
    /** Set by the retention sweep once the thread's files are deleted. */
    filesPurgedAt: v.optional(v.number()),
    /** Requester name, email and first message, for the inbox search box. */
    searchText: v.string(),
  })
    .index("by_requesterUserId_and_lastMessageAt", [
      "requesterUserId",
      "lastMessageAt",
    ])
    .index("by_guestKeyHash_and_lastMessageAt", [
      "guestKeyHash",
      "lastMessageAt",
    ])
    .index("by_resumeKeyHash", ["resumeKeyHash"])
    .index("by_status_and_lastMessageAt", ["status", "lastMessageAt"])
    .index("by_status_and_assigneeUserId_and_lastMessageAt", [
      "status",
      "assigneeUserId",
      "lastMessageAt",
    ])
    .index("by_lastMessageAt", ["lastMessageAt"])
    // The retention sweep. `filesPurgedAt` leads so a purged thread leaves the
    // range the sweep drains, rather than sitting at its front forever.
    .index("by_filesPurgedAt_and_status_and_resolvedAt", [
      "filesPurgedAt",
      "status",
      "resolvedAt",
    ])
    .searchIndex("search_text", {
      searchField: "searchText",
      filterFields: ["status"],
    }),

  /** Inserted only by `appendMessage` in `model/support.ts`. */
  supportMessages: defineTable({
    threadId: v.id("supportThreads"),
    author: v.union(v.literal("requester"), v.literal("staff")),
    /** The staff member, for the console. Never returned to a requester. */
    staffUserId: v.optional(v.id("users")),
    body: v.string(),
    attachments: v.array(
      v.object({
        storageId: v.id("_storage"),
        name: v.string(),
        contentType: v.string(),
        size: v.number(),
      })
    ),
    at: v.number(),
  }).index("by_threadId_and_at", ["threadId", "at"]),

  /**
   * Staff-only notes on a thread. A separate table rather than a flag on
   * `supportMessages`, so no requester query can return one by forgetting a
   * filter. `verify-invariants.mjs` confines it to the staff module.
   */
  supportNotes: defineTable({
    threadId: v.id("supportThreads"),
    authorUserId: v.id("users"),
    body: v.string(),
    at: v.number(),
  }).index("by_threadId_and_at", ["threadId", "at"]),

  /**
   * The help center, edited in the console. Articles never state a plan limit
   * or a price — those move without a deploy (AGENTS.md "Plans").
   */
  helpArticles: defineTable({
    slug: v.string(),
    audience: v.union(
      v.literal("owner"),
      v.literal("executor"),
      v.literal("reporter"),
      v.literal("all")
    ),
    order: v.number(),
    published: v.boolean(),
    title: v.object({ ar: v.string(), en: v.string() }),
    body: v.object({ ar: v.string(), en: v.string() }),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_audience_and_order", ["audience", "order"]),
})
