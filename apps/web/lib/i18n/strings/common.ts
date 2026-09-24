import type { Dictionary } from "@/lib/i18n/locale"

/** Words shared by every screen: the shell's controls, boundaries, empty states. */
export const COMMON = {
  needHelp: { ar: "تحتاج مساعدة؟", en: "Need help?" },
  needHelpBody: {
    ar: "راسلنا، ويردّ عليك شخص من فريقنا.",
    en: "Write to us — a person on our team will answer.",
  },

  // What the switch will give you, not what you are looking at.
  themeDark: { ar: "التبديل إلى الوضع الداكن", en: "Switch to dark" },
  themeLight: { ar: "التبديل إلى الوضع الفاتح", en: "Switch to light" },
  language: { ar: "اللغة", en: "Language" },

  stepNow: { ar: "الآن", en: "Now" },
  stepDone: { ar: "تم", en: "Done" },
  // Always this phrase above an Ask, or it stops being a signal.
  askEyebrow: { ar: "مطلوب منك الآن", en: "What we need from you" },
  loading: { ar: "جارٍ التحميل", en: "Loading" },

  newReport: { ar: "بلاغ جديد", en: "New report" },

  // Says what to do, not what went wrong: the reader is often bereaved and in
  // the middle of something, and what this catches is cured by trying again.
  errorTitle: { ar: "لم تُحمَّل هذه الصفحة", en: "This page didn't load" },
  errorBody: {
    ar: "حدث خطأ مؤقت. حاول مرة أخرى — لم يضِع شيء مما أدخلته.",
    en: "Something went wrong for a moment. Try again — nothing you entered has been lost.",
  },
  errorDigest: { ar: "المرجع", en: "Reference" },
  retry: { ar: "حاول مرة أخرى", en: "Try again" },

  routeMissingTitle: { ar: "لا توجد صفحة هنا", en: "There's no page here" },
  routeMissingBody: {
    ar: "ربما كُتب العنوان خطأً. إن كنت تتابع بلاغاً، افتح الرابط الذي أرسلناه إلى بريدك.",
    en: "The address may be mistyped. If you're following a report, open the link we emailed you.",
  },
  backHome: { ar: "العودة إلى الرئيسية", en: "Back to home" },

  notFoundTitle: { ar: "لم نجد هذا", en: "We couldn't find this" },
  notFoundBody: {
    ar: "قد يكون الرابط ناقصاً أو قديماً، أو لا يخصّ حسابك. افتح الرابط كاملاً كما وصلك في رسالتنا.",
    en: "The link may be incomplete, old, or not yours. Open the full link from our message.",
  },

  copy: { ar: "انسخ", en: "Copy" },
  copied: { ar: "تم النسخ", en: "Copied" },
  filedOn: { ar: "قُدّم في", en: "Filed" },
  previous: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },

  // A report's states, named once here (via `lib/claim-status-line.ts`) so a
  // list row and a case page can never drift apart.
  statusSubmitted: { ar: "قيد المراجعة", en: "Being reviewed" },
  statusAwaitingVeto: { ar: "فترة الانتظار", en: "Waiting period" },
  // A state no report enters any more; kept so older rows still render.
  statusGuardianReview: { ar: "قيد المراجعة", en: "Being reviewed" },
  statusReleased: { ar: "جاهز", en: "Ready" },
  statusVetoed: { ar: "أُغلق", en: "Closed" },
  statusLocked: { ar: "موقوف", en: "Paused" },
  // Ended without a decision — today only "no vault matched that email".
  // Deliberately not "Paused": nothing is held against the person who filed.
  statusClosed: { ar: "انتهى", en: "Ended" },
} as const satisfies Dictionary
