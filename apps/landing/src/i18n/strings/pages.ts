import type { Dictionary } from "@/i18n/locale"

export const LEGAL = {
  draftBanner: {
    ar: "مسودة قيد المراجعة القانونية — قد يتغيّر هذا النص قبل اعتماده.",
    en: "Draft pending legal review — this text may change before it is approved.",
  },
  updated: { ar: "آخر تحديث: {date}", en: "Last updated: {date}" },
  otherPages: { ar: "صفحات أخرى", en: "Other pages" },
} as const satisfies Dictionary

export const CONSENT = {
  body: {
    ar: "نستخدم أداة من Google لنعرف كيف يصل الناس إلى موقعنا، فقط إذا وافقت. لا علاقة لها بالتطبيق ولا بخزنتك.",
    en: "We use a Google tool to see how people find our website — only if you agree. It has nothing to do with the app or your vault.",
  },
  accept: { ar: "موافق", en: "Accept" },
  decline: { ar: "لا، شكراً", en: "No thanks" },
  more: { ar: "التفاصيل", en: "Details" },
  label: { ar: "إذن التتبّع", en: "Tracking consent" },
} as const satisfies Dictionary

export const NOT_FOUND = {
  title: { ar: "هذه الصفحة غير موجودة", en: "This page does not exist" },
  body: {
    ar: "ربما تغيّر الرابط أو كُتب خطأ. إن وصلك رابط من وصيّة بخصوص إرث، افتحه كما هو من الرسالة.",
    en: "The link may have changed or been mistyped. If Wassiya sent you a link about an inheritance, open it exactly as it appears in the message.",
  },
  home: { ar: "إلى الصفحة الرئيسية", en: "Go to the home page" },
} as const satisfies Dictionary
