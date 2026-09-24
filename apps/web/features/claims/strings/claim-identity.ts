import type { Dictionary } from "@/lib/i18n/locale"

/**
 * Confirming who the reader is — for the person filing a report and for an
 * heir. `intro` does the work of not making someone feel accused at the first
 * step.
 *
 * ⚠️ Say only what the check really does: a photo of an ID and of a face,
 * taken by the verification partner. Wassiya keeps the result and the verified
 * name, not the images — `privacyReporter`/`privacyHeir` must stay true to
 * `packages/backend/convex/model/didit.ts`.
 */
export const CLAIM_IDENTITY = {
  intro: {
    ar: "نتأكد من هويتك أولاً — لا لأننا نشكّ فيك، بل لنحميك ممن قد يدّعي أنه أنت.",
    en: "We confirm who you are first — not because we doubt you, but to protect you from anyone pretending to be you.",
  },
  checkDocument: { ar: "صورة لهويتك أو جواز سفرك", en: "A photo of your ID or passport" },
  checkFace: { ar: "صورة لوجهك بالكاميرا", en: "A photo of your face, taken with the camera" },

  startVerify: { ar: "ابدأ التحقق", en: "Start the check" },
  starting: { ar: "جارٍ الفتح…", en: "Opening…" },
  popupNote: {
    ar: "يفتح التحقق في نافذة آمنة من شريكنا المختص.",
    en: "The check opens in a secure window run by our verification partner.",
  },
  popupBlocked: {
    ar: "منع المتصفّح فتح النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع، أو افتح الرابط في تبويب جديد.",
    en: "Your browser blocked the window. Allow pop-ups for this site, or open the link in a new tab.",
  },
  openInTab: { ar: "افتح في تبويب جديد", en: "Open in a new tab" },

  // A laptop camera often fails to read an ID, and that is discovered after
  // the window opens — so this stays on screen while a check is in progress.
  handoffTitle: { ar: "أكمل من جوّالك", en: "Finish on your phone" },
  handoffBody: {
    ar: "كاميرا الجوّال تقرأ الهوية أوضح. افتح هذا الرابط على جوّالك لتكمل من هناك.",
    en: "A phone camera reads an ID more clearly. Open this link on your phone to finish there.",
  },
  copyLink: { ar: "انسخ الرابط", en: "Copy the link" },

  privacyReporter: {
    ar: "يلتقط شريكنا صور هويتك ولا نحفظها نحن؛ نحفظ نتيجة التحقق واسمك فقط، ولا نعطيها لأي وارث.",
    en: "Our partner takes the photos of your ID and we don't keep them — we keep only the result and your name, and never share them with any heir.",
  },
  privacyHeir: {
    ar: "يلتقط شريكنا صور هويتك ولا نحفظها نحن؛ نحفظ نتيجة التحقق واسمك فقط، ولا نعطيها لأحد.",
    en: "Our partner takes the photos of your ID and we don't keep them — we keep only the result and your name, and share them with no one.",
  },

  verified: { ar: "تأكدنا من هويتك", en: "We've confirmed who you are" },
  pending: {
    ar: "بدأت التحقق من قبل. إن أُغلقت النافذة أو لم تكمل، افتحها من جديد — لا تُحسب عليك محاولة.",
    en: "You've already started. If the window closed or you didn't finish, open it again — it doesn't use up an attempt.",
  },
  pendingWait: {
    ar: "إن أكملت الخطوات، تظهر النتيجة هنا وحدها — لا حاجة لتحديث الصفحة.",
    en: "If you finished the steps, the result appears here on its own — no need to refresh.",
  },
  resume: { ar: "افتح نافذة التحقق", en: "Reopen the check" },
  rejected: {
    ar: "لم يكتمل التحقق. يمكنك المحاولة مرة أخرى — بقيت {n} محاولات.",
    en: "The check didn't go through. You can try again — {n} attempts left.",
  },
  exhausted: {
    ar: "انتهت كل المحاولات. راسلنا وسنراجع الأمر بأنفسنا.",
    en: "All attempts are used up. Write to us and we'll look at it ourselves.",
  },
  failed: { ar: "لم يبدأ التحقق. حاول مرة أخرى.", en: "The check didn't start. Please try again." },
} as const satisfies Dictionary
