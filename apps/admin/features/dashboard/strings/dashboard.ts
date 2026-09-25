import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The dashboard's own chrome, and the "needs a human today" section.
 *
 * Every hint says what the number *means for the operator*, not what the field
 * is called. "٣" alone tells a reviewer nothing; "3 claims that do not move at
 * all until someone rules on the name match" tells them what their morning
 * looks like. Each tile on this page is a queue depth, and a queue depth
 * without its consequence is a vanity metric.
 */
export const DASHBOARD = {
  title: { ar: "لوحة التحكم", en: "Dashboard" },
  subtitle: {
    ar: "ما ينتظر قراراً بشرياً، ومن قد يخسر خزنته، وأين يتوقّف الناس.",
    en: "What is waiting on a human, who would lose their vault, and where people stop.",
  },

  awaitingReview: { ar: "بانتظار المراجعة", en: "Awaiting review" },
  awaitingReviewHint: {
    ar: "مطالبات لا تتقدّم خطوة واحدة قبل أن يبتّ مراجع في تطابق الاسم.",
    en: "Claims that do not move at all until a reviewer rules on the name match.",
  },

  vetoWindow: { ar: "في مهلة الاعتراض", en: "In the veto window" },
  vetoWindowHint: {
    ar: "المالك ما زال قادراً على الاعتراض. بعدها يقع الإفراج تلقائياً.",
    en: "The owner can still object. After that, release is automatic.",
  },
  nextRelease: { ar: "الإفراج التالي", en: "Next release" },
  nextReleaseNone: { ar: "لا شيء مجدول", en: "Nothing scheduled" },

  escalating: { ar: "تصعيد نبض الحياة", en: "Check-ins escalating" },
  escalatingHint: {
    ar: "مالكون تجاوزوا الأسبوع الأول دون تأكيد — نفس الحدّ الذي يعتبره التطبيق «متأخّراً».",
    en: "Owners a week or more past due — the same line the app itself calls overdue.",
  },

  needsSupport: {
    ar: "استنفدوا محاولات الهوية",
    en: "Identity retries exhausted",
  },
  needsSupportHint: {
    ar: "لا يستطيعون المحاولة مرّة أخرى. لا يفتح هذا الطريق إلا شخص.",
    en: "They cannot try again. Only a person can unblock this.",
  },

  heirsNothing: { ar: "ورثة لا يستلمون شيئاً", en: "Heirs who get nothing" },
  heirsNothingHint: {
    ar: "لن يستلموا شيئاً لو وقع الإفراج الليلة.",
    en: "They would receive nothing if a claim released tonight.",
  },

  cappedNote: {
    ar: "الأعداد محسوبة حتى حدٍّ أقصى، فما تجاوزه يظهر بعلامة +.",
    en: "Counts stop at a cap; anything past it shows with a +.",
  },
} as const satisfies Dictionary
