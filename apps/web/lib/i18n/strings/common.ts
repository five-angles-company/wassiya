import type { Dictionary } from "@/lib/i18n/locale"

/** Chrome shared by every screen: the shell, the boundaries, the empty states. */
export const COMMON = {
  // What the switch will give you, not what you are looking at — the control
  // says where it goes.
  themeDark: { ar: "التبديل إلى الوضع الداكن", en: "Switch to dark" },
  themeLight: { ar: "التبديل إلى الوضع الفاتح", en: "Switch to light" },

  // The record's vocabulary, shared because the heir's report and the
  // guardian's duty are the same ceremony read from two sides — and the one
  // thing worse than a shared primitive is the same three words spelled twice.
  stepNow: { ar: "جارٍ", en: "In progress" },
  stepDone: { ar: "تم", en: "Done" },
  askEyebrow: { ar: "مطلوب منك الآن", en: "Asked of you now" },


  // Filing is the one action in this app that is not part of a case — it is
  // what *creates* one — so it belongs to no feature and lives here. It was
  // previously in `features/overview`, which is how it came to be deleted with
  // the home screen while three other screens still needed it.
  fileReportPrompt: { ar: "فقدت شخصاً عزيزاً؟", en: "Have you lost someone?" },
  fileReportLink: { ar: "أبلغ عن وفاة", en: "Report a death" },
  newReport: { ar: "بلاغ جديد", en: "New report" },

  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "العربية" },

  // The error boundary. Says what to do, not what went wrong — the reader is
  // usually bereaved and mid-claim, and every case this actually catches is
  // cured by trying again.
  errorTitle: {
    ar: "تعذّر تحميل هذه الصفحة",
    en: "This page did not load",
  },
  errorBody: {
    ar: "انقطع الاتصال بالخادم أو رُفض الطلب. أعد المحاولة — لم يُفقد شيء مما أدخلته سابقاً.",
    en: "The request to the server failed or was refused. Try again — nothing you entered earlier has been lost.",
  },
  errorDigest: { ar: "المرجع", en: "Reference" },
  retry: { ar: "أعد المحاولة", en: "Try again" },

  routeMissingTitle: { ar: "لا توجد صفحة هنا", en: "No page here" },
  routeMissingBody: {
    ar: "هذا العنوان لا يقابل أي صفحة. إن كنت تتابع بلاغاً، افتح الرابط الذي أرسلناه إلى بريدك.",
    en: "This address does not match any page. If you are following a report, open the link we emailed you.",
  },
  backHome: { ar: "العودة إلى البداية", en: "Back to the start" },

  // A detail route whose record is not there. Reachable from a mistyped URL, a
  // bookmark, or an emailed link a mail client truncated — none of them exotic.
  notFoundTitle: { ar: "لم نجد هذا", en: "We could not find this" },
  notFoundBody: {
    ar: "قد يكون الرابط ناقصاً أو قديماً، أو لا يخصّ حسابك. افتح الرابط الكامل الذي أرسلناه إلى بريدك.",
    en: "The link may be incomplete, old, or not yours. Open the full link we emailed you.",
  },

  copy: { ar: "انسخ", en: "Copy" },
  copied: { ar: "نُسخ", en: "Copied" },
  filedOn: { ar: "قُدّم في", en: "Filed" },

  // Table paging. `range` counts rows on screen, not a total: a cursor knows
  // where it is, never how many follow.
  previous: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },
  range: { ar: "{from}–{to}", en: "{from}–{to}" },

  // The six claim states, named once here so a pill, a list row and a detail
  // heading can never drift apart.
  statusSubmitted: { ar: "قيد المراجعة", en: "Under review" },
  statusAwaitingVeto: { ar: "مدة الاعتراض", en: "Objection period" },
  statusGuardianReview: { ar: "بانتظار الوصي", en: "Awaiting the guardian" },
  statusReleased: { ar: "جاهز", en: "Ready" },
  statusVetoed: { ar: "مُغلق", en: "Closed" },
  statusLocked: { ar: "موقوف", en: "Barred" },
  // Ended without a verdict — today only "no vault matched that address".
  // Deliberately *not* "Barred": nothing is held against this claimant and
  // filing again with the right address is exactly what they should do.
  statusClosed: { ar: "مُنتهٍ", en: "Ended" },
} as const satisfies Dictionary
