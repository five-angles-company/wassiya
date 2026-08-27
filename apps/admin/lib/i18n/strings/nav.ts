import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The sidebar's information architecture, in labels.
 *
 * The groups follow the backend's own seams rather than a generic admin
 * template: **Review** is the human-judgement path a claim walks
 * (`claims.adminSetNameMatch`, Didit, the guardian), **Accounts** is the owner's
 * record, **Operations** is what runs without anyone watching (the two crons,
 * escalation email, release), and **Records** is the append-only material.
 *
 * Only `dashboard` resolves to a route today. Everything else is a placeholder
 * — see `app-sidebar.tsx`.
 */
export const NAV = {
  groupReview: { ar: "المراجعة", en: "Review" },
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  claims: { ar: "المطالبات", en: "Claims" },
  identity: { ar: "التحقق من الهوية", en: "Identity" },
  guardians: { ar: "الأوصياء", en: "Guardians" },

  groupAccounts: { ar: "الحسابات", en: "Accounts" },
  owners: { ar: "المالكون", en: "Owners" },
  heirs: { ar: "الورثة", en: "Heirs" },
  devices: { ar: "الأجهزة", en: "Devices" },
  subscriptions: { ar: "الاشتراكات", en: "Subscriptions" },

  groupOperations: { ar: "التشغيل", en: "Operations" },
  checkins: { ar: "نبض الحياة", en: "Check-ins" },
  releases: { ar: "الإفراج", en: "Releases" },
  email: { ar: "البريد", en: "Email" },
  jobs: { ar: "المهام المجدولة", en: "Scheduled jobs" },

  groupRecords: { ar: "السجلات", en: "Records" },
  audit: { ar: "سجل التدقيق", en: "Audit log" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
} as const satisfies Dictionary
