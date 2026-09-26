// Deliveries — one executor's copy of a released death report.
//
// Rules (AGENTS.md "Executors"):
//  - Created only by `claims.advance`, one per executor, never by a client.
//    The reporter receives nothing by reporting.
//  - The contact link only lets a signed-in person *bind* the delivery to
//    their account. Nothing is served until `status === "ready"`, which needs
//    the bound person's own Didit verification to match this executor's
//    registered ID number — automatically, or by a staff decision when the
//    verified document does not match. And nothing opens without their sheet.
//  - **Nothing names the deceased or the executor before identity passes.** Phone
//    numbers and addresses get recycled; whoever holds the link may be a
//    stranger, and must learn no more than that something is waiting.
//  - Binding may be taken over until the delivery is ready, so whoever reaches
//    a forwarded link first cannot lock the real executor out; staff can also
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
const LIVE_STATUSES = ["awaiting_executor", "identity_pending", "ready"] as const
const ADMIN_TABLE_CAP = 300
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function deliveryPath(contactToken: string): string {
  return `/receive/${contactToken}`
}

/** Where to reach an executor now: staff overrides first, then the owner's record. */
function contactOf(
  delivery: Doc<"deliveries">,
  executor: Doc<"executors"> | null
): { phone: string | null; email: string | null } {
  return {
    phone: delivery.contactPhone ?? executor?.phone ?? null,
    email: delivery.contactEmail ?? executor?.email ?? null,
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
 * Send the link on every channel the executor has: email now, in this transaction,
 * and SMS through `outreach.contactExecutor` (a no-op until a provider is set).
 */
async function inviteExecutor(
  ctx: MutationCtx,
  delivery: Doc<"deliveries">,
  channels: { email: boolean; sms: boolean } = { email: true, sms: true }
): Promise<void> {
  const executor = await ctx.db.get("executors", delivery.executorId)
  const { email } = contactOf(delivery, executor)
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
    await ctx.scheduler.runAfter(0, internal.outreach.contactExecutor, {
      deliveryId: delivery._id,
    })
  }
}

/** One delivery per executor of `subjectUserId`: each receives everything. */
export async function createDeliveriesForClaim(
  ctx: MutationCtx,
  claimId: Id<"claims">,
  subjectUserId: Id<"users">,
  now: number
): Promise<number> {
  const executors = await ctx.db
    .query("executors")
    .withIndex("by_userId", (q) => q.eq("userId", subjectUserId))
    .take(100)

  let created = 0
  for (const { _id: executorId } of executors) {
    const existing = await ctx.db
      .query("deliveries")
      .withIndex("by_executorId", (q) => q.eq("executorId", executorId))
      .take(10)
    if (existing.some((row) => row.claimId === claimId)) continue

    const deliveryId = await ctx.db.insert("deliveries", {
      claimId,
      subjectUserId,
      executorId,
      status: "awaiting_executor",
      contactToken: randomToken(),
      expiresAt: now + DELIVERY_WINDOW_DAYS * DAY_MS,
    })
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery !== null) await inviteExecutor(ctx, delivery)
    created += 1
  }
  return created
}

/**
 * Move a bound delivery to `ready` when the bound person's verified document
 * matches the ID number the owner registered. Anything short of that leaves it
 * for staff. Called on bind, on a verdict, and when an executor's ID number changes.
 */
export async function evaluateDeliveryIdentity(
  ctx: MutationCtx,
  delivery: Doc<"deliveries">,
  executorUser: Doc<"users">,
  now: number
): Promise<void> {
  if (delivery.status !== "identity_pending") return
  if (executorUser.identityStatus !== "verified") return

  const executor = await ctx.db.get("executors", delivery.executorId)
  const matches =
    executor !== null &&
    (executorUser.identityDocHashes ?? []).includes(executor.idNumberHash)
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
      executorId: delivery.executorId,
      match: "id_number",
    },
    at: now,
  })
  await sendDeliveryReady(ctx, executorUser._id, delivery._id, delivery.expiresAt)
}

