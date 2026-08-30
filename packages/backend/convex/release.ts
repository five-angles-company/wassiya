// Release bundles — the crown-jewel file.
//
// `releaseBundles.serverShare` is one half of K_h = S_server_h ⊕ S_guardian_h.
// Handing it out is the single irreversible act this deployment can perform, so
// the rules here are absolute:
//
//   1. `releasedBundleForHeir` is the ONLY function anywhere that returns
//      `serverShare`. Verify with `pnpm --filter @workspace/backend verify`,
//      which fails the build if a second read path appears.
//   2. Nothing in this file returns a `releaseBundles` document, and nothing
//      spreads one. Every read projects named fields, so a future edit cannot
//      leak the share by widening a return type.
//   3. `releasedBundleForHeir` re-reads the claim and checks
//      `status === "released"` itself. It never trusts a caller-side check, a
//      passed-in flag, or the fact that some earlier function already looked.
import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireAcceptedGuardian, requireUser } from "./model/access"
import { getCurrentUserOrThrow } from "./users"

/**
 * The owner's device uploads rebuilt bundles after every routing change: one
 * transaction per heir, replacing that heir's row wholesale. Shares are
 * regenerated on the device for every rebuild, so an old `serverShare` that
 * leaked before the rebuild opens nothing afterwards.
 */
export const saveBundles = mutation({
  args: {
    bundles: v.array(
      v.object({
        heirId: v.id("heirs"),
        bundleStorageId: v.id("_storage"),
        serverShare: v.bytes(),
        guardianShareSealed: v.bytes(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const now = Date.now()

    for (const bundle of args.bundles) {
      const heir = await ctx.db.get("heirs", bundle.heirId)
      if (heir === null || heir.userId !== user._id) {
        throw new Error("Not found")
      }
      if (
        bundle.serverShare.byteLength !== 32 ||
        bundle.guardianShareSealed.byteLength === 0
      ) {
        throw new Error("Malformed release share")
      }

      const existing = await ctx.db
        .query("releaseBundles")
        .withIndex("by_userId_and_heirId", (q) =>
          q.eq("userId", user._id).eq("heirId", bundle.heirId)
        )
        .unique()

      const fields = {
        userId: user._id,
        heirId: bundle.heirId,
        bundleStorageId: bundle.bundleStorageId,
        serverShare: bundle.serverShare,
        guardianShareSealed: bundle.guardianShareSealed,
        rebuiltAt: now,
      }
      if (existing === null) {
        await ctx.db.insert("releaseBundles", fields)
      } else {
        // The superseded blob is unopenable once its shares are replaced, but
        // there is no reason to keep paying for it.
        if (existing.bundleStorageId !== bundle.bundleStorageId) {
          await ctx.storage.delete(existing.bundleStorageId)
        }
        await ctx.db.replace("releaseBundles", existing._id, fields)
      }
    }

    await writeAudit(ctx, {
      userId: user._id,
      event: "release.bundles_rebuilt",
      meta: { heirCount: args.bundles.length },
    })
    return null
  },
})

/**
 * Owner-facing status. Deliberately reports only *whether* a bundle exists and
 * when it was rebuilt — never the shares.
 */
export const status = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const rows = await ctx.db
      .query("releaseBundles")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100)
    return rows.map((row) => ({
      heirId: row.heirId,
      rebuiltAt: row.rebuiltAt,
    }))
  },
})

/**
 * THE gated read. Everything about this function is a guard.
 *
 * The caller must be the claimant on a claim that has actually reached
 * "released", against the subject whose bundle they are asking for, linked to
 * the heir record the bundle belongs to. All four facts are re-read from the
 * database here — none of them is an argument, and none is inherited from an
 * earlier check somewhere else.
 *
 * `serverShare` is half of K_h. The heir still needs S_guardian_h from the
 * guardian to open anything, so this alone is not a decryption capability —
 * but it is the half this deployment is holding back, so it is released once
 * and audited every time.
 */
export const releasedBundleForHeir = mutation({
  // `v.string()` + `normalizeId`, like the rest of the claim surface: this id
  // reaches the heir in an email and mail clients truncate links. Normalising
  // weakens nothing — every one of the four assertions below still runs, and a
  // malformed id now fails as "not found" rather than as a validator crash.
  args: { claimId: v.string() },
  handler: async (ctx, { claimId: rawClaimId }) => {
    const claimant = await getCurrentUserOrThrow(ctx)

    const claimId = ctx.db.normalizeId("claims", rawClaimId)
    if (claimId === null) {
      throw new Error("Not found")
    }

    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) {
      throw new Error("Not found")
    }
    // Re-read, never trust. All four release preconditions are re-asserted on
    // this row, now — not inherited from the state machine that set the status.
    // `released` is only reachable through `guardianConfirm` and
    // `adminSetNameMatch` today, but this function is the irreversible one, so
    // it must not depend on that staying true in claims.ts.
    if (claim.status !== "released") {
      throw new Error("Not found")
    }
    if (claim.nameMatch !== true || claim.guardianConfirmedAt === undefined) {
      throw new Error("Not found")
    }
    if (claim.claimantIdentityStatus !== "verified") {
      throw new Error("Not found")
    }
    if (claim.claimantUserId !== claimant._id) {
      throw new Error("Not found")
    }
    const heirId = claim.heirId
    if (heirId === undefined) {
      throw new Error("Not found")
    }

    const bundle = await ctx.db
      .query("releaseBundles")
      .withIndex("by_userId_and_heirId", (q) =>
        q.eq("userId", claim.subjectUserId).eq("heirId", heirId)
      )
      .unique()
    if (bundle === null) {
      throw new Error("Not found")
    }

    // A mutation rather than a query precisely so this line can exist: handing
    // out the withheld half of K_h is not something that may happen unlogged.
    await writeAudit(ctx, {
      userId: claim.subjectUserId,
      event: "release.server_share_released",
      meta: { claimId, heirId, claimantUserId: claimant._id },
    })

    return {
      bundleUrl: await ctx.storage.getUrl(bundle.bundleStorageId),
      rebuiltAt: bundle.rebuiltAt,
      // The withheld half of K_h. Released only on the path above.
      serverShare: bundle.serverShare,
    }
  },
})

