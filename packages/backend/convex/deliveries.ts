// Deliveries — what one heir receives from a released death report.
//
// Rules (AGENTS.md "Escrowed release"):
//  - Created only by `claims.advance`, one per heir with a bundle, never by a
//    client. The reporter receives nothing by reporting.
//  - The contact link only lets a signed-in person *bind* the delivery to
//    their account. Nothing opens until `status === "ready"`, which needs the
//    bound person's own Didit verification to match this heir: automatically
//    when the owner registered an ID number and a document hash equals it,
//    otherwise by a staff decision. Never on name alone without staff.
//  - Binding may be taken over by another signed-in person until the delivery
//    is ready, so whoever reaches a forwarded link first cannot lock the real
//    heir out; every bind is audited. Once ready, it is final.
//  - `contactToken` is returned to admins only.
import { v } from "convex/values"

import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
} from "./_generated/server"
import { writeAudit } from "./audit"
import { appLink, sendDeliveryExpiring, sendDeliveryReady } from "./email"
import { requireAdmin } from "./model/access"
import { DAY_MS, DELIVERY_WINDOW_DAYS } from "./model/claimFlow"
import { getCurrentUserOrThrow } from "./users"

const TOKEN_BYTES = 24
const EXPIRE_BATCH = 50
const REMIND_BEFORE_MS = 30 * DAY_MS
const LIVE_STATUSES = ["awaiting_heir", "identity_pending", "ready"] as const

export function deliveryPath(contactToken: string): string {
  return `/receive/${contactToken}`
}

/**
 * One delivery per heir of `subjectUserId` that has a bundle. Heirs without one
 * receive nothing — their bundle was never built, so there is nothing to open.
 */
export async function createDeliveriesForClaim(
  ctx: MutationCtx,
  claimId: Id<"claims">,
  subjectUserId: Id<"users">,
  now: number
): Promise<number> {
  const bundles = await ctx.db
    .query("releaseBundles")
    .withIndex("by_userId", (q) => q.eq("userId", subjectUserId))
    .take(100)

  let created = 0
  for (const bundle of bundles) {
    const existing = await ctx.db
      .query("deliveries")
      .withIndex("by_heirId", (q) => q.eq("heirId", bundle.heirId))
      .take(10)
    if (existing.some((row) => row.claimId === claimId)) continue

    const deliveryId = await ctx.db.insert("deliveries", {
      claimId,
      subjectUserId,
      heirId: bundle.heirId,
      status: "awaiting_heir",
      contactToken: randomToken(),
      expiresAt: now + DELIVERY_WINDOW_DAYS * DAY_MS,
    })
    // A no-op unless an SMS provider is configured; staff can always send
    // the link by hand from the console.
    await ctx.scheduler.runAfter(0, internal.outreach.contactHeir, { deliveryId })
    created += 1
  }
  return created
}

/**
 * Move a bound delivery to `ready` when the bound person's verified document
 * matches the ID number the owner registered. Anything short of that leaves it
 * for staff. Called on bind and whenever the Didit webhook verifies someone.
 */
export async function evaluateDeliveryIdentity(
  ctx: MutationCtx,
  delivery: Doc<"deliveries">,
  heirUser: Doc<"users">,
  now: number
): Promise<void> {
  if (delivery.status !== "identity_pending") return
  if (heirUser.identityStatus !== "verified") return

  const heir = await ctx.db.get("heirs", delivery.heirId)
  const matches =
    heir?.idNumberHash !== undefined &&
    (heirUser.identityDocHashes ?? []).includes(heir.idNumberHash)
  if (!matches) return

  await ctx.db.patch("deliveries", delivery._id, {
    status: "ready",
    identityMatch: "id_number",
    readyAt: now,
  })
  await writeAudit(ctx, {
    userId: delivery.subjectUserId,
    event: "delivery.ready",
    meta: { deliveryId: delivery._id, heirId: delivery.heirId, match: "id_number" },
    at: now,
  })
  await sendDeliveryReady(ctx, heirUser._id, delivery._id, delivery.expiresAt)
}

