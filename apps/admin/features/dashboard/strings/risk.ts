import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The owners-at-risk table.
 *
 * The seven item labels are the same seven the app shows an owner about
 * themselves (`use-protection-score.ts`). Worded from the operator's side —
 * "heirs who get nothing" rather than "route something" — but naming the same fact, so
 * a support conversation and the owner's own screen cannot describe different
 * problems.
 */
export const RISK = {
  tableTitle: { ar: "المالكون، الأسوأ أولاً", en: "Owners, worst first" },
  tableHint: {
    ar: "الترتيب بعدد ما نقص من عناصر الحماية السبعة، ثم بعدد الورثة الذين لن يستلموا شيئاً.",
    en: "Ranked by how many of the seven protection items are missing, then by heirs who would receive nothing.",
  },

  colOwner: { ar: "المالك", en: "Owner" },
  colScore: { ar: "الحماية", en: "Protection" },
  colWorstGap: { ar: "أهم نقص", en: "Worst gap" },
  colMissing: { ar: "النواقص", en: "Missing" },
  colHeirsAtRisk: { ar: "ورثة بلا شيء", en: "Heirs who get nothing" },

  itemIdentity: { ar: "الهوية", en: "Identity" },
  itemKey: { ar: "المفتاح", en: "Key" },
  itemSheet: { ar: "ورقة الاسترجاع", en: "Recovery sheet" },
  itemHeirs: { ar: "الورثة", en: "Heirs" },
  itemRouting: { ar: "التوجيه", en: "Routing" },
  itemDelivery: { ar: "التسليم", en: "Delivery" },
  itemCheckin: { ar: "نبض الحياة", en: "Check-in" },

  neverPrinted: { ar: "لم تُطبع الورقة", en: "Sheet never printed" },
  neverPrintedHint: {
    ar: "بلا ورقة، لا طريق للاسترجاع إن فُقد الجهاز.",
    en: "With no sheet there is no recovery path if the device is lost.",
  },
  heirsNothing: { ar: "ورثة لن يستلموا شيئاً", en: "Heirs who get nothing" },
  heirsNothingHint: {
    ar: "لم يُوجَّه لهم أي أصل ولا رسالة.",
    en: "Nothing is routed to them — no asset and no message.",
  },

  empty: { ar: "لا خزنة معرّضة", en: "No vault at risk" },
  emptyHint: {
    ar: "كل مالك أكمل عناصر الحماية السبعة. هذا هو الوضع المطلوب، لا خلل.",
    en: "Every owner has all seven protection items. That is the goal state, not a fault.",
  },

  moreOwners: {
    ar: "قُيّم أول {n} مالك فقط.",
    en: "Only the first {n} owners were evaluated.",
  },
} as const satisfies Dictionary
