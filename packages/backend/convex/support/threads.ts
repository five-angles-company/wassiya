// The requester's side of support: owners on mobile, executors and reporters on
// web, and guests with no account. Every function takes an optional
// `guestToken`; a Clerk session always wins over it. See `model/support.ts`.
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { mutation, query } from "../_generated/server"
import {
  assertOwnContext,
  attachmentInput,
  canAccess,
  cleanBody,
  cleanGuest,
  createThread,
  localeValidator,
  appendMessage,
  rateKey,
  requesterOf,
  requesterView,
  requireOwnThread,
  requireRequester,
  resolveAttachments,
  sha256Hex,
  supportLimits,
  surfaceValidator,
  topicValidator,
  withUrls,
} from "../model/support"

const guestToken = v.optional(v.string())

export const start = mutation({
  args: {
    guestToken,
    guestName: v.optional(v.string()),
    guestEmail: v.optional(v.string()),
    surface: surfaceValidator,
    topic: topicValidator,
    locale: localeValidator,
    claimId: v.optional(v.id("claims")),
    deliveryId: v.optional(v.id("deliveries")),
    body: v.string(),
    attachments: v.array(attachmentInput),
  },
  handler: async (ctx, args) => {
    const requester = await requireRequester(ctx, args.guestToken)
    const now = Date.now()
    const body = cleanBody(args.body, args.attachments.length > 0)
    await assertOwnContext(ctx, requester, args)

    let guest: { name: string; email: string } | undefined
    if (requester.kind === "guest") {
      // Guests start with text only; files come once a thread exists, so an
      // anonymous upload URL is never one step from nothing.
      if (args.attachments.length > 0) throw new Error("Not allowed")
      guest = cleanGuest(args.guestName, args.guestEmail)
      await supportLimits.limit(ctx, "guestStartGlobal", { throws: true })
      await supportLimits.limit(ctx, "guestStart", {
        key: requester.keyHash,
        throws: true,
      })
      await supportLimits.limit(ctx, "guestStartByEmail", {
        key: guest.email,
        throws: true,
      })
    } else {
      await supportLimits.limit(ctx, "userStart", {
        key: rateKey(requester),
        throws: true,
      })
    }

    const attachments = await resolveAttachments(ctx, args.attachments, now)
    return await createThread(
      ctx,
      requester,
      {
        guest,
        surface: args.surface,
        topic: args.topic,
        locale: args.locale,
        claimId: args.claimId,
        deliveryId: args.deliveryId,
        body,
        attachments,
      },
      now
    )
  },
})

export const send = mutation({
  args: {
    guestToken,
    threadId: v.id("supportThreads"),
    body: v.string(),
    attachments: v.array(attachmentInput),
  },
  handler: async (ctx, args) => {
    const requester = await requireRequester(ctx, args.guestToken)
    const thread = await requireOwnThread(ctx, args.threadId, requester)
    await supportLimits.limit(ctx, "send", {
      key: thread._id,
      throws: true,
    })
    const now = Date.now()
    const body = cleanBody(args.body, args.attachments.length > 0)
    const attachments = await resolveAttachments(ctx, args.attachments, now)
    await appendMessage(ctx, thread, {
      author: "requester",
      body,
      attachments,
      at: now,
    })
    return null
  },
})

/**
 * An upload URL for an attachment. A guest must name a thread they already
 * hold, so a token alone never buys anonymous file hosting.
 */
export const generateUploadUrl = mutation({
  args: { guestToken, threadId: v.optional(v.id("supportThreads")) },
  handler: async (ctx, args) => {
    const requester = await requireRequester(ctx, args.guestToken)
    if (requester.kind === "guest") {
      if (args.threadId === undefined) throw new Error("Not allowed")
      await requireOwnThread(ctx, args.threadId, requester)
    }
    await supportLimits.limit(ctx, "upload", {
      key: rateKey(requester),
      throws: true,
    })
    return await ctx.storage.generateUploadUrl()
  },
})

