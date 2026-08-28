import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The domain an event belongs to, taken from the prefix of its name.
 *
 * Shared because both Records screens facet on it — the audit log and the
 * notification log use the same `domain.event` naming, so one vocabulary
 * covers both. The individual events are never translated: they are shown raw
 * so an operator comparing the console against the deployment reads the same
 * string in both places.
 */
export const AUDIT_DOMAIN_LABELS = {
  asset: { ar: "الأصول", en: "Assets" },
  checkin: { ar: "التحقق من الحياة", en: "Check-in" },
  claim: { ar: "طلبات الوراثة", en: "Claims" },
  device: { ar: "الأجهزة", en: "Devices" },
  email: { ar: "البريد", en: "Email" },
  guardian: { ar: "الأوصياء", en: "Guardians" },
  heir: { ar: "الورثة", en: "Heirs" },
  identity: { ar: "الهوية", en: "Identity" },
  keyring: { ar: "المفاتيح", en: "Keyring" },
  profile: { ar: "الملف الشخصي", en: "Profile" },
  release: { ar: "التسليم", en: "Release" },
  routing: { ar: "التوجيه", en: "Routing" },
  recovery: { ar: "الاسترداد", en: "Recovery" },
} as const satisfies Dictionary
