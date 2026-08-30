import type { Dictionary } from "@/lib/i18n/locale"

/** Chrome shared by every screen: the shell, the boundaries, the empty states. */
export const COMMON = {
  brand: { ar: "وصيّة", en: "Wassiya" },

  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "العربية" },
  english: { ar: "English", en: "English" },

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

  loading: { ar: "جارٍ التحميل…", en: "Loading…" },
  copy: { ar: "انسخ", en: "Copy" },
  copied: { ar: "نُسخ", en: "Copied" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  close: { ar: "إغلاق", en: "Close" },
  filedOn: { ar: "قُدّم في", en: "Filed" },
  reference: { ar: "المرجع", en: "Reference" },

  // The six claim states, named once here so a pill, a list row and a detail
  // heading can never drift apart.
  statusSubmitted: { ar: "قيد المراجعة", en: "Under review" },
  statusAwaitingVeto: { ar: "مدة الاعتراض", en: "Objection period" },
  statusGuardianReview: { ar: "بانتظار الوصي", en: "Awaiting the guardian" },
  statusReleased: { ar: "جاهز", en: "Ready" },
  statusVetoed: { ar: "مُغلق", en: "Closed" },
  statusLocked: { ar: "موقوف", en: "Barred" },
} as const satisfies Dictionary