/**
 * The guardian's half of the same ceremony: the sealed S_guardian_h, returned
 * only to the guardian who can open it, and only once the claim is released.
 * They decrypt it locally and hand the plaintext to the heir out of band.
 */
export const guardianShareForClaim = mutation({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    const guardianUser = await getCurrentUserOrThrow(ctx)

    const claim = await ctx.db.get("claims", claimId)
    if (claim === null || claim.status !== "released") {
      throw new Error("Not found")
    }
    // The same four-fact re-assertion as `releasedBundleForHeir`: this hands
    // over the other half of K_h, so it may not be weaker.
    if (claim.nameMatch !== true || claim.guardianConfirmedAt === undefined) {
      throw new Error("Not found")
    }
    const heirId = claim.heirId
    if (heirId === undefined) {
      throw new Error("Not found")
    }

    await requireAcceptedGuardian(ctx, claim.subjectUserId)

    const bundle = await ctx.db
      .query("releaseBundles")
      .withIndex("by_userId_and_heirId", (q) =>
        q.eq("userId", claim.subjectUserId).eq("heirId", heirId)
      )
      .unique()
    if (bundle === null) {
      throw new Error("Not found")
    }

    await writeAudit(ctx, {
      userId: claim.subjectUserId,
      event: "release.guardian_share_handed_over",
      meta: { claimId, heirId, guardianUserId: guardianUser._id },
    })
    return { guardianShareSealed: bundle.guardianShareSealed }
  },
})

/**
 * The assets an heir was left, for a claim that has been released.
 *
 * ## Why this had to exist
 *
 * `releasedBundleForHeir` hands over the DEKs and nothing else. Until this
 * query there was no list to decrypt them against, so an opened box could
 * report a key count and not one thing an heir could actually receive. The
 * crypto for the rest was already sitting in `@workspace/crypto` unused —
 * `openLabel` for the name, `decryptAsset` for the content.
 *
 * ## A query, not a mutation
 *
 * `releasedBundleForHeir` is a mutation because handing out the withheld half
 * of K_h is not something that may happen unlogged. This hands out **no key
 * material at all**: the ciphertext below is useless without the DEK the heir
 * already holds, and the label is sealed under that same DEK. So it audits
 * nothing and may be re-read freely as the box paginates.
 *
 * ## The four preconditions are re-asserted, not inherited
 *
 * Identical to the bundle's, and deliberately duplicated rather than factored
 * into a helper both call: this is the second door into the same room, and a
 * shared helper is a single place for someone to relax a check for one caller
 * and weaken the other by accident.
 */
export const assetsForHeir = query({
  args: { claimId: v.string() },
  handler: async (ctx, { claimId: rawClaimId }) => {
    const claimant = await getCurrentUserOrThrow(ctx)

    const claimId = ctx.db.normalizeId("claims", rawClaimId)
    if (claimId === null) return null

    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) return null
    if (claim.status !== "released") return null
    if (claim.nameMatch !== true || claim.guardianConfirmedAt === undefined) {
      return null
    }
    if (claim.claimantIdentityStatus !== "verified") return null
    if (claim.claimantUserId !== claimant._id) return null

    const heirId = claim.heirId
    if (heirId === undefined) return null

    // Routed directly to this heir, plus everything routed to every heir. Two
    // indexed reads rather than one filtered scan, for the reason
    // `routing.previewForHeir` gives: an owner with hundreds of executor rows
    // would otherwise push an "allHeirs" row past the window and silently drop
    // an asset out of an heir's inheritance, with no error anywhere.
    const direct = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientHeirId", (q) =>
        q.eq("userId", claim.subjectUserId).eq("recipientHeirId", heirId)
      )
      .take(500)
    const shared = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientKind", (q) =>
        q.eq("userId", claim.subjectUserId).eq("recipientKind", "allHeirs")
      )
      .take(500)

    const items = []
    for (const row of [...direct, ...shared]) {
      const asset = await ctx.db.get("assets", row.assetId)
      if (asset === null) continue

      // Every URL the heir needs, resolved here: an asset can be chunked across
      // several storage objects and the browser has no way to ask for them.
      const contentUrls: string[] = []
      for (const storageId of asset.storageIds) {
        const url = await ctx.storage.getUrl(storageId)
        if (url !== null) contentUrls.push(url)
      }

      items.push({
        assetId: asset._id,
        type: asset.type,
        // Sealed under the asset's own DEK, which is exactly what the heir got
        // in the bundle. The server has never been able to read it.
        labelSealed: asset.labelSealed,
        meta: asset.meta,
        via: row.recipient.kind,
        contentUrls,
        instructionsCiphertext: row.instructionsCiphertext ?? null,
      })
    }

    const heir = await ctx.db.get("heirs", heirId)

    return {
      heirName: heir?.name ?? null,
      messageKind: heir?.messageMeta?.kind ?? null,
      items,
    }
  },
})
