import type { Dictionary } from "@/lib/i18n/locale"

/** ٧ — the release pipeline, from the console's side. */
export const RELEASES = {
  pageTitle: { ar: "التسليم", en: "Releases" },

  // States what the screen is not, because the nav item implies otherwise.
  intro: {
    ar: "ليست قائمة حزم — لم تُبنَ أي حزمة بعد. هذه خطوط الأنابيب: ما ينتظر انقضاء المهلة، وما انقضت مهلته وما الذي يصل الوارث فعلاً.",
    en: "Not a list of bundles — none has ever been built. This is the pipeline: what is waiting for its veto window, what has passed it, and what an heir would actually get.",
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

  // The three delivery states. Two different failures, named separately.
  deliveryDelivered: { ar: "جاهزة", en: "Delivered" },
  deliveryNoBundle: { ar: "لا توجد حزمة", en: "No bundle" },
  deliveryNoHeir: { ar: "لا وارث مرتبط", en: "No heir linked" },
  deliveryNoBundleHint: {
    ar: "الوارث مرتبط، لكن لم تُبنَ له حزمة — لا يستطيع فتح شيء.",
    en: "An heir is linked but nothing was built for them. They can open nothing.",
  },
  deliveryNoHeirHint: {
    ar: "لم يُربط وارث بهذا الطلب، فلا شيء يمكن بناؤه أصلاً.",
    en: "No heir was linked to this claim, so nothing could be built at all.",
  },

  emptyCounting: { ar: "لا طلبات في المهلة", en: "Nothing counting down" },
  emptyReleased: { ar: "لم يُفرج عن أي طلب", en: "Nothing released yet" },
  capped: {
    ar: "تعرض أول {n} فقط.",
    en: "Showing the first {n} only.",
  },
} as const satisfies Dictionary
