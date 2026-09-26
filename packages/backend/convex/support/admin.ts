// The console's side of support. Every export is gated by `requirePermission`.
//
// Staff see what the requester wrote and what is already bound to the
// requester's own account — never a vault, and never whether a stranger's
// email belongs to one. Executors are silent until release, and a support thread is
// not an exception: nothing here may confirm that someone is an executor or that a
// vault exists to anyone but its owner.
//
// Staff actions are audited against the staff member themselves: the message
// or note already records who wrote it, and an owner's own audit timeline is
// for security events on their vault, not their conversations.
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { internal } from "../_generated/api"
import type { Doc, Id } from "../_generated/dataModel"
import { mutation, query, type QueryCtx } from "../_generated/server"
import { writeStaffAudit } from "../audit"
import { hasPermission, requirePermission } from "../model/access"
import { staffAccounts } from "../model/staff"
import {
  appendMessage,
  attachmentInput,
  cleanBody,
  REPLY_NOTIFY_DELAY_MS,
  resolveAttachments,
  withUrls,
} from "../model/support"

const inboxView = v.union(
  v.literal("open"),
  v.literal("mine"),
  v.literal("unassigned"),
  v.literal("waiting"),
  v.literal("resolved"),
  v.literal("all")
)
type InboxView =
  | "open"
  | "mine"
  | "unassigned"
  | "waiting"
  | "resolved"
  | "all"

const INBOX_TALLY_CAP = 500

function inboxQuery(
  ctx: QueryCtx,
  me: Id<"users">,
  view: InboxView,
  search: string
) {
  const term = search.trim()
  if (term.length > 0) {
    const status =
      view === "open" || view === "waiting" || view === "resolved"
        ? view
        : undefined
    return ctx.db
      .query("supportThreads")
      .withSearchIndex("search_text", (q) =>
        status === undefined
          ? q.search("searchText", term)
          : q.search("searchText", term).eq("status", status)
      )
  }
  switch (view) {
    case "open":
    case "waiting":
    case "resolved":
      return ctx.db
        .query("supportThreads")
        .withIndex("by_status_and_lastMessageAt", (q) => q.eq("status", view))
        .order("desc")
    case "unassigned":
      return ctx.db
        .query("supportThreads")
        .withIndex("by_status_and_assigneeUserId_and_lastMessageAt", (q) =>
          q.eq("status", "open").eq("assigneeUserId", undefined)
        )
        .order("desc")
    case "mine":
      return ctx.db
        .query("supportThreads")
        .withIndex("by_status_and_assigneeUserId_and_lastMessageAt", (q) =>
          q.eq("status", "open").eq("assigneeUserId", me)
        )
        .order("desc")
    case "all":
      return ctx.db
        .query("supportThreads")
        .withIndex("by_lastMessageAt")
        .order("desc")
  }
}

async function requesterSummary(
  ctx: QueryCtx,
  thread: Doc<"supportThreads">
) {
  if (thread.requesterUserId === undefined) {
    return {
      kind: "guest" as const,
      userId: null,
      name: thread.guestName ?? null,
      email: thread.guestEmail ?? null,
      identityStatus: null,
    }
  }
  const user = await ctx.db.get("users", thread.requesterUserId)
  return {
    kind: "user" as const,
    userId: thread.requesterUserId,
    name: user?.identityVerifiedName ?? user?.name ?? null,
    email: user?.email ?? null,
    identityStatus: user?.identityStatus ?? "unverified",
  }
}

async function nameOf(
  ctx: QueryCtx,
  userId: Id<"users"> | undefined
): Promise<string | null> {
  if (userId === undefined) return null
  const user = await ctx.db.get("users", userId)
  return user?.name ?? user?.email ?? null
}

async function inboxRow(ctx: QueryCtx, thread: Doc<"supportThreads">) {
  return {
    id: thread._id,
    status: thread.status,
    topic: thread.topic,
    surface: thread.surface,
    locale: thread.locale,
    requester: await requesterSummary(ctx, thread),
    assigneeUserId: thread.assigneeUserId ?? null,
    assigneeName: await nameOf(ctx, thread.assigneeUserId),
    preview: thread.preview,
    lastAuthor: thread.lastAuthor,
    lastMessageAt: thread.lastMessageAt,
    unread: thread.staffUnread,
    createdAt: thread._creationTime,
  }
}

export const adminInboxPage = query({
  args: {
    paginationOpts: paginationOptsValidator,
    view: inboxView,
    search: v.string(),
  },
  handler: async (ctx, { paginationOpts, view, search }) => {
    const actor = await requirePermission(ctx, "support.read")
    const result = await inboxQuery(ctx, actor._id, view, search).paginate(
      paginationOpts
    )
    return {
      ...result,
      page: await Promise.all(result.page.map((row) => inboxRow(ctx, row))),
    }
  },
})

export const adminInboxTally = query({
  args: { view: inboxView, search: v.string() },
  handler: async (ctx, { view, search }) => {
    const actor = await requirePermission(ctx, "support.read")
    const rows = await inboxQuery(ctx, actor._id, view, search).take(
      INBOX_TALLY_CAP + 1
    )
    return {
      count: Math.min(rows.length, INBOX_TALLY_CAP),
      more: rows.length > INBOX_TALLY_CAP,
    }
  },
})

/** The sidebar badge: open threads nobody has taken. */
export const adminBadge = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "support.read")
    const rows = await ctx.db
      .query("supportThreads")
      .withIndex("by_status_and_assigneeUserId_and_lastMessageAt", (q) =>
        q.eq("status", "open").eq("assigneeUserId", undefined)
      )
      .take(100)
    return rows.length
  },
})

