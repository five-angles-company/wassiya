// Telling a requester that staff replied, when they have not seen it.
//
// Scheduled by `adminReply` a few minutes out, so someone who is reading the
// thread live gets nothing. Every channel says only that a reply exists —
// never the reply itself.
import { v } from "convex/values"

import { internal } from "../_generated/api"
import { internalMutation } from "../_generated/server"
import { notify } from "../claims"
import { appLink, sendSupportGuestReply, sendSupportReply } from "../email"
import { SUPPORT_REPLY_PUSH } from "../model/emailCopy"
import { randomToken, sha256Hex } from "../model/support"

export const afterReply = internalMutation({
  args: {
    threadId: v.id("supportThreads"),
    messageId: v.id("supportMessages"),
  },
  handler: async (ctx, { threadId, messageId }) => {
    const thread = await ctx.db.get("supportThreads", threadId)
    const message = await ctx.db.get("supportMessages", messageId)
    if (thread === null || message === null) return null

    // Already read, or answered — which reads it.
    if (!thread.requesterUnread) return null
    // A later reply scheduled its own notice; one is enough.
    if (thread.lastAuthor === "staff" && thread.lastMessageAt > message.at) {
      return null
    }

    if (thread.requesterUserId !== undefined) {
      await notify(ctx, thread.requesterUserId, "support.reply", {
        threadId: thread._id,
      })
      const link =
        thread.surface === "web"
          ? await appLink(ctx, `/help/chat/${thread._id}`)
          : undefined
      await sendSupportReply(ctx, thread.requesterUserId, link)

      const devices = await ctx.db
        .query("devices")
        .withIndex("by_userId", (q) => q.eq("userId", thread.requesterUserId!))
        .take(20)
      const tokens = devices
        .filter((device) => !device.revoked && device.pushToken !== undefined)
        .map((device) => device.pushToken!)
      if (tokens.length > 0) {
        const copy = SUPPORT_REPLY_PUSH[thread.locale]
        await ctx.scheduler.runAfter(0, internal.support.push.send, {
          tokens,
          title: copy.subject,
          body: copy.body,
          path: `/settings/help/${thread._id}`,
        })
      }
      return null
    }

    if (thread.guestEmail === undefined || message.staffUserId === undefined) {
      return null
    }
    const resumeToken = randomToken()
    const link = await appLink(ctx, `/help/chat?resume=${resumeToken}`)
    // Without a link a guest has no way back to the thread, so the email
    // would only say that a reply exists somewhere they cannot reach.
    if (link === undefined) return null
    await ctx.db.patch("supportThreads", thread._id, {
      resumeKeyHash: await sha256Hex(resumeToken),
    })
    await sendSupportGuestReply(ctx, {
      to: thread.guestEmail,
      english: thread.locale === "en",
      staffUserId: message.staffUserId,
      link,
    })
    return null
  },
})
