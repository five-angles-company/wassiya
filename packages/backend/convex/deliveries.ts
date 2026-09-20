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
//  - **Nothing names the deceased or the heir before identity passes.** Phone
//    numbers and addresses get recycled; whoever holds the link may be a
//    stranger, and must learn no more than that something is waiting.
//  - Binding may be taken over until the delivery is ready, so whoever reaches
//    a forwarded link first cannot lock the real heir out; staff can also
//    reissue the link, which kills the old one. Every bind is audited.
//  - `contactToken` is returned to admins only, and never written to a log.
import { v } from "convex/values"

import { internal } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
  type MutationCtx,
  type QueryCtx,
} from "./_generated/server"
import { writeAudit, writeStaffAudit } from "./audit"
import {
  appLink,
  sendDeliveryExpiring,
  sendDeliveryInvite,
  sendDeliveryReady,
} from "./email"
import { requirePermission } from "./model/access"
import { DAY_MS, DELIVERY_WINDOW_DAYS } from "./model/claimFlow"
import { recordJobRun } from "./model/jobRuns"
import { settingsFor } from "./model/settings"
import { getCurrentUserOrThrow } from "./users"

const TOKEN_BYTES = 24
const EXPIRE_BATCH = 50
const REMIND_BEFORE_MS = 30 * DAY_MS
const LIVE_STATUSES = ["awaiting_heir", "identity_pending", "ready"] as const
const ADMIN_TABLE_CAP = 300
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function deliveryPath(contactToken: string): string {
  return `/receive/${contactToken}`
}

/** Where to reach an heir now: staff overrides first, then the owner's record. */
function contactOf(
  delivery: Doc<"deliveries">,
  heir: Doc<"heirs"> | null
): { phone: string | null; email: string | null } {
  return {
    phone: delivery.contactPhone ?? heir?.phone ?? null,
    email: delivery.contactEmail ?? heir?.email ?? null,
  }
}

async function logContact(
  ctx: MutationCtx,
  entry: Omit<Doc<"deliveryContacts">, "_id" | "_creationTime">
): Promise<void> {
  await ctx.db.insert("deliveryContacts", entry)
  if (entry.outcome === "sent" || entry.outcome === "reached") {
    await ctx.db.patch("deliveries", entry.deliveryId, {
      contactedAt: entry.at,
    })
  }
}

/**
 * Send the link on every channel the heir has: email now, in this transaction,
 * and SMS through `outreach.contactHeir` (a no-op until a provider is set).
 */
async function inviteHeir(
  ctx: MutationCtx,
  delivery: Doc<"deliveries">,
  channels: { email: boolean; sms: boolean } = { email: true, sms: true }
): Promise<void> {
  const heir = await ctx.db.get("heirs", delivery.heirId)
  const { email } = contactOf(delivery, heir)
  const link = await appLink(ctx, deliveryPath(delivery.contactToken))
  const now = Date.now()

  if (channels.email && email !== null && link !== undefined) {
    const owner = await ctx.db.get("users", delivery.subjectUserId)
    const sent = await sendDeliveryInvite(ctx, {
      to: email,
      english: owner?.locale?.startsWith("en") === true,
      ownerUserId: delivery.subjectUserId,
      link,
    })
    await logContact(ctx, {
      deliveryId: delivery._id,
      at: now,
      channel: "email",
      outcome: sent ? "sent" : "failed",
    })
  }
  if (channels.sms) {
    await ctx.scheduler.runAfter(0, internal.outreach.contactHeir, {
      deliveryId: delivery._id,
    })
  }
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
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery !== null) await inviteHeir(ctx, delivery)
    created += 1
  }
  return created
}

/**
 * Move a bound delivery to `ready` when the bound person's verified document
 * matches the ID number the owner registered. Anything short of that leaves it
 * for staff. Called on bind, on a verdict, and when an heir gains an ID number.
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
    meta: {
      deliveryId: delivery._id,
      heirId: delivery.heirId,
      match: "id_number",
    },
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

/** The deceased's name, only once the reader has proved they are the heir. */
async function subjectNameFor(
  ctx: QueryCtx,
  delivery: Doc<"deliveries">
): Promise<string | null> {
  if (delivery.status !== "ready") return null
  const subject = await ctx.db.get("users", delivery.subjectUserId)
  return subject?.identityVerifiedName ?? subject?.name ?? null
}

/**
 * What the link shows before anyone is signed in: whether it can still be
 * claimed, and nothing else — no names, no contents. See the file header.
 */