/** Re-evaluate every delivery this person has bound — the webhook's hook. */
export async function reevaluateDeliveriesFor(
  ctx: MutationCtx,
  heirUser: Doc<"users">
): Promise<void> {
  const bound = await ctx.db
    .query("deliveries")
    .withIndex("by_heirUserId", (q) => q.eq("heirUserId", heirUser._id))
    .take(20)
  const now = Date.now()
  for (const delivery of bound) {
    await evaluateDeliveryIdentity(ctx, delivery, heirUser, now)
  }
}

/**
 * What the link shows before anyone is signed in: whose delivery it is and
 * whether it can still be claimed. Nothing about its contents.
 */
export const byToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const delivery = await ctx.db
      .query("deliveries")
      .withIndex("by_contactToken", (q) => q.eq("contactToken", token))
      .unique()
    if (delivery === null) return null
    const subject = await ctx.db.get("users", delivery.subjectUserId)
    const heir = await ctx.db.get("heirs", delivery.heirId)
    return {
      deliveryId: delivery._id,
      subjectName: subject?.identityVerifiedName ?? subject?.name ?? null,
      heirName: heir?.name ?? null,
      open: delivery.status !== "expired" && delivery.status !== "rejected",
      expiresAt: delivery.expiresAt,
    }
  },
})

/** Claim the delivery for the signed-in person. See the file header. */
export const bind = mutation({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const user = await getCurrentUserOrThrow(ctx)
    const delivery = await ctx.db
      .query("deliveries")
      .withIndex("by_contactToken", (q) => q.eq("contactToken", token))
      .unique()
    if (delivery === null) throw new Error("Not found")

    if (delivery.heirUserId === user._id) return { deliveryId: delivery._id }
    if (delivery.status === "ready") {
      throw new Error("This delivery has already been received")
    }
    if (delivery.status === "expired" || delivery.status === "rejected") {
      throw new Error("Not found")
    }
    if (delivery.subjectUserId === user._id) throw new Error("Not found")

    const now = Date.now()
    await ctx.db.patch("deliveries", delivery._id, {
      heirUserId: user._id,
      boundAt: now,
      status: "identity_pending",
    })
    await writeAudit(ctx, {
      userId: delivery.subjectUserId,
      event: "delivery.bound",
      meta: {
        deliveryId: delivery._id,
        heirUserId: user._id,
        takenOver: delivery.heirUserId !== undefined,
      },
      at: now,
    })

    const fresh = await ctx.db.get("deliveries", delivery._id)
    if (fresh !== null) await evaluateDeliveryIdentity(ctx, fresh, user, now)
    return { deliveryId: delivery._id }
  },
})

/** The signed-in heir's view of one delivery. */
export const forHeir = query({
  // A string, normalised here: the id comes from a URL, and a truncated one
  // should read as "not found" rather than crash the validator.
  args: { deliveryId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)
    const deliveryId = ctx.db.normalizeId("deliveries", args.deliveryId)
    if (deliveryId === null) return null
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null || delivery.heirUserId !== user._id) return null
    const subject = await ctx.db.get("users", delivery.subjectUserId)
    const heir = await ctx.db.get("heirs", delivery.heirId)
    return {
      deliveryId: delivery._id,
      status: delivery.status,
      subjectName: subject?.identityVerifiedName ?? subject?.name ?? null,
      heirName: heir?.name ?? null,
      identityStatus: user.identityStatus ?? "unverified",
      expiresAt: delivery.expiresAt,
      readyAt: delivery.readyAt ?? null,
      lastOpenedAt: delivery.lastOpenedAt ?? null,
    }
  },
})

