import type { Dictionary } from "@/lib/i18n/locale"

/** ٧.٣ — step 2: the death certificate. */
export const CLAIM_CERTIFICATE = {
  heading: { ar: "شهادة الوفاة", en: "Death certificate" },
  intro: {
    ar: "ارفع الشهادة الرسمية. نطابق الاسم مع الهوية التي وثّقها صاحب الحساب عند التسجيل.",
    en: "Upload the official certificate. We match the name against the ID the account holder verified when they registered.",
  },

  dropHere: { ar: "اسحب الملف هنا", en: "Drag the file here" },
  dropHint: { ar: "PDF أو صورة · حتى ٢٠ م.ب", en: "PDF or image · up to 20 MB" },
  pickFile: { ar: "اختر ملفاً", en: "Choose a file" },
  uploaded: { ar: "رُفع", en: "Uploaded" },
  replace: { ar: "غيّر الملف", en: "Change the file" },
  tooLarge: {
    ar: "الملف أكبر من ٢٠ م.ب. اختر ملفاً أصغر.",
    en: "The file is larger than 20 MB. Choose a smaller one.",
  },
  wrongType: {
    ar: "نقبل PDF أو صورة فقط.",
    en: "We accept a PDF or an image only.",
  },
  uploading: { ar: "جارٍ الرفع…", en: "Uploading…" },

  nameLabel: {
    ar: "اسم المتوفى كما في الشهادة",
    en: "The deceased's name as it appears on the certificate",
  },
  nameHint: {
    ar: "انسخه حرفياً من الشهادة، حتى لو اختلف عن نطقه المعتاد",
    en: "Copy it letter for letter from the certificate, even if it differs from the usual spelling",
  },

  submit: { ar: "إرسال للمراجعة", en: "Send for review" },
  submitting: { ar: "جارٍ الإرسال…", en: "Sending…" },
  submitNote: {
    ar: "يمكنك إغلاق الصفحة بعدها — سنرسل لك رابط المتابعة.",
    en: "You can close the page afterwards — we will send you a link to follow it.",
  },
  failed: {
    ar: "تعذّر الإرسال. لم يُحفظ شيء — حاول مرة أخرى.",
    en: "We could not send it. Nothing was saved — try again.",
  },

  // Transliteration varies far more often than anyone forges a certificate, so
  // a mismatch is a review queue, never a rejection. Both languages have to say
  // "not rejected" out loud, because the fear is the same in either.
  megabytes: { ar: "م.ب", en: "MB" },

  matchNote: {
    ar: "إن اختلف رسم الاسم عن المسجّل لدينا، يذهب الطلب إلى مراجعة بشرية — لا يُرفض.",
    en: "If the spelling differs from what we hold, the claim goes to a human reviewer — it is not rejected.",
  },
} as const satisfies Dictionary
