import type { Dictionary } from "@/lib/i18n/locale"

/**
 * Deliveries — what each heir receives once a report is released. Two jobs
 * live here: sending the link by hand until an SMS provider exists, and the
 * identity decision the owner-registered ID number could not make.
 */
export const DELIVERIES = {
  pageTitle: { ar: "التسليمات", en: "Deliveries" },
  intro: {
    ar: "لكل وارث بُنيت له حزمة تسليم واحد بعد انتهاء مدة الاعتراض. أرسل الرابط إلى رقم الوارث، ثم طابق الهوية حين لا يحسمها رقم الهوية المسجّل.",
    en: "Every heir with a built bundle gets one delivery once the objection period ends. Send the link to the heir's number, then decide identity where the registered ID number could not.",
  },
  tabAwaiting: { ar: "بانتظار الوارث", en: "Awaiting heir" },
  tabIdentity: { ar: "مطابقة الهوية", en: "Identity review" },
  tabReady: { ar: "جاهزة", en: "Ready" },
  tabRejected: { ar: "مرفوضة", en: "Rejected" },
  tabExpired: { ar: "منتهية", en: "Expired" },
  empty: { ar: "لا شيء هنا.", en: "Nothing here." },

  from: { ar: "من خزنة {name}", en: "From {name}'s vault" },
  heirRecord: { ar: "ما سجّله صاحب الخزنة", en: "What the owner registered" },
  boundPerson: { ar: "من ربط التسليم بحسابه", en: "Who bound the delivery" },
  noBound: { ar: "لم يربطه أحد بعد", en: "Nobody has bound it yet" },
  birthDate: { ar: "تاريخ الميلاد", en: "Birth date" },
  verifiedName: { ar: "الاسم الموثّق", en: "Verified name" },
  idNumber: { ar: "رقم الهوية", en: "ID number" },
  idRegistered: { ar: "مسجّل", en: "Registered" },
  idNone: { ar: "غير مسجّل", en: "Not registered" },
  idMatches: { ar: "يطابق الوثيقة", en: "Matches the document" },
  idNoMatch: { ar: "لا يطابق الوثيقة", en: "Does not match the document" },
  notVerified: { ar: "لم يُكمل التحقّق بعد", en: "Has not finished verification" },
  expires: { ar: "ينتهي {date}", en: "Closes {date}" },

  link: { ar: "رابط الوارث", en: "Heir link" },
  noAppUrl: {
    ar: "APP_URL غير مضبوط على النشر، فلا رابط لعرضه.",
    en: "APP_URL is not set on the deployment, so there is no link to show.",
  },
  copy: { ar: "انسخ", en: "Copy" },
  copied: { ar: "نُسخ الرابط.", en: "Link copied." },
  markSent: { ar: "أُرسل", en: "Mark sent" },
  sentOn: { ar: "أُرسل {date}", en: "Sent {date}" },
  approve: { ar: "الشخص نفسه — افتح", en: "Same person — open it" },
  reject: { ar: "ليس الشخص نفسه", en: "Not the same person" },
  approved: { ar: "أصبح التسليم جاهزاً.", en: "The delivery is ready." },
  rejected: { ar: "رُفض التسليم.", en: "The delivery is rejected." },
  failed: {
    ar: "تعذّر تنفيذ الإجراء. لم يتغيّر شيء.",
    en: "That did not go through. Nothing changed.",
  },
} as const satisfies Dictionary
