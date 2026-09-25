// Heirs.
//
// "Routing, not shares" — an heir is a recipient, never a fraction. There is no
// share arithmetic anywhere in this deployment, by design: الأنصبة يحدّدها
// القانون، لا التطبيق.
//
// Every heir is silent: they learn nothing until release. There was a
// "notified" mode and it is gone — see the schema for why. The distinction
// never lived in the crypto anyway.
import { v } from "convex/values"

import type { Id } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireUser } from "./model/access"
import { assertCanAddHeir } from "./model/entitlements"
import { assertEscrowSeal } from "./model/escrowSeal"
import { evaluateDeliveryIdentity } from "./deliveries"
import { identityNumberHash } from "./model/identityHash"

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const rows = await ctx.db
      .query("heirs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100)

    // 5.1 puts "تستلم ٤ أصول" on every row, and an heir who receives nothing is
    // that screen's amber case — the mirror of "بلا مستلم" in 4.1. Both need a
    // count, so it is computed once here rather than per heir on the client.
    const { direct, sharedCount } = await routedCounts(ctx, user._id)

    return rows.map((row) => ({
      id: row._id,
      name: row.name,
      relation: row.relation,
      phone: row.phone,
      email: row.email ?? null,
      // Whether one is registered — the number itself is not stored.
      hasIdNumber: row.idNumberHash !== undefined,
      birthDate: row.birthDate ?? null,

      messageKind: row.messageMeta?.kind ?? null,
      /**
       * Assets routed to this heir: the ones naming them, plus every asset
       * routed to "all heirs jointly", which they receive as well. An heir
       * added after a shared route still receives it — that is the point of
       * folding the bucket in here rather than expanding it at write time.
       */
      routedAssetCount: (direct.get(row._id) ?? 0) + sharedCount,
    }))
  },
})

/**
 * How many assets each heir is named on, and how many go to all heirs jointly.
 *
 * Two indexed scans over the owner's routing rows rather than one read per
 * heir. The 2000 cap is per scan; past it a count under-reports, which shows as
 * a smaller number on a card — never as a wrong *state*, since "receives
 * nothing" is decided by the total being zero and an under-count cannot
 * manufacture a zero out of a non-empty set.
 */
async function routedCounts(
  ctx: QueryCtx,
  userId: Id<"users">
): Promise<{ direct: Map<Id<"heirs">, number>; sharedCount: number }> {
  const direct = new Map<Id<"heirs">, number>()
  const named = await ctx.db
    .query("assetRecipients")
    .withIndex("by_userId_and_recipientKind", (q) =>
      q.eq("userId", userId).eq("recipientKind", "heir")
    )
    .take(2000)
  for (const row of named) {
    if (row.recipientHeirId === undefined) continue
    direct.set(row.recipientHeirId, (direct.get(row.recipientHeirId) ?? 0) + 1)
  }

  const shared = await ctx.db
    .query("assetRecipients")
    .withIndex("by_userId_and_recipientKind", (q) =>
      q.eq("userId", userId).eq("recipientKind", "allHeirs")
    )
    .take(2000)

  return { direct, sharedCount: shared.length }
}

const BIRTH_DATE = /^\d{4}-\d{2}-\d{2}$/
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const YEAR_MS = 365 * 24 * 60 * 60 * 1000

function cleanEmail(value: string | undefined): string | undefined {
  const email = value?.trim().toLowerCase()
  if (email === undefined || email === "") return undefined
  if (!EMAIL.test(email)) throw new Error("That is not an email address")
  return email
}

function assertBirthDate(value: string): string {
  if (!BIRTH_DATE.test(value)) throw new Error("Birth date must be YYYY-MM-DD")
  return value
}

/**
 * The ID number arrives in plaintext exactly once, over this call, and only
 * its keyed hash is stored — see `model/identityHash.ts`. Never log `args`.
 */
export const add = mutation({
  args: {
    name: v.string(),
    relation: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    idNumber: v.optional(v.string()),
    birthDate: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await assertCanAddHeir(ctx, user, Date.now())
    const idNumber = args.idNumber?.trim()
    const heirId = await ctx.db.insert("heirs", {
      userId: user._id,
      name: args.name,
      relation: args.relation,
      phone: args.phone,
      email: cleanEmail(args.email),
      idNumberHash:
        idNumber === undefined || idNumber === ""
          ? undefined
          : await identityNumberHash(idNumber),
      birthDate:
        args.birthDate === undefined || args.birthDate === ""
          ? undefined
          : assertBirthDate(args.birthDate),
      // Not an argument: there is nothing else it could be.
      mode: "silent",
      inviteStatus: "none",
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.added",
      meta: { heirId },
    })
    return heirId
  },
})

