import type { Dictionary } from "@/lib/i18n/locale"

/**
 * Storage, and the honest account of why there is no revenue to report.
 *
 * The billing notice is worded as a statement about the system, not about the
 * customers. An empty revenue chart would read as "nobody is paying"; the truth
 * is that nobody has been asked to, because no code anywhere records a plan or a
 * renewal date.
 */
export const STORAGE = {
  totalTitle: { ar: "المخزَّن الكلي", en: "Total stored" },
  totalHint: {
    ar: "مجموع العدّاد المحفوظ على كل مالك.",
    en: "The sum of the counter held on each owner.",
  },

  assetsTitle: { ar: "الأصول", en: "Assets" },
  assetsHint: { ar: "عدد الأصول المسجّلة.", en: "Assets on record." },

  privateAssets: {
    ar: "{n} من {total} أصلاً خاصة: لا تُسلَّم للأوصياء، ولا يفتحها أحد بعد رحيل المالك.",
    en: "{n} of {total} assets are kept private: not handed over to the executors, and nobody can open them after the owner dies.",
  },

  byTypeTitle: { ar: "التخزين حسب النوع", en: "Storage by type" },
  byTypeHint: {
    ar: "محسوب من صفوف الأصول نفسها، تماماً كما يفعل مقياس التخزين في التطبيق.",
    en: "Computed from the asset rows themselves, exactly as the app's own storage meter does.",
  },

  topTitle: { ar: "الأكثر استهلاكاً", en: "Heaviest consumers" },
  topEmpty: { ar: "لا استهلاك مسجَّل بعد", en: "No usage recorded yet" },

  // Carried into the UI rather than hidden in a code comment: an operator
  // reading these numbers has to know they are a floor, not a measurement.
  undercountTitle: {
    ar: "هذا العدّاد ناقص بطبيعته",
    en: "This counter undercounts",
  },
  undercountBody: {
    ar: "عدّاد يُحدَّث يدوياً عند الإضافة والحذف، ولا ينزل تحت الصفر. أنواع بيانات الاعتماد لا تحمل حجماً أصلاً فلم تُحتسب قط. فاعتبره حدّاً أدنى، لا قياساً.",
    en: "A hand-maintained counter, bumped on add and remove and clamped at zero. Credential types carry no size and have never been counted at all. Read it as a floor, not a measurement.",
  },

  // The whole billing story, in one line. It has to stay true as the story
  // changes: there is a catalogue and a staff grant now, and what is still
  // missing is the store. Saying "no plan catalogue" once that existed was the
  // kind of stale copy an operator reads as fact.
  billingShort: {
    ar: "لا متجر موصول: كل خطة مدفوعة هنا مُنحت يدوياً، فالفراغ يعني «لم يُسأل أحد أن يدفع».",
    en: "No store connected: every paid plan here was granted by hand, so empty means nobody has been asked to pay.",
  },

  planLabel: { ar: "الخطة", en: "Plan" },
  planNone: { ar: "بلا خطة", en: "No plan" },
  ownersOnPlan: { ar: "مالك", en: "owners" },
} as const satisfies Dictionary
