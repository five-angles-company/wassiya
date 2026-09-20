import { DELIVERIES } from "@/features/deliveries/strings/deliveries"
import { t, type Locale } from "@/lib/i18n/locale"

export type DeliveryStatus =
  | "awaiting_heir"
  | "identity_pending"
  | "ready"
  | "rejected"
  | "expired"
export type ContactChannel = "sms" | "email" | "call" | "whatsapp" | "visit" | "other"
export type ContactOutcome =
  | "sent"
  | "failed"
  | "reached"
  | "no_answer"
  | "wrong_person"
  | "other"

export const DELIVERY_STATUSES: readonly DeliveryStatus[] = [
  "awaiting_heir",
  "identity_pending",
  "ready",
  "rejected",
  "expired",
]
export const MANUAL_CHANNELS: readonly ContactChannel[] = [
  "call",
  "whatsapp",
  "sms",
  "email",
  "visit",
  "other",
]
export const MANUAL_OUTCOMES: readonly ContactOutcome[] = [
  "reached",
  "no_answer",
  "wrong_person",
  "sent",
  "failed",
  "other",
]

type Labels = ReturnType<typeof t<typeof DELIVERIES>>

const STATUS_KEY: Record<DeliveryStatus, keyof Labels> = {
  awaiting_heir: "statusAwaiting",
  identity_pending: "statusIdentity",
  ready: "statusReady",
  rejected: "statusRejected",
  expired: "statusExpired",
}
const CHANNEL_KEY: Record<ContactChannel, keyof Labels> = {
  sms: "channelSms",
  email: "channelEmail",
  call: "channelCall",
  whatsapp: "channelWhatsapp",
  visit: "channelVisit",
  other: "channelOther",
}
const OUTCOME_KEY: Record<ContactOutcome, keyof Labels> = {
  sent: "outcomeSent",
  failed: "outcomeFailed",
  reached: "outcomeReached",
  no_answer: "outcomeNoAnswer",
  wrong_person: "outcomeWrongPerson",
  other: "outcomeOther",
}

export function statusLabel(status: DeliveryStatus, locale: Locale): string {
  return t(DELIVERIES, locale)[STATUS_KEY[status]]
}
export function channelLabel(channel: ContactChannel, locale: Locale): string {
  return t(DELIVERIES, locale)[CHANNEL_KEY[channel]]
}
export function outcomeLabel(outcome: ContactOutcome, locale: Locale): string {
  return t(DELIVERIES, locale)[OUTCOME_KEY[outcome]]
}

/** Badge tone per status: settled states read quiet, the one needing staff reads loud. */
export function statusVariant(
  status: DeliveryStatus
): "default" | "secondary" | "outline" | "destructive" {
  if (status === "identity_pending") return "default"
  if (status === "ready") return "secondary"
  if (status === "rejected") return "destructive"
  return "outline"
}