export const byToken = query({
  args: { token: v.string() },
  handler: async (ctx, { token }) => {
    const delivery = await ctx.db
      .query("deliveries")
      .withIndex("by_contactToken", (q) => q.eq("contactToken", token))
      .unique()
    if (delivery === null) return null
    return {
      deliveryId: delivery._id,
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
    return {
      deliveryId: delivery._id,
      status: delivery.status,
      subjectName: await subjectNameFor(ctx, delivery),
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
      rows.map(async (row) => ({
        deliveryId: row._id,
        status: row.status,
        subjectName: await subjectNameFor(ctx, row),
        expiresAt: row.expiresAt,
      }))
    )
  },
})

// ── Console ─────────────────────────────────────────────────────────────────

/**
 * Every delivery, newest first, flattened for the console's data table.
 * Bounded rather than paginated: deliveries exist only after a verified death,
 * so the live set is small, and the table filters and searches client-side.
 */
export const adminTable = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "deliveries.read")
    const rows = await ctx.db
      .query("deliveries")
      .order("desc")
      .take(ADMIN_TABLE_CAP + 1)

    const table = await Promise.all(
      rows.slice(0, ADMIN_TABLE_CAP).map(async (row) => {
        const heir = await ctx.db.get("heirs", row.heirId)
        const subject = await ctx.db.get("users", row.subjectUserId)
        const bound =
          row.heirUserId === undefined
            ? null
            : await ctx.db.get("users", row.heirUserId)
        const last = await ctx.db
          .query("deliveryContacts")
          .withIndex("by_deliveryId", (q) => q.eq("deliveryId", row._id))
          .order("desc")
          .first()
        return {
          deliveryId: row._id,
          claimId: row.claimId,
          status: row.status,
          heirName: heir?.name ?? null,
          heirRelation: heir?.relation ?? null,
          subjectName: subject?.identityVerifiedName ?? subject?.name ?? null,
          boundVerified: bound?.identityStatus === "verified",
          identityMatch: row.identityMatch ?? null,
          lastContact:
            last === null
              ? null
              : { at: last.at, channel: last.channel, outcome: last.outcome },
          createdAt: row._creationTime,
          expiresAt: row.expiresAt,
        }
      })
    )
    return { rows: table, capped: rows.length > ADMIN_TABLE_CAP }
  },
})

/** Everything the console's side sheet shows for one delivery. */
export const adminDetail = query({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    await requirePermission(ctx, "deliveries.read")
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null) return null
    const heir = await ctx.db.get("heirs", delivery.heirId)
    const subject = await ctx.db.get("users", delivery.subjectUserId)
    const bound =
      delivery.heirUserId === undefined
        ? null
        : await ctx.db.get("users", delivery.heirUserId)
    const contacts = await ctx.db
      .query("deliveryContacts")
      .withIndex("by_deliveryId", (q) => q.eq("deliveryId", deliveryId))
      .order("desc")
      .take(50)
    const staffIds = [
      ...new Set(
        contacts.flatMap((row) =>
          row.staffUserId === undefined ? [] : [row.staffUserId]
        )
      ),
    ]
    const staff = new Map<string, string | null>()
    for (const id of staffIds) {
      staff.set(id, (await ctx.db.get("users", id))?.name ?? null)
    }
    const contact = contactOf(delivery, heir)

    return {
      deliveryId: delivery._id,
      claimId: delivery.claimId,
      status: delivery.status,
      subjectName: subject?.identityVerifiedName ?? subject?.name ?? null,
      heir: {
        name: heir?.name ?? null,
        relation: heir?.relation ?? null,
        birthDate: heir?.birthDate ?? null,
        hasIdNumber: heir?.idNumberHash !== undefined,
        registeredPhone: heir?.phone ?? null,
        registeredEmail: heir?.email ?? null,
      },
      contact: {
        phone: contact.phone,
        email: contact.email,
        phoneOverridden: delivery.contactPhone !== undefined,
        emailOverridden: delivery.contactEmail !== undefined,
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
      link: (await appLink(ctx, deliveryPath(delivery.contactToken))) ?? null,
      identityMatch: delivery.identityMatch ?? null,
      staffNote: delivery.staffNote ?? null,
      timeline: contacts.map((row) => ({
        id: row._id,
        at: row.at,
        channel: row.channel,
        outcome: row.outcome,
        note: row.note ?? null,
        staffName:
          row.staffUserId === undefined
            ? null
            : (staff.get(row.staffUserId) ?? null),
      })),
      createdAt: delivery._creationTime,
      readyAt: delivery.readyAt ?? null,
      expiresAt: delivery.expiresAt,
    }
  },
})

