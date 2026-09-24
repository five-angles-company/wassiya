/**
 * Support attachments and refusals.
 *
 * ⚠️ These uploads are **plaintext**, unlike every other upload in this app:
 * support staff have to be able to read a screenshot. The composer says so, and
 * nothing from the vault may ever be routed through here — `uploadCiphertext`
 * is the vault's path and this is deliberately a different function.
 */
import { ConvexError } from "convex/values"
import { File, UploadType } from "expo-file-system"

export type SupportFile = { uri: string; name: string; mimeType: string }

/** Upload one picked file with its real type; the backend re-checks both. */
export async function uploadSupportFile(
  file: SupportFile,
  uploadUrl: string
): Promise<string> {
  const result = await new File(file.uri).upload(uploadUrl, {
    httpMethod: "POST",
    uploadType: UploadType.BINARY_CONTENT,
    headers: { "Content-Type": file.mimeType },
  })
  if (result.status < 200 || result.status >= 300) {
    throw new Error(`Upload failed with status ${result.status}`)
  }
  const storageId = (JSON.parse(result.body) as { storageId?: unknown })
    .storageId
  if (typeof storageId !== "string") {
    throw new Error("Upload response did not contain a storageId")
  }
  return storageId
}

export type SupportErrorKey =
  | "recoveryWarning"
  | "refusedAttachment"
  | "refusedTooLong"
  | "rateLimited"
  | "failed"

/** Which `support` string explains this error. */
export function supportErrorKey(cause: unknown): SupportErrorKey {
  if (cause instanceof ConvexError) {
    const data = cause.data as { code?: string; kind?: string; reason?: string }
    if (data.code === "support") {
      if (data.reason === "recovery_code") return "recoveryWarning"
      if (data.reason === "attachment") return "refusedAttachment"
      if (data.reason === "body_too_long") return "refusedTooLong"
    }
    if (data.kind === "RateLimited") return "rateLimited"
  }
  return "failed"
}

export const OWNER_TOPICS = [
  "account",
  "kyc",
  "billing",
  "recovery",
  "other",
] as const

export type OwnerTopic = (typeof OWNER_TOPICS)[number]

export const TOPIC_KEY = {
  account: "topicAccount",
  kyc: "topicKyc",
  billing: "topicBilling",
  recovery: "topicRecovery",
  claim: "topicClaim",
  delivery: "topicDelivery",
  other: "topicOther",
} as const

export function isOwnerTopic(value: unknown): value is OwnerTopic {
  return (
    typeof value === "string" &&
    (OWNER_TOPICS as readonly string[]).includes(value)
  )
}
