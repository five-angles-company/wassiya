import { ConvexError } from "convex/values"

import { SUPPORT } from "@/features/support/strings/support"
import { t, type Locale } from "@/lib/i18n/locale"

export type ThreadStatus = "open" | "waiting" | "resolved"
export type Topic =
  | "account"
  | "kyc"
  | "billing"
  | "recovery"
  | "claim"
  | "delivery"
  | "other"
export type Audience = "owner" | "executor" | "reporter" | "all"

export function statusLabel(status: ThreadStatus, locale: Locale): string {
  const labels = t(SUPPORT, locale)
  if (status === "open") return labels.statusOpen
  if (status === "waiting") return labels.statusWaiting
  return labels.statusResolved
}

/** Only the thread that owes a reply carries the accent. */
export function statusVariant(
  status: ThreadStatus
): "default" | "secondary" | "outline" {
  if (status === "open") return "default"
  if (status === "waiting") return "secondary"
  return "outline"
}

const TOPIC_KEY = {
  account: "topicAccount",
  kyc: "topicKyc",
  billing: "topicBilling",
  recovery: "topicRecovery",
  claim: "topicClaim",
  delivery: "topicDelivery",
  other: "topicOther",
} as const satisfies Record<Topic, keyof typeof SUPPORT>

export function topicLabel(topic: Topic, locale: Locale): string {
  return t(SUPPORT, locale)[TOPIC_KEY[topic]]
}

const AUDIENCE_KEY = {
  owner: "audienceOwner",
  executor: "audienceExecutor",
  reporter: "audienceReporter",
  all: "audienceAll",
} as const satisfies Record<Audience, keyof typeof SUPPORT>

export const AUDIENCES = Object.keys(AUDIENCE_KEY) as Audience[]

export function audienceLabel(audience: Audience, locale: Locale): string {
  return t(SUPPORT, locale)[AUDIENCE_KEY[audience]]
}

/** A refusal from `model/support.ts`, in words; anything else as its message. */
export function errorMessage(error: unknown, locale: Locale): string {
  const labels = t(SUPPORT, locale)
  if (error instanceof ConvexError) {
    const reason = (error.data as { reason?: string }).reason
    if (reason === "recovery_code") return labels.refusedRecovery
    if (reason === "attachment") return labels.refusedAttachment
    if (reason === "body_too_long") return labels.refusedTooLong
  }
  return error instanceof Error ? error.message : labels.failed
}