const channelValidator = v.union(
  v.literal("sms"),
  v.literal("email"),
  v.literal("call"),
  v.literal("whatsapp"),
  v.literal("visit"),
  v.literal("other")
)
const outcomeValidator = v.union(
  v.literal("sent"),
  v.literal("failed"),
  v.literal("reached"),
  v.literal("no_answer"),
  v.literal("wrong_person"),
  v.literal("other")
)

async function requireLiveDelivery(
  ctx: MutationCtx,
  deliveryId: Id<"deliveries">
): Promise<Doc<"deliveries">> {
  const delivery = await ctx.db.get("deliveries", deliveryId)
  if (delivery === null) throw new Error("Not found")
  if (delivery.status === "expired") throw new Error("This delivery has closed")
  return delivery
}

/** Staff record an attempt to reach the heir, by any route. */
export const adminLogContact = mutation({
  args: {
    deliveryId: v.id("deliveries"),
    channel: channelValidator,
    outcome: outcomeValidator,
    note: v.optional(v.string()),
  },
  handler: async (ctx, { deliveryId, channel, outcome, note }) => {
    const actor = await requirePermission(ctx, "deliveries.contact")
    const delivery = await requireLiveDelivery(ctx, deliveryId)
    const now = Date.now()
    await logContact(ctx, {
      deliveryId,
      at: now,
      channel,
      outcome,
      note: note?.trim() || undefined,
      staffUserId: actor._id,
    })
    await writeStaffAudit(ctx, {
      actor,
      subject: delivery.subjectUserId,
      event: "delivery.contact_logged",
      meta: { deliveryId, channel, outcome },
      at: now,
    })
    return null
  },
})

/**
 * Staff record where the heir can be reached now. The heir record is the
 * owner's and stays as they left it; these win for every later send.
 * An empty string clears an override.
 */
export const adminUpdateContact = mutation({
  args: {
    deliveryId: v.id("deliveries"),
    phone: v.optional(v.string()),
    email: v.optional(v.string()),
  },
  handler: async (ctx, { deliveryId, phone, email }) => {
    const actor = await requirePermission(ctx, "deliveries.contact")
    const delivery = await requireLiveDelivery(ctx, deliveryId)
    const cleanPhone = phone?.replace(/[\s-]/g, "")
    const cleanEmail = email?.trim().toLowerCase()
    if (cleanPhone && !/^\+\d{8,15}$/.test(cleanPhone)) {
      throw new Error("Phone must be in international form, e.g. +966551234567")
    }
    if (cleanEmail && !EMAIL.test(cleanEmail)) {
      throw new Error("That is not an email address")
    }
    await ctx.db.patch("deliveries", deliveryId, {
      ...(cleanPhone === undefined
        ? {}
        : { contactPhone: cleanPhone || undefined }),
      ...(cleanEmail === undefined
        ? {}
        : { contactEmail: cleanEmail || undefined }),
    })
    await writeStaffAudit(ctx, {
      actor,
      subject: delivery.subjectUserId,
      event: "delivery.contact_updated",
      meta: {
        deliveryId,
        phone: cleanPhone !== undefined,
        email: cleanEmail !== undefined,
      },
    })
    return null
  },
})

/** Send the current link again, on one channel. */
export const adminResend = mutation({
  args: {
    deliveryId: v.id("deliveries"),
    channel: v.union(v.literal("sms"), v.literal("email")),
  },
  handler: async (ctx, { deliveryId, channel }) => {
    const actor = await requirePermission(ctx, "deliveries.contact")
    const delivery = await requireLiveDelivery(ctx, deliveryId)
    if (delivery.status === "ready" || delivery.status === "rejected") {
      throw new Error("There is nothing left to invite this heir to")
    }
    const heir = await ctx.db.get("heirs", delivery.heirId)
    const contact = contactOf(delivery, heir)
    if ((channel === "sms" ? contact.phone : contact.email) === null) {
      throw new Error(
        `No ${channel === "sms" ? "phone number" : "email"} to send to`
      )
    }
    const { outreachProvider } = await settingsFor(ctx)
    if (channel === "sms" && outreachProvider !== "twilio") {
      throw new Error(
        "No SMS provider is configured — copy the link and send it by hand"
      )
    }
    await inviteHeir(ctx, delivery, {
      email: channel === "email",
      sms: channel === "sms",
    })
    await writeStaffAudit(ctx, {
      actor,
      subject: delivery.subjectUserId,
      event: "delivery.resent",
      meta: { deliveryId, channel },
    })
    return null
  },
})

