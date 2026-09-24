import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The death certificate step.
 *
 * Spellings of a name vary far more often than anyone forges a certificate, so
 * a mismatch goes to a person, never to a rejection — and `matchNote` says so
 * *before* they send, not after.
 */
export const CLAIM_CERTIFICATE = {
  intro: {
    ar: "ارفع الشهادة الرسمية. نطابق الاسم فيها بالاسم الموثّق لصاحب الخزنة.",
    en: "Upload the official certificate. We match its name to the vault owner's verified name.",
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

  nameLabel: { ar: "اسم المتوفّى كما في الشهادة", en: "Their name, as on the certificate" },
  nameHint: {
    ar: "اكتبه حرفاً بحرف كما في الشهادة، حتى لو اختلف عن المعتاد",
    en: "Copy it letter by letter from the certificate, even if it's spelled unusually",
  },
  matchNote: {
    ar: "إن اختلفت كتابة الاسم عمّا لدينا، يراجعه شخص من فريقنا — ولا يُرفض البلاغ.",
    en: "If the spelling differs from what we have, a person on our team checks it — the report isn't rejected.",
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
  megabytes: { ar: "م.ب", en: "MB" },
} as const satisfies Dictionary