/** Every delivery bound to the signed-in person, newest first. */
export const mine = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUserOrThrow(ctx)
    const rows = await ctx.db
      .query("deliveries")
      .withIndex("by_heirUserId", (q) => q.eq("heirUserId", user._id))
      .order("desc")
      .take(20)
    return await Promise.all(
      rows.map(async (row) => {
        const subject = await ctx.db.get("users", row.subjectUserId)
        return {
          deliveryId: row._id,
          status: row.status,
          subjectName: subject?.identityVerifiedName ?? subject?.name ?? null,
          expiresAt: row.expiresAt,
        }
      })
    )
  },
})

// ── Console ─────────────────────────────────────────────────────────────────

const adminStatusValidator = v.union(
  v.literal("awaiting_heir"),
  v.literal("identity_pending"),
  v.literal("ready"),
  v.literal("rejected"),
  v.literal("expired")
)

/** Deliveries in one state, for the console's outreach and review queues. */
export const adminList = query({
  args: { status: adminStatusValidator },
  handler: async (ctx, { status }) => {
    await requireAdmin(ctx)
    const rows = await ctx.db
      .query("deliveries")
      .withIndex("by_status", (q) => q.eq("status", status))
      .order("desc")
      .take(100)

    return await Promise.all(
      rows.map(async (row) => {
        const heir = await ctx.db.get("heirs", row.heirId)
        const subject = await ctx.db.get("users", row.subjectUserId)
        const bound =
          row.heirUserId === undefined
            ? null
            : await ctx.db.get("users", row.heirUserId)
        return {
          deliveryId: row._id,
          claimId: row.claimId,
          status: row.status,
          subjectName: subject?.identityVerifiedName ?? subject?.name ?? null,
          heir: {
            name: heir?.name ?? null,
            relation: heir?.relation ?? null,
            phone: heir?.phone ?? null,
            birthDate: heir?.birthDate ?? null,
            hasIdNumber: heir?.idNumberHash !== undefined,
          },
          // What staff compare when there is no ID-number match.
          boundPerson:
            bound === null
              ? null
              : {
                  verifiedName: bound.identityVerifiedName ?? null,
                  birthDate: bound.identityBirthDate ?? null,
                  identityStatus: bound.identityStatus ?? "unverified",
                  idNumberMatches:
                    heir?.idNumberHash !== undefined &&
                    (bound.identityDocHashes ?? []).includes(heir.idNumberHash),
                },
          link: appLink(deliveryPath(row.contactToken)) ?? null,
          contactedAt: row.contactedAt ?? null,
          identityMatch: row.identityMatch ?? null,
          expiresAt: row.expiresAt,
        }
      })
    )
  },
})

/** Staff sent the link by hand (until an SMS provider exists). */
export const adminMarkContacted = mutation({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const admin = await requireAdmin(ctx)
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null) throw new Error("Not found")
    const now = Date.now()
    await ctx.db.patch("deliveries", deliveryId, { contactedAt: now })
    await writeAudit(ctx, {
      userId: delivery.subjectUserId,
      event: "delivery.contacted",
      meta: { deliveryId, adminUserId: admin._id, channel: "manual" },
      at: now,
    })
    return null
  },
})

/**
 * Staff decide an identity the ID number could not: the bound person's
 * verified name and birth date against the heir the owner registered.
 */
