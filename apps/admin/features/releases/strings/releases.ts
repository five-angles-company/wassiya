import type { Dictionary } from "@/lib/i18n/locale"

/** ٧ — the release pipeline, from the console's side. */
export const RELEASES = {
  pageTitle: { ar: "التسليم", en: "Releases" },

  intro: {
    ar: "ما ينتظر انقضاء مهلة الاعتراض، وما انقضت مهلته وكم من ورثته استلم فعلاً.",
    en: "What is waiting for its objection period, what has passed it, and how many of its heirs have actually received.",
  },

  bandCounting: { ar: "في المهلة", en: "Counting down" },
  bandReleased: { ar: "أُفرج عنها", en: "Released" },

  colOwner: { ar: "صاحب الخزنة", en: "Vault owner" },
  colClaimant: { ar: "مقدّم الطلب", en: "Claimant" },
  colDeadline: { ar: "نهاية المهلة", en: "Veto ends" },
  colRemaining: { ar: "المتبقي", en: "Remaining" },
  colReleased: { ar: "تاريخ الإفراج", en: "Released" },
  colDelivery: { ar: "التسليم", en: "Delivery" },

  remainingDays: { ar: "{n} يوماً", en: "{n} days" },
  remainingToday: { ar: "أقل من يوم", en: "Under a day" },
  overdueSweep: { ar: "انقضت — بانتظار المهمة", en: "Elapsed — awaiting the job" },

  deliveryNone: { ar: "لا تسليمات", en: "No deliveries" },
  deliveryNoneHint: {
    ar: "لم يبنِ جهاز صاحب الخزنة أي حزمة، فلا شيء يصل لأي وارث.",
    en: "The owner's device never built a bundle, so nothing reaches any heir.",
  },
  deliverySummary: { ar: "{ready} من {total} جاهزة", en: "{ready} of {total} ready" },

  emptyCounting: { ar: "لا طلبات في المهلة", en: "Nothing counting down" },
  emptyReleased: { ar: "لم يُفرج عن أي طلب", en: "Nothing released yet" },
  capped: {
    ar: "تعرض أول {n} فقط.",
    en: "Showing the first {n} only.",
  },
} as const satisfies Dictionary
