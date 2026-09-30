import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The death certificate step.
 *
 * Spellings of a name vary far more often than anyone forges a certificate, so
 * a spelling difference goes to a person — and `matchNote` says so *before*
 * they send, not after.
 */
export const CLAIM_CERTIFICATE = {
  intro: {
    ar: "ارفع الشهادة الرسمية. نطابقها بهوية صاحب الخزنة الموثّقة.",
    en: "Upload the official certificate. We check it against the vault owner's verified identity.",
  },
  dropHere: { ar: "اسحب الملف إلى هنا", en: "Drag the file here" },
  dropHint: { ar: "PDF أو صورة · حتى ٢٠ م.ب", en: "PDF or photo · up to 20 MB" },
  pickFile: { ar: "اختر ملفاً", en: "Choose a file" },
  uploaded: { ar: "تم الرفع", en: "Uploaded" },
  replace: { ar: "غيّر الملف", en: "Change the file" },
  tooLarge: {
    ar: "الملف أكبر من ٢٠ م.ب. اختر ملفاً أصغر.",
    en: "The file is bigger than 20 MB. Please choose a smaller one.",
  },
  wrongType: { ar: "نقبل ملف PDF أو صورة فقط.", en: "We accept a PDF or a photo only." },
  uploading: { ar: "جارٍ الرفع…", en: "Uploading…" },

  matchNote: {
    ar: "اختلاف كتابة الاسم وحده لا يُسقط البلاغ — يراجعه شخص من فريقنا.",
    en: "A name spelled differently won't fail the report on its own — a person on our team checks it.",
  },

  submit: { ar: "أرسل للمراجعة", en: "Send for review" },
  submitting: { ar: "جارٍ الإرسال…", en: "Sending…" },
  submitNote: {
    ar: "يمكنك إغلاق الصفحة بعدها — سنراسلك عند كل خطوة.",
    en: "You can close the page afterwards — we'll email you at each step.",
  },
  failed: {
    ar: "لم يُرسل ولم يُحفظ شيء. حاول مرة أخرى.",
    en: "It wasn't sent and nothing was saved. Please try again.",
  },
  uploadAgain: {
    ar: "لم نتمكن من استخدام هذا الملف. ارفعه مرة أخرى.",
    en: "We couldn't use that file. Please upload it again.",
  },
} as const satisfies Dictionary
