// Support conversations: who may read a thread, and the one writer of messages.
//
// Rules this file holds up (AGENTS.md "Support"):
//
// - **Support never touches keys.** Nothing under `support/` reads a vault
//   table, and `verify-invariants.mjs` fails the build if one appears. Staff
//   can only act on an account through the permissions they already hold.
// - **Chat is not end-to-end encrypted.** A body that looks like a recovery
//   sheet is refused here as well as in the composer — the sheet is a bearer
//   token and a support channel is the obvious place to phish for it.
// - **A guest is a browser token, not a person.** The name and email a guest
//   types are unverified and never linked to an account; staff see them as
//   typed. Only the token's SHA-256 is stored.
// - **Messages are inserted only by `appendMessage`**, which is what keeps a
//   thread's status, preview and read marks in step with its messages.
import { HOUR, MINUTE, DAY, RateLimiter } from "@convex-dev/rate-limiter"
import { ConvexError, v, type Infer } from "convex/values"

import { components } from "../_generated/api"
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { getCurrentUser } from "../users"

export const MAX_BODY_CHARS = 4000
export const MAX_ATTACHMENTS = 5
export const MAX_ATTACHMENT_BYTES = 10 * 1024 * 1024
export const ATTACHMENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "application/pdf",
] as const
/**
 * An attachment must have been uploaded recently. Storage ids of vault blobs
 * are not secret to an executor who received a delivery, and this — with the type
 * allow-list, which excludes the octet-stream every ciphertext is — stops a
 * thread from being used to mint fresh URLs for someone else's files.
 */
const UPLOAD_FRESH_MS = HOUR
/** Staff replies notify only if still unread this long after sending. */
export const REPLY_NOTIFY_DELAY_MS = 10 * MINUTE
export const FILE_RETENTION_MS = 180 * DAY

const GUEST_TOKEN_MIN = 32
const GUEST_TOKEN_MAX = 128
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const topicValidator = v.union(
  v.literal("account"),
  v.literal("kyc"),
  v.literal("billing"),
  v.literal("recovery"),
  v.literal("claim"),
  v.literal("delivery"),
  v.literal("other")
)
export const surfaceValidator = v.union(v.literal("mobile"), v.literal("web"))
export const localeValidator = v.union(v.literal("ar"), v.literal("en"))
export const statusValidator = v.union(
  v.literal("open"),
  v.literal("waiting"),
  v.literal("resolved")
)
export const attachmentInput = v.object({
  storageId: v.id("_storage"),
  name: v.string(),
})
export type AttachmentInput = Infer<typeof attachmentInput>
export type Attachment = Doc<"supportMessages">["attachments"][number]

export const supportLimits = new RateLimiter(components.rateLimiter, {
  guestStart: { kind: "fixed window", rate: 3, period: HOUR },
  guestStartByEmail: { kind: "fixed window", rate: 5, period: DAY },
  /** Every guest together: a flood from rotating tokens stops here. */
  guestStartGlobal: {
    kind: "token bucket",
    rate: 200,
    period: HOUR,
    capacity: 50,
    shards: 4,
  },
  userStart: { kind: "fixed window", rate: 10, period: DAY },
  send: { kind: "token bucket", rate: 20, period: MINUTE, capacity: 10 },
  upload: { kind: "token bucket", rate: 30, period: HOUR, capacity: 10 },
})

/** The refusals a client has to tell apart. Everything else is a plain Error. */
export type SupportRefusal =
  | "body_empty"
  | "body_too_long"
  | "recovery_code"
  | "attachment"
  | "guest_details"
  | "context"

export function refuse(reason: SupportRefusal): never {
  throw new ConvexError({ code: "support", reason })
}

export type Requester =
  | { kind: "user"; user: Doc<"users"> }
  | { kind: "guest"; keyHash: string }

/**
 * The caller, from the Clerk session or else from a guest token.
 *
 * A session always wins: a signed-in person who still has a guest token in
 * their browser is acting as their account, never as the guest.
 */
export async function requesterOf(
  ctx: QueryCtx,
  guestToken: string | undefined
): Promise<Requester | null> {
  const user = await getCurrentUser(ctx)
  if (user !== null) return { kind: "user", user }
  if (guestToken === undefined) return null
  if (
    guestToken.length < GUEST_TOKEN_MIN ||
    guestToken.length > GUEST_TOKEN_MAX
  ) {
    return null
  }
  return { kind: "guest", keyHash: await sha256Hex(guestToken) }
}

