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

  unroutedTitle: { ar: "أصول بلا مستلم", en: "Unrouted assets" },
  unroutedHint: {
    ar: "لم يُحدَّد لها مستلم صراحةً — أشيع عطب صامت في المنتج.",
    en: "No recipient set explicitly. The commonest silent failure in the product.",
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

  // The whole billing story, in one line. The long version said the same thing
  // in a paragraph nobody would read twice.
  billingShort: {
    ar: "لا فوترة موصولة: لا شيء يكتب خطة أو تاريخ تجديد، فالفراغ يعني «لم يُسأل أحد أن يدفع».",
    en: "Billing is not wired: nothing writes a plan or a renewal date, so empty means nobody has been asked to pay.",
  },

  billingTitle: { ar: "لا فوترة موصولة", en: "Billing is not wired" },
  billingBody: {
    ar: "لا شيء في هذا النظام يكتب خطة أو تاريخ تجديد: لا مكوّن فوترة، ولا مسار دفع، ولا كتالوج خطط. القاعدة التي تمنع الإضافة عند انتهاء الاشتراك موجودة وسليمة — لكنها لم تعمل ولا مرّة، لأن ما تقرأه لا يُكتب أبداً. الفراغ هنا يعني «لم يُسأل أحد أن يدفع»، لا «لا أحد يدفع».",
    en: "Nothing in this system writes a plan or a renewal date: no billing component, no payment route, no plan catalogue. The rule that pauses adding assets on lapse exists and is correct — but it has never once fired, because the field it reads is never written. Empty here means nobody has been asked to pay, not that nobody is paying.",
  },
  planLabel: { ar: "الخطة", en: "Plan" },
  planNone: { ar: "بلا خطة", en: "No plan" },
  ownersOnPlan: { ar: "مالك", en: "owners" },
} as const satisfies Dictionary
