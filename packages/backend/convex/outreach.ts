// Contacting executors after release — the first thing an executor ever hears.
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
  "وصيّة: سمّاك شخص وصياً على ما تركه. افتح الرابط وأثبت هويتك، وجهّز ورقة الوصي:\n{link}\n\nWassiya: someone named you as their executor. Open the link, verify your identity, and have the executor sheet ready."

export const contactExecutor = internalAction({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    // The switch and the sender are settings; the credentials are not. An
    // action cannot read the database directly, so the resolved pair comes
    // back through the same internal query that fetches the delivery.
    const config: { provider: string; from: string | null } =
      await ctx.runQuery(internal.settings.outreachConfig, {})
    if (config.provider !== "twilio") return null

    const sid = process.env.TWILIO_ACCOUNT_SID
    const token = process.env.TWILIO_AUTH_TOKEN
    const from = config.from ?? undefined
    if (sid === undefined || token === undefined || from === undefined) {
      console.error(
        "Outreach is set to twilio but its credentials or sender are missing"
      )
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
          ...(from.startsWith("MG")
            ? { MessagingServiceSid: from }
            : { From: from }),
          Body: BODY.replace("{link}", details.link),
        }),
      }
    )
    if (!response.ok) {
      // Deliberately no body echo: it can quote the request, link included.
      console.error(`Outreach SMS failed (${response.status})`)
    }
    await ctx.runMutation(internal.deliveries.recordSms, {
      deliveryId,
      sent: response.ok,
    })
    return null
  },
})
