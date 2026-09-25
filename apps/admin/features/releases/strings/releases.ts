import type { Dictionary } from "@/lib/i18n/locale"

/** ٧ — the release pipeline, from the console's side. */
export const RELEASES = {
  pageTitle: { ar: "التسليم", en: "Releases" },

  intro: {
    ar: "ما ينتظر انقضاء مهلة الاعتراض، وما انقضت مهلته وكم من ورثته استلم فعلاً.",
    en: "What is waiting for its objection period, what has passed it, and how many of its heirs have actually received.",
  },

  // The band is a column now, not a panel. Same two words: they label the
  // badge in the row and the facet that filters on it, so an operator reads one
  // vocabulary in both places.
  colBand: { ar: "الحالة", en: "State" },
  bandCounting: { ar: "في المهلة", en: "Counting down" },
  bandReleased: { ar: "أُفرج عنها", en: "Released" },

  colOwner: { ar: "صاحب الخزنة", en: "Vault owner" },
  colClaimant: { ar: "مقدّم الطلب", en: "Claimant" },
  colDeadline: { ar: "نهاية المهلة", en: "Veto ends" },
  colRemaining: { ar: "المتبقي", en: "Remaining" },
  colReleased: { ar: "تاريخ الإفراج", en: "Released" },
  colDelivery: { ar: "التسليم", en: "Delivery" },

  searchPlaceholder: { ar: "ابحث باسم صاحب الخزنة", en: "Search by vault owner" },

  remainingDays: { ar: "{n} يوماً", en: "{n} days" },
  remainingToday: { ar: "أقل من يوم", en: "Under a day" },
  overdueSweep: { ar: "انقضت — بانتظار المهمة", en: "Elapsed — awaiting the job" },

  // A report counting down with no receiving heir is the one genuinely alarming
  // row this screen can show: it will release on schedule and reach nobody.
  receivingNone: { ar: "لا وارث يستلم", en: "No heir receives" },
  receivingCount: { ar: "{n} وريثاً يستلم", en: "{n} heirs receive" },

  deliveryNone: { ar: "لا تسليمات", en: "No deliveries" },
  deliveryNoneHint: {
    ar: "لم يُوجِّه صاحب الخزنة شيئاً لأي وارث، فلا شيء يصل لأحد.",
    en: "The owner routed nothing to any heir, so nothing reaches anyone.",
  },
  deliverySummary: { ar: "{ready} من {total} جاهزة", en: "{ready} of {total} ready" },

  empty: { ar: "لا شيء في مسار التسليم", en: "Nothing in the release pipeline" },
  emptyHint: {
    ar: "لا طلب وفاة في المهلة ولا طلب أُفرج عنه بعد.",
    en: "No death report is counting down, and none has been released yet.",
  },
} as const satisfies Dictionary