/**
 * Kill the current link and issue a new one — for a link that reached the
 * wrong person or a contact that is no longer the heir's. A binding that is
 * not yet final is released with it, so a stranger who bound the old link is
 * out. The new link goes to the current contacts on every channel.
 */
export const adminReissueLink = mutation({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const actor = await requirePermission(ctx, "deliveries.contact")
    const delivery = await requireLiveDelivery(ctx, deliveryId)
    if (delivery.status === "ready") {
      throw new Error(
        "This delivery was already received — its link can no longer bind anyone"
      )
    }
    await ctx.db.patch("deliveries", deliveryId, {
      contactToken: randomToken(),
      status: "awaiting_heir",
      heirUserId: undefined,
      boundAt: undefined,
      identityMatch: undefined,
    })
    await writeStaffAudit(ctx, {
      actor,
      subject: delivery.subjectUserId,
      event: "delivery.link_reissued",
      meta: { deliveryId, releasedBinding: delivery.heirUserId !== undefined },
    })
    const fresh = await ctx.db.get("deliveries", deliveryId)
    if (fresh !== null) await inviteHeir(ctx, fresh)
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
    const actor = await requirePermission(ctx, "deliveries.decide")
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null) throw new Error("Not found")
    if (
      delivery.status !== "identity_pending" ||
      delivery.heirUserId === undefined
    ) {
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
    await writeStaffAudit(ctx, {
      actor,
      subject: delivery.subjectUserId,
      event: approve ? "delivery.ready" : "delivery.rejected",
      meta: { deliveryId, match: "staff" },
      at: now,
    })
    // The heir was told on the page that we would write when it is ready.
    if (approve) {
      await sendDeliveryReady(
        ctx,
        delivery.heirUserId,
        deliveryId,
        delivery.expiresAt
      )
    }
    return null
  },
})

// ── Internal ────────────────────────────────────────────────────────────────

/** The heir's phone and link, for `outreach.contactHeir` only. */
export const contactDetails = internalQuery({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null) return null
    if (
      delivery.status !== "awaiting_heir" &&
      delivery.status !== "identity_pending"
    ) {
      return null
    }
    const heir = await ctx.db.get("heirs", delivery.heirId)
    const { phone } = contactOf(delivery, heir)
    if (phone === null) return null
    return {
      phone,
      link: (await appLink(ctx, deliveryPath(delivery.contactToken))) ?? null,
    }
  },
})

/** Written by `outreach.contactHeir` with the provider's answer. */
export const recordSms = internalMutation({
  args: { deliveryId: v.id("deliveries"), sent: v.boolean() },
  handler: async (ctx, { deliveryId, sent }) => {
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null) return null
    await logContact(ctx, {
      deliveryId,
      at: Date.now(),
      channel: "sms",
      outcome: sent ? "sent" : "failed",
    })
    return null
  },
})

/**
 * Daily. Warns each bound heir thirty days before their delivery closes, then
 * destroys the locked key and bundle of every delivery past its window, so
 * after a year nobody — Wassiya included — can open it again.
 */
export const expire = internalMutation({
  // Set by the reschedule below, absent on the pass the cron itself started —
  // the same contract `checkin.sweep` uses, so `recordJobRun` prunes once per
  // logical sweep rather than once per batch.
  args: { continued: v.optional(v.boolean()) },
  handler: async (ctx, { continued }) => {
    const now = Date.now()
    let reminded = 0

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
        if (
          delivery.remindedAt !== undefined ||
          delivery.heirUserId === undefined
        ) {
          continue
        }
        await ctx.db.patch("deliveries", delivery._id, { remindedAt: now })
        await sendDeliveryExpiring(
          ctx,
          delivery.heirUserId,
          delivery._id,
          delivery.expiresAt
        )
        reminded += 1
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
    const rescheduled = expired === EXPIRE_BATCH
    if (rescheduled) {
      await ctx.scheduler.runAfter(0, internal.deliveries.expire, {
        continued: true,
      })
    }

    // The heartbeat, written on every pass including the ones that destroy
    // nothing. This sweep is the one that makes a delivery unopenable forever,
    // so "it has not run since Tuesday" and "nothing was due since Tuesday"
    // must not look the same from the console. They did: this job was missing
    // from `JOB_NAMES` entirely and recorded no runs at all.
    await recordJobRun(ctx, {
      name: "deliveries.expire",
      ranAt: now,
      scanned: reminded + expired,
      changed: expired,
      rescheduled,
      continued: continued === true,
    })

    return { expired }
  },
})

function randomToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(TOKEN_BYTES))
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  )
}
