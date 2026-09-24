import { ConvexError } from "convex/values"

import { SUPPORT } from "@/features/support/strings/support"
import { t, type Locale } from "@/lib/i18n/locale"

/** A refusal from the support backend, in words the reader can act on. */
export function supportError(error: unknown, locale: Locale): string {
  const labels = t(SUPPORT, locale)
  if (error instanceof ConvexError) {
    const data = error.data as { code?: string; kind?: string; reason?: string }
    if (data.code === "support") {
      if (data.reason === "recovery_code") return labels.recoveryWarning
      if (data.reason === "guest_details") return labels.refusedGuest
      if (data.reason === "attachment") return labels.refusedAttachment
      if (data.reason === "body_too_long") return labels.refusedTooLong
    }
    // @convex-dev/rate-limiter's refusal.
    if (data.kind === "RateLimited") return labels.rateLimited
  }
  return labels.failed
}

/** The refusal reason from the support backend, if that is what this is. */
export function supportRefusal(error: unknown): string | null {
  if (!(error instanceof ConvexError)) return null
  const data = error.data as { code?: string; reason?: string }
  return data.code === "support" ? (data.reason ?? null) : null
}
