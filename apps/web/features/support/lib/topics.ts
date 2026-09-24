import { SUPPORT } from "@/features/support/strings/support"
import { t, type Locale } from "@/lib/i18n/locale"

export type Topic =
  | "account"
  | "kyc"
  | "billing"
  | "recovery"
  | "claim"
  | "delivery"
  | "other"

/** What a web reader can ask about. Billing and recovery are owner topics. */
export const WEB_TOPICS: readonly Topic[] = [
  "delivery",
  "claim",
  "account",
  "kyc",
  "other",
]

const KEY = {
  account: "topicAccount",
  kyc: "topicKyc",
  billing: "topicBilling",
  recovery: "topicRecovery",
  claim: "topicClaim",
  delivery: "topicDelivery",
  other: "topicOther",
} as const satisfies Record<Topic, keyof typeof SUPPORT>

export function topicLabel(topic: Topic, locale: Locale): string {
  return t(SUPPORT, locale)[KEY[topic]]
}

export function isTopic(value: string | null): value is Topic {
  return value !== null && value in KEY
}

export function statusLabel(
  status: "open" | "waiting" | "resolved",
  locale: Locale
): string {
  const labels = t(SUPPORT, locale)
  if (status === "open") return labels.statusOpen
  if (status === "waiting") return labels.statusWaiting
  return labels.statusResolved
}