export async function requireRequester(
  ctx: QueryCtx,
  guestToken: string | undefined
): Promise<Requester> {
  const requester = await requesterOf(ctx, guestToken)
  if (requester === null) throw new Error("Not authenticated")
  return requester
}

export function canAccess(
  thread: Doc<"supportThreads">,
  requester: Requester
): boolean {
  if (requester.kind === "user") {
    return thread.requesterUserId === requester.user._id
  }
  return (
    thread.requesterUserId === undefined &&
    thread.guestKeyHash === requester.keyHash
  )
}

/** Load a thread the caller owns, or throw the same "Not found" either way. */
export async function requireOwnThread(
  ctx: QueryCtx,
  threadId: Id<"supportThreads">,
  requester: Requester
): Promise<Doc<"supportThreads">> {
  const thread = await ctx.db.get("supportThreads", threadId)
  if (thread === null || !canAccess(thread, requester)) {
    throw new Error("Not found")
  }
  return thread
}

export function rateKey(requester: Requester): string {
  return requester.kind === "user"
    ? `user:${requester.user._id}`
    : `guest:${requester.keyHash}`
}

export async function sha256Hex(value: string): Promise<string> {
  const digest = new Uint8Array(
    await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value))
  )
  return Array.from(digest, (byte) => byte.toString(16).padStart(2, "0")).join(
    ""
  )
}

export function randomToken(bytes = 32): string {
  const raw = crypto.getRandomValues(new Uint8Array(bytes))
  return Array.from(raw, (byte) => byte.toString(16).padStart(2, "0")).join("")
}

/**
 * A sheet code, pasted or typed — the owner's recovery sheet (`WSY1-`) or an
 * executor's (`WSE1-`) — and fourteen groups of four from the Base32 alphabet.
 *
 * ⚠️ Mirrors `looksLikeRecoveryCode` in `@workspace/crypto/papercode`, which
 * the composers use to warn before sending. The backend does not import that
 * package (`verify-invariants.mjs` forbids it), so the two must change
 * together. Requiring a digit in the run is what keeps ordinary four-letter
 * English words from matching.
 */
const SHEET_PREFIX = /WS[YE][A-Z]?\d+\s*-/i
const SHEET_RUN = /(?:[2-9A-HJ-NP-Z]{4}[\s\-–—]*){8,}/g

export function looksLikeRecoveryCode(text: string): boolean {
  if (SHEET_PREFIX.test(text)) return true
  for (const match of text.toUpperCase().matchAll(SHEET_RUN)) {
    if (/[2-9]/.test(match[0])) return true
  }
  return false
}

export function cleanBody(raw: string, allowEmpty: boolean): string {
  const body = raw.trim()
  if (body.length === 0 && !allowEmpty) refuse("body_empty")
  if (body.length > MAX_BODY_CHARS) refuse("body_too_long")
  if (looksLikeRecoveryCode(body)) refuse("recovery_code")
  return body
}

export function cleanGuest(
  name: string | undefined,
  email: string | undefined
): { name: string; email: string } {
  const cleanName = (name ?? "").trim()
  const cleanEmail = (email ?? "").trim().toLowerCase()
  if (
    cleanName.length === 0 ||
    cleanName.length > 80 ||
    !EMAIL.test(cleanEmail) ||
    cleanEmail.length > 200
  ) {
    refuse("guest_details")
  }
  return { name: cleanName, email: cleanEmail }
}

/** Resolve uploaded files into attachments, refusing anything off-policy. */
export async function resolveAttachments(
  ctx: QueryCtx,
  inputs: AttachmentInput[],
  now: number
): Promise<Attachment[]> {
  if (inputs.length > MAX_ATTACHMENTS) refuse("attachment")
  const out: Attachment[] = []
  for (const input of inputs) {
    const meta = await ctx.db.system.get("_storage", input.storageId)
    if (
      meta === null ||
      meta.contentType === undefined ||
      !(ATTACHMENT_TYPES as readonly string[]).includes(meta.contentType) ||
      meta.size > MAX_ATTACHMENT_BYTES ||
      now - meta._creationTime > UPLOAD_FRESH_MS
    ) {
      refuse("attachment")
    }
    out.push({
      storageId: input.storageId,
      name: input.name.trim().slice(0, 120) || "file",
      contentType: meta.contentType,
      size: meta.size,
    })
  }
  return out
}

/**
 * A claim or delivery named as a thread's context must be the caller's own:
 * the claim they filed, the delivery bound to them. Anything else would let a
 * requester point staff's context panel at a case that is not theirs.
 */
