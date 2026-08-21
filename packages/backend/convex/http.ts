import { httpRouter } from "convex/server"
import type { WebhookEvent } from "@clerk/backend"
import { Webhook } from "svix"
import { internal } from "./_generated/api"
import { httpAction } from "./_generated/server"

const http = httpRouter()

// Clerk user sync. In the Clerk dashboard add a webhook endpoint pointing at
//   https://<your-deployment>.convex.site/clerk-users-webhook
// subscribed to user.created / user.updated / user.deleted, then put its
// signing secret on the deployment:
//   npx convex env set CLERK_WEBHOOK_SIGNING_SECRET whsec_…
http.route({
  path: "/clerk-users-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const event = await validateRequest(request)
    if (event === null) {
      return new Response("Invalid webhook signature", { status: 400 })
    }

    switch (event.type) {
      case "user.created":
      case "user.updated":
        await ctx.runMutation(internal.users.upsertFromClerk, {
          data: event.data,
        })
        break
      case "user.deleted": {
        // `id` is optional on the deleted-user payload.
        const clerkUserId = event.data.id
        if (clerkUserId !== undefined) {
          await ctx.runMutation(internal.users.deleteFromClerk, { clerkUserId })
        }
        break
      }
      default:
        console.log("Ignored Clerk webhook event", event.type)
    }

    return new Response(null, { status: 200 })
  }),
})

export default http

// Clerk signs webhooks with Svix. Verifying is what makes this public endpoint
// safe — without it anyone could POST a fake user.created.
async function validateRequest(request: Request): Promise<WebhookEvent | null> {
  const payload = await request.text()
  const headers = {
    "svix-id": request.headers.get("svix-id")!,
    "svix-timestamp": request.headers.get("svix-timestamp")!,
    "svix-signature": request.headers.get("svix-signature")!,
  }

  try {
    const webhook = new Webhook(process.env.CLERK_WEBHOOK_SIGNING_SECRET!)
    return webhook.verify(payload, headers) as unknown as WebhookEvent
  } catch (error) {
    console.error("Error verifying Clerk webhook", error)
    return null
  }
}