export const list = query({
  args: { guestToken, paginationOpts: paginationOptsValidator },
  handler: async (ctx, args) => {
    const requester = await requesterOf(ctx, args.guestToken)
    if (requester === null) {
      return { page: [], isDone: true, continueCursor: "" }
    }
    const result =
      requester.kind === "user"
        ? await ctx.db
            .query("supportThreads")
            .withIndex("by_requesterUserId_and_lastMessageAt", (q) =>
              q.eq("requesterUserId", requester.user._id)
            )
            .order("desc")
            .paginate(args.paginationOpts)
        : await ctx.db
            .query("supportThreads")
            .withIndex("by_guestKeyHash_and_lastMessageAt", (q) =>
              q.eq("guestKeyHash", requester.keyHash)
            )
            .order("desc")
            .paginate(args.paginationOpts)
    return {
      ...result,
      page: result.page
        .filter((thread) => canAccess(thread, requester))
        .map(requesterView),
    }
  },
})

export const thread = query({
  args: { guestToken, threadId: v.id("supportThreads") },
  handler: async (ctx, args) => {
    const requester = await requesterOf(ctx, args.guestToken)
    if (requester === null) return null
    const row = await ctx.db.get("supportThreads", args.threadId)
    if (row === null || !canAccess(row, requester)) return null
    return requesterView(row)
  },
})

/** Newest first; the client reverses each page for display. */
export const messages = query({
  args: {
    guestToken,
    threadId: v.id("supportThreads"),
    paginationOpts: paginationOptsValidator,
  },
  handler: async (ctx, args) => {
    const requester = await requireRequester(ctx, args.guestToken)
    await requireOwnThread(ctx, args.threadId, requester)
    const result = await ctx.db
      .query("supportMessages")
      .withIndex("by_threadId_and_at", (q) => q.eq("threadId", args.threadId))
      .order("desc")
      .paginate(args.paginationOpts)
    return {
      ...result,
      page: await Promise.all(
        result.page.map(async (message) => ({
          id: message._id,
          author: message.author,
          body: message.body,
          at: message.at,
          attachments: await withUrls(ctx, message.attachments),
        }))
      ),
    }
  },
})

export const markRead = mutation({
  args: { guestToken, threadId: v.id("supportThreads") },
  handler: async (ctx, args) => {
    const requester = await requireRequester(ctx, args.guestToken)
    const thread = await requireOwnThread(ctx, args.threadId, requester)
    if (thread.requesterUnread) {
      await ctx.db.patch("supportThreads", thread._id, {
        requesterUnread: false,
      })
    }
    return null
  },
})

/** Threads with a staff reply the signed-in caller has not read, capped. */
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const requester = await requesterOf(ctx, undefined)
    if (requester?.kind !== "user") return 0
    const recent = await ctx.db
      .query("supportThreads")
      .withIndex("by_requesterUserId_and_lastMessageAt", (q) =>
        q.eq("requesterUserId", requester.user._id)
      )
      .order("desc")
      .take(20)
    return recent.filter(
      (thread) => requesterView(thread).unread
    ).length
  },
})

/**
 * Redeem the single-use link from a guest's reply email: the thread moves to
 * the browser holding `guestToken`, and the link stops working. The browser
 * that held it before loses the thread — the newest link wins.
 */
export const resume = mutation({
  args: { resumeToken: v.string(), guestToken: v.string() },
  handler: async (ctx, args) => {
    const requester = await requireRequester(ctx, args.guestToken)
    if (requester.kind !== "guest") throw new Error("Not allowed")
    const resumeKeyHash = await sha256Hex(args.resumeToken)
    const thread = await ctx.db
      .query("supportThreads")
      .withIndex("by_resumeKeyHash", (q) =>
        q.eq("resumeKeyHash", resumeKeyHash)
      )
      .unique()
    if (thread === null || thread.requesterUserId !== undefined) {
      throw new Error("This link has expired")
    }
    await ctx.db.patch("supportThreads", thread._id, {
      guestKeyHash: requester.keyHash,
      resumeKeyHash: undefined,
    })
    return thread._id
  },
})