export async function assertOwnContext(
  ctx: QueryCtx,
  requester: Requester,
  context: { claimId?: Id<"claims">; deliveryId?: Id<"deliveries"> }
): Promise<void> {
  if (context.claimId === undefined && context.deliveryId === undefined) return
  if (requester.kind !== "user") refuse("context")
  if (context.claimId !== undefined) {
    const claim = await ctx.db.get("claims", context.claimId)
    if (claim?.claimantUserId !== requester.user._id) refuse("context")
  }
  if (context.deliveryId !== undefined) {
    const delivery = await ctx.db.get("deliveries", context.deliveryId)
    if (delivery?.executorUserId !== requester.user._id) refuse("context")
  }
}

function previewOf(body: string, attachments: Attachment[]): string {
  if (body.length > 0) return body.slice(0, 140)
  return attachments.map((file) => file.name).join(", ").slice(0, 140)
}

/**
 * The only insert into `supportMessages`, and the only thing that moves a
 * thread's status: a requester's message (re)opens it, a staff reply leaves it
 * waiting on the requester. Resolving is an explicit staff act.
 */
export async function appendMessage(
  ctx: MutationCtx,
  thread: Doc<"supportThreads">,
  message: {
    author: "requester" | "staff"
    staffUserId?: Id<"users">
    body: string
    attachments: Attachment[]
    at: number
  }
): Promise<Id<"supportMessages">> {
  const messageId = await ctx.db.insert("supportMessages", {
    threadId: thread._id,
    author: message.author,
    staffUserId: message.staffUserId,
    body: message.body,
    attachments: message.attachments,
    at: message.at,
  })
  const fromRequester = message.author === "requester"
  await ctx.db.patch("supportThreads", thread._id, {
    status: fromRequester ? "open" : "waiting",
    resolvedAt: undefined,
    // A reopened thread's new files must be purgeable again.
    filesPurgedAt: undefined,
    lastMessageAt: message.at,
    lastAuthor: message.author,
    preview: previewOf(message.body, message.attachments),
    requesterUnread: !fromRequester,
    staffUnread: fromRequester,
  })
  return messageId
}

export async function createThread(
  ctx: MutationCtx,
  requester: Requester,
  fields: {
    guest?: { name: string; email: string }
    surface: Doc<"supportThreads">["surface"]
    topic: Doc<"supportThreads">["topic"]
    locale: Doc<"supportThreads">["locale"]
    claimId?: Id<"claims">
    deliveryId?: Id<"deliveries">
    body: string
    attachments: Attachment[]
  },
  now: number
): Promise<Id<"supportThreads">> {
  const who =
    requester.kind === "user"
      ? [requester.user.name, requester.user.email]
      : [fields.guest?.name, fields.guest?.email]
  const threadId = await ctx.db.insert("supportThreads", {
    requesterUserId: requester.kind === "user" ? requester.user._id : undefined,
    guestKeyHash: requester.kind === "guest" ? requester.keyHash : undefined,
    guestName: fields.guest?.name,
    guestEmail: fields.guest?.email,
    surface: fields.surface,
    topic: fields.topic,
    claimId: fields.claimId,
    deliveryId: fields.deliveryId,
    locale: fields.locale,
    status: "open",
    lastMessageAt: now,
    lastAuthor: "requester",
    preview: "",
    requesterUnread: false,
    staffUnread: true,
    searchText: [...who, fields.body.slice(0, 300)]
      .filter((part): part is string => typeof part === "string" && part !== "")
      .join(" "),
  })
  const thread = await ctx.db.get("supportThreads", threadId)
  if (thread === null) throw new Error("Thread vanished")
  await appendMessage(ctx, thread, {
    author: "requester",
    body: fields.body,
    attachments: fields.attachments,
    at: now,
  })
  return threadId
}

export async function withUrls(
  ctx: QueryCtx,
  attachments: Attachment[]
): Promise<(Omit<Attachment, "storageId"> & { url: string | null })[]> {
  return await Promise.all(
    attachments.map(async ({ storageId, ...rest }) => ({
      ...rest,
      url: await ctx.storage.getUrl(storageId),
    }))
  )
}

/** What a requester may see of a thread. No staff identity, no notes. */
export function requesterView(thread: Doc<"supportThreads">) {
  return {
    id: thread._id,
    topic: thread.topic,
    status: thread.status,
    preview: thread.preview,
    lastMessageAt: thread.lastMessageAt,
    lastAuthor: thread.lastAuthor,
    unread: thread.requesterUnread,
    createdAt: thread._creationTime,
    filesPurged: thread.filesPurgedAt !== undefined,
  }
}