export const adminThread = query({
  args: { threadId: v.string() },
  handler: async (ctx, { threadId: rawId }) => {
    await requirePermission(ctx, "support.read")
    const threadId = ctx.db.normalizeId("supportThreads", rawId)
    if (threadId === null) return null
    const thread = await ctx.db.get("supportThreads", threadId)
    if (thread === null) return null

    const notes = await ctx.db
      .query("supportNotes")
      .withIndex("by_threadId_and_at", (q) => q.eq("threadId", threadId))
      .take(200)

    return {
      ...(await inboxRow(ctx, thread)),
      claimId: thread.claimId ?? null,
      deliveryId: thread.deliveryId ?? null,
      resolvedAt: thread.resolvedAt ?? null,
      filesPurged: thread.filesPurgedAt !== undefined,
      notes: await Promise.all(
        notes.map(async (note) => ({
          id: note._id,
          body: note.body,
          at: note.at,
          authorName: await nameOf(ctx, note.authorUserId),
        }))
      ),
    }
  },
})

/** Newest first, like the requester's own read. */
export const adminMessages = query({
  args: {
    threadId: v.id("supportThreads"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, { threadId, paginationOpts }) => {
    await requirePermission(ctx, "support.read")
    const result = await ctx.db
      .query("supportMessages")
      .withIndex("by_threadId_and_at", (q) => q.eq("threadId", threadId))
      .order("desc")
      .paginate(paginationOpts)
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (message) => ({
          id: message._id,
          author: message.author,
          staffName: await nameOf(ctx, message.staffUserId),
          body: message.body,
          at: message.at,
          attachments: await withUrls(ctx, message.attachments),
        }))
      ),
    }
  },
})

/** Staff who can be handed a thread. */
export const adminAssignees = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "support.read")
    const staff = await staffAccounts(ctx)
    return staff
      .filter((user) => hasPermission(user, "support.reply"))
      .map((user) => ({ id: user._id, name: user.name ?? user.email ?? "—" }))
  },
})

async function loadThread(
  ctx: QueryCtx,
  threadId: Id<"supportThreads">
): Promise<Doc<"supportThreads">> {
  const thread = await ctx.db.get("supportThreads", threadId)
  if (thread === null) throw new Error("Not found")
  return thread
}

export const adminReply = mutation({
  args: {
    threadId: v.id("supportThreads"),
    body: v.string(),
    attachments: v.array(attachmentInput),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "support.reply")
    const thread = await loadThread(ctx, args.threadId)
    const now = Date.now()
    const body = cleanBody(args.body, args.attachments.length > 0)
    const attachments = await resolveAttachments(ctx, args.attachments, now)

    const messageId = await appendMessage(ctx, thread, {
      author: "staff",
      staffUserId: actor._id,
      body,
      attachments,
      at: now,
    })
    if (thread.assigneeUserId === undefined) {
      await ctx.db.patch("supportThreads", thread._id, {
        assigneeUserId: actor._id,
      })
    }
    await ctx.scheduler.runAfter(
      REPLY_NOTIFY_DELAY_MS,
      internal.support.notify.afterReply,
      { threadId: thread._id, messageId }
    )
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "support.replied",
      meta: { threadId: thread._id },
    })
    return null
  },
})

export const adminNote = mutation({
  args: { threadId: v.id("supportThreads"), body: v.string() },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "support.reply")
    const thread = await loadThread(ctx, args.threadId)
    const body = cleanBody(args.body, false)
    await ctx.db.insert("supportNotes", {
      threadId: thread._id,
      authorUserId: actor._id,
      body,
      at: Date.now(),
    })
    return null
  },
})

/**
 * Take a thread, hand it on, or let it go. Taking or releasing your own needs
 * `support.reply`; moving anyone else's needs `support.manage`.
 */
export const adminAssign = mutation({
  args: {
    threadId: v.id("supportThreads"),
    assigneeUserId: v.union(v.id("users"), v.null()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "support.reply")
    const thread = await loadThread(ctx, args.threadId)
    const touchesOthers =
      (args.assigneeUserId !== null && args.assigneeUserId !== actor._id) ||
      (thread.assigneeUserId !== undefined &&
        thread.assigneeUserId !== actor._id)
    if (touchesOthers && !hasPermission(actor, "support.manage")) {
      throw new Error("Not authorised (needs support.manage)")
    }
    if (args.assigneeUserId !== null) {
      const assignee = await ctx.db.get("users", args.assigneeUserId)
      if (assignee === null || !hasPermission(assignee, "support.reply")) {
        throw new Error("That person cannot answer support threads")
      }
    }
    await ctx.db.patch("supportThreads", thread._id, {
      assigneeUserId: args.assigneeUserId ?? undefined,
    })
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "support.assigned",
      meta: { threadId: thread._id, assigned: args.assigneeUserId !== null },
    })
    return null
  },
})

export const adminSetStatus = mutation({
  args: {
    threadId: v.id("supportThreads"),
    status: v.union(v.literal("open"), v.literal("resolved")),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "support.reply")
    const thread = await loadThread(ctx, args.threadId)
    if (thread.status === args.status) return null
    await ctx.db.patch("supportThreads", thread._id, {
      status: args.status,
      resolvedAt: args.status === "resolved" ? Date.now() : undefined,
    })
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: args.status === "resolved" ? "support.resolved" : "support.reopened",
      meta: { threadId: thread._id },
    })
    return null
  },
})

export const adminMarkRead = mutation({
  args: { threadId: v.id("supportThreads") },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "support.read")
    const thread = await loadThread(ctx, args.threadId)
    if (thread.staffUnread) {
      await ctx.db.patch("supportThreads", thread._id, {
        staffUnread: false,
      })
    }
    return null
  },
})

export const adminGenerateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "support.reply")
    return await ctx.storage.generateUploadUrl()
  },
})