/** Re-evaluate every delivery this person has bound — the webhook's hook. */
export async function reevaluateDeliveriesFor(
  ctx: MutationCtx,
  executorUser: Doc<"users">
): Promise<void> {
  const bound = await ctx.db
    .query("deliveries")
    .withIndex("by_executorUserId", (q) => q.eq("executorUserId", executorUser._id))
    .take(20)
  const now = Date.now()
  for (const delivery of bound) {
    await evaluateDeliveryIdentity(ctx, delivery, executorUser, now)
  }
}

/** The deceased's name, only once the reader has proved they are the executor. */
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

    if (delivery.executorUserId === user._id) return { deliveryId: delivery._id }
    if (delivery.status === "ready") {
      throw new Error("This delivery has already been received")
    }
    if (delivery.status === "expired" || delivery.status === "rejected") {
      throw new Error("Not found")
    }
    if (delivery.subjectUserId === user._id) throw new Error("Not found")

    const now = Date.now()
    await ctx.db.patch("deliveries", delivery._id, {
      executorUserId: user._id,
      boundAt: now,
      status: "identity_pending",
    })
    await writeAudit(ctx, {
      userId: delivery.subjectUserId,
      event: "delivery.bound",
      meta: {
        deliveryId: delivery._id,
        executorUserId: user._id,
        takenOver: delivery.executorUserId !== undefined,
      },
      at: now,
    })

    const fresh = await ctx.db.get("deliveries", delivery._id)
    if (fresh !== null) await evaluateDeliveryIdentity(ctx, fresh, user, now)
    return { deliveryId: delivery._id }
  },
})

