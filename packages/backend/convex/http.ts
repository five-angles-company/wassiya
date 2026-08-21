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

// Didit identity-verification results.
//
// Didit does NOT use Svix, so `new Webhook(...)` above is the wrong tool here:
// this route verifies a raw HMAC-SHA256 over the exact request body with
// `DIDIT_WEBHOOK_SECRET` from the *deployment* env
// (`npx convex env set DIDIT_WEBHOOK_SECRET …`).
//
// In the Didit dashboard point the webhook at
//   https://<your-deployment>.convex.site/didit-webhook
http.route({
  path: "/didit-webhook",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    const secret = process.env.DIDIT_WEBHOOK_SECRET
    if (secret === undefined) {
      console.error("DIDIT_WEBHOOK_SECRET is not set on this deployment")
      return new Response("Not configured", { status: 500 })
    }

    // Read the body exactly once, and HMAC over *this string*. Re-serialising
    // the parsed JSON would change whitespace and key order, and the signature
    // would never verify again.
    const payload = await request.text()
    const signature = request.headers.get("x-signature")
    const timestamp = request.headers.get("x-timestamp")

    if (
      signature === null ||
      !(await verifyDiditSignature(secret, payload, signature))
    ) {
      return new Response("Invalid webhook signature", { status: 401 })
    }
    // Reject stale replays. Didit sends a unix-seconds timestamp.
    if (timestamp !== null) {
      const skewSeconds = Math.abs(Date.now() / 1000 - Number(timestamp))
      if (!Number.isFinite(skewSeconds) || skewSeconds > 300) {
        return new Response("Stale webhook", { status: 401 })
      }
    }

    // Everything below treats the body as `unknown` and narrows field by
    // field. A signature proves the sender, not the shape: an unexpected type
    // reaching the internal mutation would fail Convex's arg validation and
    // surface as a 500, which Didit would then retry forever.
    let event: unknown
    try {
      event = JSON.parse(payload)
    } catch {
      return new Response("Malformed JSON", { status: 400 })
    }
    if (typeof event !== "object" || event === null) {
      return new Response("Malformed body", { status: 400 })
    }

    const body = event as Record<string, unknown>
    const sessionId = body.session_id
    if (typeof sessionId !== "string") {
      return new Response("Missing session_id", { status: 400 })
    }
    const verification = idVerificationOf(body)

    await ctx.runMutation(internal.identity.applyWebhookResult, {
      sessionId,
      vendorData: asString(body.vendor_data),
      status: mapDiditStatus(body.status),
      verifiedName: verifiedNameOf(verification),
      docType: asString(verification.document_type),
    })
    return new Response(null, { status: 200 })
  }),
})

export default http

/** A field is usable only if it really is a string. Anything else is dropped. */
function asString(value: unknown): string | undefined {
  return typeof value === "string" && value !== "" ? value : undefined
}

/**
 * `decision.id_verification`, as a bag of unknowns. Returning an empty object
 * for a missing or malformed branch keeps every caller on one path.
 */
function idVerificationOf(
  body: Record<string, unknown>
): Record<string, unknown> {
  const decision = body.decision
  if (typeof decision !== "object" || decision === null) {
    return {}
  }
  const verification = (decision as Record<string, unknown>).id_verification
  if (typeof verification !== "object" || verification === null) {
    return {}
  }
  return verification as Record<string, unknown>
}

// Didit's terminal statuses, narrowed to the four this app models. Anything
// unrecognised is treated as still pending rather than as an approval.
function mapDiditStatus(
  status: unknown
): "unverified" | "pending" | "verified" | "rejected" {
  switch (status) {
    case "Approved":
    case "approved":
      return "verified"
    case "Declined":
    case "declined":
    case "Expired":
    case "expired":
    case "Abandoned":
    case "abandoned":
      return "rejected"
    default:
      return "pending"
  }
}

/**
 * The verified legal name, which `claims.adminSetNameMatch` later compares a
 * death certificate against — so a wrong value here is load-bearing. Prefer the
 * provider's own `full_name`; fall back to composing the parts.
 */
function verifiedNameOf(
  verification: Record<string, unknown>
): string | undefined {
  const fullName = asString(verification.full_name)
  if (fullName !== undefined) {
    return fullName
  }
  const composed = [
    asString(verification.first_name),
    asString(verification.last_name),
  ]
    .filter((part): part is string => part !== undefined)
    .join(" ")
  return composed === "" ? undefined : composed
}

/**
 * Constant-time HMAC-SHA256 comparison.
 *
 * `crypto.timingSafeEqual` is Node-only and this file runs in Convex's V8
 * runtime, so the comparison is written out by hand: fixed-length, no early
 * return, OR-accumulated difference.
 */
async function verifyDiditSignature(
  secret: string,
  payload: string,
  signature: string
): Promise<boolean> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  )
  const mac = new Uint8Array(
    await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload))
  )
  const expected = hex(mac)
  const received = signature
    .trim()
    .toLowerCase()
    .replace(/^sha256=/, "")

  if (expected.length !== received.length) {
    return false
  }
  let diff = 0
  for (let i = 0; i < expected.length; i++) {
    diff |= expected.charCodeAt(i) ^ received.charCodeAt(i)
  }
  return diff === 0
}

function hex(bytes: Uint8Array): string {
  let out = ""
  for (const byte of bytes) {
    out += byte.toString(16).padStart(2, "0")
  }
  return out
}

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
