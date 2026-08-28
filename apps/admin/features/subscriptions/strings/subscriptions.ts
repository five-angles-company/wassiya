import type { Dictionary } from "@/lib/i18n/locale"

/** ٱلاشتراكات — accounts, read through the billing lens. */
export const SUBSCRIPTIONS = {
  pageTitle: { ar: "الاشتراكات", en: "Subscriptions" },

  // Says what the screen is. A subscription is a *field on an account*, not a
  // table, so this is the owners list with different columns rather than a
  // separate record — and an operator should know that the same rows appear
  // under Accounts rather than wondering which is authoritative.
  intro: {
    ar: "الاشتراك حقل على الحساب، لا سجلّ مستقل — هذه هي قائمة الحسابات نفسها من زاوية الفوترة.",
    en: "A subscription is a field on an account, not a record of its own. This is the same accounts list, read through the billing lens.",
  },

  colOwner: { ar: "المالك", en: "Owner" },
  colPlan: { ar: "الخطة", en: "Plan" },
  colStorage: { ar: "التخزين", en: "Storage" },
  colRenews: { ar: "التجديد", en: "Renews" },
  colJoined: { ar: "تاريخ التسجيل", en: "Joined" },
  colActions: { ar: "إجراءات", en: "Actions" },

  none: { ar: "—", en: "—" },
  empty: { ar: "لا حسابات", en: "No accounts" },
  emptyHint: {
    ar: "لا توجد حسابات مطابقة لهذه التصفية.",
    en: "No accounts match this filter.",
  },
  openMenu: { ar: "افتح القائمة", en: "Open menu" },
  actionOpenOwner: { ar: "افتح الحساب", en: "Open the account" },
} as const satisfies Dictionary