/** The signed-in executor's view of one delivery. */
export const forExecutor = query({
  // A string, normalised here: the id comes from a URL, and a truncated one
  // should read as "not found" rather than crash the validator.
  args: { deliveryId: v.string() },
  handler: async (ctx, args) => {
    const user = await getCurrentUserOrThrow(ctx)
    const deliveryId = ctx.db.normalizeId("deliveries", args.deliveryId)
    if (deliveryId === null) return null
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null || delivery.executorUserId !== user._id) return null
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
      .withIndex("by_executorUserId", (q) => q.eq("executorUserId", user._id))
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
        const executor = await ctx.db.get("executors", row.executorId)
        const subject = await ctx.db.get("users", row.subjectUserId)
        const bound =
          row.executorUserId === undefined
            ? null
            : await ctx.db.get("users", row.executorUserId)
        const last = await ctx.db
          .query("deliveryContacts")
          .withIndex("by_deliveryId", (q) => q.eq("deliveryId", row._id))
          .order("desc")
          .first()
        return {
          deliveryId: row._id,
          claimId: row.claimId,
          status: row.status,
          executorName: executor?.name ?? null,
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
    const executor = await ctx.db.get("executors", delivery.executorId)
    const subject = await ctx.db.get("users", delivery.subjectUserId)
    const bound =
      delivery.executorUserId === undefined
        ? null
        : await ctx.db.get("users", delivery.executorUserId)
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
    const contact = contactOf(delivery, executor)

    return {
      deliveryId: delivery._id,
      claimId: delivery.claimId,
      status: delivery.status,
      subjectName: subject?.identityVerifiedName ?? subject?.name ?? null,
      executor: {
        name: executor?.name ?? null,
        registeredPhone: executor?.phone ?? null,
        registeredEmail: executor?.email ?? null,
      },
      contact: {
        phone: contact.phone,
        email: contact.email,
        phoneOverridden: delivery.contactPhone !== undefined,
        emailOverridden: delivery.contactEmail !== undefined,
      },
      // What staff compare when the ID number did not match.
      boundPerson:
        bound === null
          ? null
          : {
              verifiedName: bound.identityVerifiedName ?? null,
              birthDate: bound.identityBirthDate ?? null,
              identityStatus: bound.identityStatus ?? "unverified",
              idNumberMatches:
                executor !== null &&
                (bound.identityDocHashes ?? []).includes(executor.idNumberHash),
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

/** Staff record an attempt to reach the executor, by any route. */
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
 * Staff record where the executor can be reached now. The executor record is the
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
      throw new Error("There is nothing left to invite this executor to")
    }
    const executor = await ctx.db.get("executors", delivery.executorId)
    const contact = contactOf(delivery, executor)
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
    await inviteExecutor(ctx, delivery, {
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
 * wrong person or a contact that is no longer the executor's. A binding that is
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
      status: "awaiting_executor",
      executorUserId: undefined,
      boundAt: undefined,
      identityMatch: undefined,
    })
    await writeStaffAudit(ctx, {
      actor,
      subject: delivery.subjectUserId,
      event: "delivery.link_reissued",
      meta: { deliveryId, releasedBinding: delivery.executorUserId !== undefined },
    })
    const fresh = await ctx.db.get("deliveries", deliveryId)
    if (fresh !== null) await inviteExecutor(ctx, fresh)
    return null
  },
})

/**
 * Staff decide an identity the ID number could not match — a mistyped number,
 * a document that carries it differently — from the bound person's verified
 * name against the executor the owner registered.
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
      delivery.executorUserId === undefined
    ) {
      throw new Error("This delivery is not waiting for an identity decision")
    }
    const bound = await ctx.db.get("users", delivery.executorUserId)
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
    // The executor was told on the page that we would write when it is ready.
    if (approve) {
      await sendDeliveryReady(
        ctx,
        delivery.executorUserId,
        deliveryId,
        delivery.expiresAt
      )
    }
    return null
  },
})

// ── Internal ────────────────────────────────────────────────────────────────

/** The executor's phone and link, for `outreach.contactExecutor` only. */
export const contactDetails = internalQuery({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const delivery = await ctx.db.get("deliveries", deliveryId)
    if (delivery === null) return null
    if (
      delivery.status !== "awaiting_executor" &&
      delivery.status !== "identity_pending"
    ) {
      return null
    }
    const executor = await ctx.db.get("executors", delivery.executorId)
    const { phone } = contactOf(delivery, executor)
    if (phone === null) return null
    return {
      phone,
      link: (await appLink(ctx, deliveryPath(delivery.contactToken))) ?? null,
    }
  },
})

/** Written by `outreach.contactExecutor` with the provider's answer. */
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
 * Daily. Warns each bound executor thirty days before their delivery closes, then
 * closes every delivery past its window and, with the last one, deletes the
 * vault (`vault.purge`), so after a year nobody — Wassiya included — can open
 * it again.
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
          delivery.executorUserId === undefined
        ) {
          continue
        }
        await ctx.db.patch("deliveries", delivery._id, { remindedAt: now })
        await sendDeliveryExpiring(
          ctx,
          delivery.executorUserId,
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
        await ctx.db.patch("deliveries", delivery._id, {
          status: "expired",
          destroyedAt: now,
        })
        // Every executor receives the same vault, so it goes only once the last
        // of this report's deliveries has closed.
        const siblings = await ctx.db
          .query("deliveries")
          .withIndex("by_claimId", (q) => q.eq("claimId", delivery.claimId))
          .take(100)
        const stillOpen = siblings.some((row) =>
          (LIVE_STATUSES as readonly string[]).includes(row.status)
        )
        if (!stillOpen) {
          await ctx.scheduler.runAfter(0, internal.vault.purge, {
            ownerId: delivery.subjectUserId,
          })
        }
        await writeAudit(ctx, {
          userId: delivery.subjectUserId,
          event: "delivery.expired",
          meta: { deliveryId: delivery._id, executorId: delivery.executorId },
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
