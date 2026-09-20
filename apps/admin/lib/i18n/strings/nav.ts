import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The sidebar's information architecture, in labels.
 *
 * The groups follow the backend's own seams rather than a generic admin
 * template: **Review** is the human-judgement path a claim walks
 * (`claims.adminSetNameMatch`, Didit, deliveries), **Accounts** is the owner's
 * record, **Operations** is what runs without anyone watching (the two crons,
 * escalation email, release), and **Records** is the append-only material.
 *
 * Every item resolves to a route. `app-sidebar.tsx` still renders a
 * placeholder for an item with a `null` href, for the next one added.
 */
export const NAV = {
  groupReview: { ar: "المراجعة", en: "Review" },
  dashboard: { ar: "لوحة التحكم", en: "Dashboard" },
  deliveries: { ar: "التسليمات", en: "Deliveries" },
  claims: { ar: "المطالبات", en: "Claims" },
  unmatched: { ar: "طلبات بلا خزنة", en: "Unmatched" },
  identity: { ar: "التحقق من الهوية", en: "Identity" },

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

  groupSettings: { ar: "الإعدادات", en: "Settings" },
  integrations: { ar: "التكاملات", en: "Integrations" },
  settingsPlans: { ar: "الخطط والحدود", en: "Plans and limits" },
  policy: { ar: "المهل والسياسات", en: "Policy and timing" },

  // Its own group: who may enter the console and what a role carries are two
  // different jobs, and the second is not a setting.
  groupStaff: { ar: "الفريق", en: "Team" },
  staff: { ar: "الأعضاء", en: "Members" },
  roles: { ar: "الأدوار", en: "Roles" },

  groupRecords: { ar: "السجلات", en: "Records" },
  audit: { ar: "سجل التدقيق", en: "Audit log" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
} as const satisfies Dictionary