export const update = mutation({
  args: {
    heirId: v.id("heirs"),
    name: v.optional(v.string()),
    relation: v.optional(v.string()),
    phone: v.optional(v.string()),
    /** Absent leaves it; "" clears it. */
    email: v.optional(v.string()),
    /** Absent leaves it; "" clears it; anything else replaces its hash. */
    idNumber: v.optional(v.string()),
    /** Absent leaves it; "" clears it. */
    birthDate: v.optional(v.string()),
  },
  handler: async (ctx, { heirId, idNumber, birthDate, email, ...fields }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) {
      throw new Error("Not found")
    }
    const trimmed = idNumber?.trim()
    await ctx.db.patch("heirs", heirId, {
      ...fields,
      ...(email === undefined ? {} : { email: cleanEmail(email) }),
      ...(trimmed === undefined
        ? {}
        : {
            idNumberHash:
              trimmed === "" ? undefined : await identityNumberHash(trimmed),
          }),
      ...(birthDate === undefined
        ? {}
        : {
            birthDate:
              birthDate === "" ? undefined : assertBirthDate(birthDate),
          }),
    })
    // A number added after the heir already bound a delivery must be able to
    // open it: the match is otherwise re-checked only on bind and on a verdict.
    if (trimmed !== undefined && trimmed !== "") {
      const waiting = await ctx.db
        .query("deliveries")
        .withIndex("by_heirId", (q) => q.eq("heirId", heirId))
        .take(10)
      const now = Date.now()
      for (const delivery of waiting) {
        if (delivery.heirUserId === undefined) continue
        const bound = await ctx.db.get("users", delivery.heirUserId)
        if (bound !== null)
          await evaluateDeliveryIdentity(ctx, delivery, bound, now)
      }
    }

    const changed = [
      ...Object.keys(fields),
      ...(trimmed === undefined ? [] : ["idNumber"]),
      ...(email === undefined ? [] : ["email"]),
      ...(birthDate === undefined ? [] : ["birthDate"]),
    ]
    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.updated",
      meta: { heirId, fields: changed.join(",") },
    })
    return null
  },
})

/**
 * Attach the heir's personal message. The content is sealed on-device under a
 * message key, which arrives wrapped by MK for the owner and sealed to the
 * escrow key for this heir, so this deployment holds an unreadable blob.
 */
export const setMessage = mutation({
  args: {
    heirId: v.id("heirs"),
    kind: v.union(v.literal("text"), v.literal("audio"), v.literal("video")),
    storageId: v.id("_storage"),
    messageKeyWrappedByMk: v.bytes(),
    messageKeyEscrowed: v.bytes(),
    escrowKeyId: v.string(),
  },
  handler: async (ctx, { heirId, kind, storageId, ...keys }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) {
      throw new Error("Not found")
    }
    assertEscrowSeal(keys.messageKeyEscrowed, keys.escrowKeyId)
    if (heir.messageMeta !== undefined) {
      await ctx.storage.delete(heir.messageMeta.storageId)
    }
    await ctx.db.patch("heirs", heirId, {
      messageMeta: { kind, storageId, ...keys },
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.message_set",
      meta: { heirId, kind },
    })
    return null
  },
})

/** Remove the heir's personal message, and its escrowed key with it. */
export const clearMessage = mutation({
  args: { heirId: v.id("heirs") },
  handler: async (ctx, { heirId }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) {
      throw new Error("Not found")
    }
    if (heir.messageMeta === undefined) return null
    await ctx.storage.delete(heir.messageMeta.storageId)
    await ctx.db.patch("heirs", heirId, { messageMeta: undefined })
    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.message_cleared",
      meta: { heirId },
    })
    return null
  },
})

/**
 * The owner's own copy of a message, to re-read or edit it. Ciphertext and a
 * wrapped key only — the owner's device opens both with MK.
 */
export const message = query({
  args: { heirId: v.id("heirs") },
  handler: async (ctx, { heirId }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) return null
    const meta = heir.messageMeta
    if (meta === undefined) return null
    return {
      kind: meta.kind,
      url: await ctx.storage.getUrl(meta.storageId),
      messageKeyWrappedByMk: meta.messageKeyWrappedByMk,
    }
  },
})

/**
 * Removing an heir also removes their routing rows. An asset that thereby
 * reaches nobody goes back to unrouted, and its escrowed key is deleted — only
 * routed items are ever escrowed.
 */
export const remove = mutation({
  args: { heirId: v.id("heirs") },
  handler: async (ctx, { heirId }) => {
    const user = await requireUser(ctx)
    const heir = await ctx.db.get("heirs", heirId)
    if (heir === null || heir.userId !== user._id) {
      throw new Error("Not found")
    }

    const routes = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientHeirId", (q) =>
        q.eq("userId", user._id).eq("recipientHeirId", heirId)
      )
      .take(500)
    for (const route of routes) {
      await ctx.db.delete("assetRecipients", route._id)
      const remaining = await ctx.db
        .query("assetRecipients")
        .withIndex("by_assetId", (q) => q.eq("assetId", route.assetId))
        .take(1)
      if (remaining.length === 0) {
        await ctx.db.patch("assets", route.assetId, {
          recipientRule: "default",
          escrowedDek: undefined,
          escrowKeyId: undefined,
        })
      }
    }

    if (heir.messageMeta !== undefined) {
      await ctx.storage.delete(heir.messageMeta.storageId)
    }
    await ctx.db.delete("heirs", heirId)

    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.removed",
      meta: { heirId, routesRemoved: routes.length },
    })
    return null
  },
})

/**
 * Whether the owner is due to confirm every heir's phone and email are still
 * theirs — yearly, counted from the last confirmation or, before the first,
 * from the oldest heir. Numbers get recycled, and the owner is the only person
 * who can fix a stale one while it still matters.
 */
export const contactCheck = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const heirs = await ctx.db
      .query("heirs")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100)
    if (heirs.length === 0) return { due: false, confirmedAt: null }
    const since =
      user.heirContactsConfirmedAt ??
      Math.min(...heirs.map((heir) => heir._creationTime))
    return {
      due: Date.now() - since > YEAR_MS,
      confirmedAt: user.heirContactsConfirmedAt ?? null,
    }
  },
})

/** The owner confirms every heir's contact details are current. */
export const confirmContacts = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const now = Date.now()
    await ctx.db.patch("users", user._id, { heirContactsConfirmedAt: now })
    await writeAudit(ctx, {
      userId: user._id,
      event: "heir.contacts_confirmed",
      meta: {},
      at: now,
    })
    return null
  },
})
