// Notifications.
//
// A notification reports and navigates. It never confirms anything — in
// particular, tapping a check-in reminder must open the check-in prompt, where
// the biometric gate lives, and must never itself count as a life confirmation.
// See the header of `checkin.ts` for why that rule is not negotiable.
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { requireUser } from "./model/access"

export const list = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    const user = await requireUser(ctx)
    return await ctx.db
      .query("notifications")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .order("desc")
      .paginate(paginationOpts)
  },
})

export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    // Bounded on purpose: the badge says "9+", so counting past that is waste.
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_userId_and_readAt", (q) =>
        q.eq("userId", user._id).eq("readAt", undefined)
      )
      .take(10)
    return unread.length
  },
})

export const markRead = mutation({
  args: { notificationId: v.id("notifications") },
  handler: async (ctx, { notificationId }) => {
    const user = await requireUser(ctx)
    const row = await ctx.db.get("notifications", notificationId)
    if (row === null || row.userId !== user._id) {
      throw new Error("Not found")
    }
    if (row.readAt === undefined) {
      await ctx.db.patch("notifications", notificationId, {
        readAt: Date.now(),
      })
    }
    return null
  },
})
