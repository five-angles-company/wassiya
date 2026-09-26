import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The owners-at-risk table.
 *
 * The six item labels are the same six the app shows an owner about
 * themselves (`use-protection-score.ts`). Worded from the operator's side but
 * naming the same fact, so a support conversation and the owner's own screen
 * cannot describe different problems.
 */
export const RISK = {
  tableTitle: { ar: "المالكون، الأسوأ أولاً", en: "Owners, worst first" },
  tableHint: {
    ar: "الترتيب بعدد ما نقص من عناصر الحماية الستة، ثم بعدد الأوصياء الذين لا يحملون ورقة مطبوعة.",
    en: "Ranked by how many of the six protection items are missing, then by executors without a printed sheet.",
  },

  colOwner: { ar: "المالك", en: "Owner" },
  colScore: { ar: "الحماية", en: "Protection" },
  colWorstGap: { ar: "أهم نقص", en: "Worst gap" },
  colMissing: { ar: "النواقص", en: "Missing" },
  colExecutorsWithoutSheet: {
    ar: "أوصياء بلا ورقة",
    en: "Executors without a sheet",
  },

  itemIdentity: { ar: "الهوية", en: "Identity" },
  itemKey: { ar: "المفتاح", en: "Key" },
  itemSheet: { ar: "ورقة الاسترجاع", en: "Recovery sheet" },
  itemExecutors: { ar: "الأوصياء", en: "Executors" },
  itemDelivery: { ar: "التسليم", en: "Delivery" },
  itemCheckin: { ar: "نبض الحياة", en: "Check-in" },

  neverPrinted: { ar: "لم تُطبع الورقة", en: "Sheet never printed" },
  neverPrintedHint: {
    ar: "بلا ورقة، لا طريق للاسترجاع إن فُقد الجهاز.",
    en: "With no sheet there is no recovery path if the device is lost.",
  },

  empty: { ar: "لا خزنة معرّضة", en: "No vault at risk" },
  emptyHint: {
    ar: "كل مالك أكمل عناصر الحماية الستة. هذا هو الوضع المطلوب، لا خلل.",
    en: "Every owner has all six protection items. That is the goal state, not a fault.",
  },

  moreOwners: {
    ar: "قُيّم أول {n} مالك فقط.",
    en: "Only the first {n} owners were evaluated.",
  },
} as const satisfies Dictionary
