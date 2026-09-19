// Contacting heirs after release — the first thing an heir ever hears.
//
// Rules:
//  - Off unless `OUTREACH_PROVIDER=twilio` and its credentials are set on the
//    Convex deployment. Otherwise staff send the link by hand from the admin
//    Deliveries screen, which is the fallback for any failure here too.
//  - The message names no one and nothing: an SMS is readable on a locked
//    screen. The link leads to a page that asks for sign-in and identity.
//  - The link carries the delivery's capability token, so neither it nor the
//    message body is ever logged.
import { v } from "convex/values"

import { internal } from "./_generated/api"
import { internalAction } from "./_generated/server"

const BODY =
  "وصيّة: تُرك لك شيء. افتح الرابط وأثبت هويتك لتستلمه:\n{link}\n\nWassiya: something was left for you. Open the link and verify your identity to receive it."

export const contactHeir = internalAction({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    if (process.env.OUTREACH_PROVIDER !== "twilio") return null

    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = process.env.TWILIO_FROM
    if (sid === undefined || token === undefined || from === undefined) {
      console.error("Outreach is set to twilio but its credentials are missing")
      return null
    }

    const details: { phone: string; link: string | null } | null =
      await ctx.runQuery(internal.deliveries.contactDetails, { deliveryId })
    if (details === null || details.link === null) return null

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,
      {
        method: "POST",
        headers: {
          authorization: `Basic ${btoa(`${sid}:${token}`)}`,
          "content-type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
          To: details.phone,
          // A Messaging Service SID ("MG…") or a sender number both work.
          ...(from.startsWith("MG") ? { MessagingServiceSid: from } : { From: from }),
          Body: BODY.replace("{link}", details.link),
        }),
      }
    )
    if (!response.ok) {
      // Deliberately no body echo: it can quote the request, link included.
      console.error(`Outreach SMS failed (${response.status})`)
      return null
    }
    await ctx.runMutation(internal.deliveries.recordContacted, {
      deliveryId,
      channel: "sms",
    })
    return null
  },
})