export const adminDecideIdentity = mutation({
  args: {
    deliveryId: v.id("deliveries"),
    approve: v.boolean(),
    note: v.optional(v.string()),
  },
  handler: async (ctx, { deliveryId, approve, note }) => {
    const admin = await requireAdmin(ctx)
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null) throw new Error("Not found")
    if (delivery.status !== "identity_pending" || delivery.heirUserId === undefined) {
      throw new Error("This delivery is not waiting for an identity decision")
    }
    const bound = await ctx.db.get("users", delivery.heirUserId)
    if (approve && bound?.identityStatus !== "verified") {
      throw new Error("The person has not completed identity verification yet")
    }

    const now = Date.now()
    await ctx.db.patch("deliveries", deliveryId, {
      status: approve ? "ready" : "rejected",
      identityMatch: approve ? "staff" : undefined,
      readyAt: approve ? now : undefined,
      staffNote: note,
    })
    await writeAudit(ctx, {
      userId: delivery.subjectUserId,
      event: approve ? "delivery.ready" : "delivery.rejected",
      meta: { deliveryId, match: "staff", adminUserId: admin._id },
      at: now,
    })
    // The heir was told on the page that we would write when it is ready.
    if (approve) {
      await sendDeliveryReady(ctx, delivery.heirUserId, deliveryId, delivery.expiresAt)
    }
    return null
  },
})

/**
 * Daily. Warns each bound heir thirty days before their delivery closes, then
 * destroys the locked key and bundle of every delivery past its window, so
 * after a year nobody — Wassiya included — can open it again.
 */
export const expire = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now()

    for (const status of ["identity_pending", "ready"] as const) {
      const closing = await ctx.db
        .query("deliveries")
        .withIndex("by_status_and_expiresAt", (q) =>
          q
            .eq("status", status)
            .gt("expiresAt", now)
            .lte("expiresAt", now + REMIND_BEFORE_MS)
        )
        .take(EXPIRE_BATCH)
      for (const delivery of closing) {
        if (delivery.remindedAt !== undefined || delivery.heirUserId === undefined) {
          continue
        }
        await ctx.db.patch("deliveries", delivery._id, { remindedAt: now })
        await sendDeliveryExpiring(ctx, delivery.heirUserId, delivery._id, delivery.expiresAt)
      }
    }

    let expired = 0
    for (const status of LIVE_STATUSES) {
      const due = await ctx.db
        .query("deliveries")
        .withIndex("by_status_and_expiresAt", (q) =>
          q.eq("status", status).lte("expiresAt", now)
        )
        .take(EXPIRE_BATCH - expired)
      for (const delivery of due) {
        const bundle = await ctx.db
          .query("releaseBundles")
          .withIndex("by_userId_and_heirId", (q) =>
            q.eq("userId", delivery.subjectUserId).eq("heirId", delivery.heirId)
          )
          .unique()
        if (bundle !== null) {
          await ctx.storage.delete(bundle.bundleStorageId)
          await ctx.db.delete("releaseBundles", bundle._id)
        }
        await ctx.db.patch("deliveries", delivery._id, {
          status: "expired",
          destroyedAt: now,
        })
        await writeAudit(ctx, {
          userId: delivery.subjectUserId,
          event: "delivery.expired",
          meta: { deliveryId: delivery._id, heirId: delivery.heirId },
          at: now,
        })
        expired += 1
      }
    }
    if (expired === EXPIRE_BATCH) {
      await ctx.scheduler.runAfter(0, internal.deliveries.expire, {})
    }
    return { expired }
  },
})

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

/** The heir's phone and link, for `outreach.contactHeir` only. */
export const contactDetails = internalQuery({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null || delivery.status !== "awaiting_heir") return null
    const heir = await ctx.db.get("heirs", delivery.heirId)
    if (heir === null) return null
    return {
      phone: heir.phone,
      link: appLink(deliveryPath(delivery.contactToken)) ?? null,
    }
  },
})

/** Written by `outreach.contactHeir` once the provider accepted the message. */
export const recordContacted = internalMutation({
  args: { deliveryId: v.id("deliveries"), channel: v.literal("sms") },
  handler: async (ctx, { deliveryId, channel }) => {
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null) return null
    const now = Date.now()
    await ctx.db.patch("deliveries", deliveryId, { contactedAt: now })
    await writeAudit(ctx, {
      userId: delivery.subjectUserId,
      event: "delivery.contacted",
      meta: { deliveryId, channel },
      at: now,
    })
    return null
  },
})
