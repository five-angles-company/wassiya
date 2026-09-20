import { t, type Locale } from "@/lib/i18n/locale"
import { AUDIT_DOMAIN_LABELS } from "@/lib/i18n/strings/audit-domains"

/**
 * Domains the audit log can be filtered by. Mirrors `AUDIT_DOMAINS` in
 * `convex/admin.ts`, which resolves each to a prefix range rather than a list
 * of events — so adding an event to an existing domain needs no change here.
 */
export const AUDIT_DOMAINS = [
  "asset",
  "billing",
  "checkin",
  "claim",
  "device",
  "email",
  "guardian",
  "heir",
  "identity",
  "keyring",
  "profile",
  "release",
  "routing",
] as const

export type AuditDomain = (typeof AUDIT_DOMAINS)[number]

/**
 * The subset that ever appears as a *notification* kind.
 *
 * Three, not twelve: only the escalation ladder (`checkin.*`), the claim
 * machine (`claim.*`) and a recovery attempt
 * (`recovery.attempted`) insert into `notifications` at all. Mirrors
 * `NOTIFICATION_DOMAINS` in `convex/admin.ts`, which validates against the
 * same three — a facet for a domain nothing can write is a filter that always
 * comes back empty.
 */
export const NOTIFICATION_DOMAINS = ["checkin", "claim", "recovery"] as const

export type NotificationDomain = (typeof NOTIFICATION_DOMAINS)[number]

export function domainLabel(domain: string, locale: Locale): string {
  const labels = t(AUDIT_DOMAIN_LABELS, locale)
  return (labels as Record<string, string>)[domain] ?? domain
}

/** The domain half of a `domain.event` name. */
export function domainOf(event: string): string {
  return event.split(".")[0] ?? event
}
