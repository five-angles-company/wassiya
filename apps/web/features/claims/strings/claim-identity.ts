import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.٢ — proving the claimant is who they say.
 *
 * `intro` does the work of not making a grieving
 * relative feel accused at the first gate. `whyNumberBody` explains the one
 * genuinely unusual thing about this check — the code goes to a number the
 * *deceased* registered, not one the claimant types — because an unexplained
 * constraint reads as an obstacle rather than a protection.
 *
 * There is no sign-in copy here any more. The whole app sits behind the wall,
 * so a reader of this panel is already authenticated by construction.
 */
export const CLAIM_IDENTITY = {
  heading: { ar: "من أنت؟", en: "Who are you?" },
  intro: {
    ar: "نتحقق من هويتك أولاً — لا لأننا نشكّ فيك، بل لأن أحداً غيرك قد ينتحل صفتك.",
    en: "We verify your identity first — not because we doubt you, but because someone else might claim to be you.",
  },

  checkDocument: {
    ar: "صورة لهويتك أو جواز سفرك",
    en: "A photo of your ID or passport",
  },
  checkFace: { ar: "صورة حيّة لوجهك", en: "A live photo of your face" },
  checkCode: {
    ar: "رمز يُرسل إلى الرقم الذي سجّله لك المتوفى",
    en: "A code sent to the number the deceased registered for you",
  },

  startVerify: { ar: "ابدأ التحقق", en: "Start verification" },
  starting: { ar: "جارٍ الفتح…", en: "Opening…" },
  popupNote: {
    ar: "يفتح مزوّد التحقق في نافذة آمنة",
    en: "The verification provider opens in a secure window",
  },
  popupBlocked: {
    ar: "منع المتصفح فتح النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع، أو افتح الرابط في تبويب جديد.",
    en: "Your browser blocked the window. Allow pop-ups for this site, or open the link in a new tab.",
  },
  openInTab: { ar: "افتح في تبويب جديد", en: "Open in a new tab" },

  whyNumberTitle: { ar: "لماذا رقم محدّد؟", en: "Why one specific number?" },
  whyNumberBody: {
    ar: "الرمز يُرسل إلى الرقم الذي سجّله المتوفى لك — لا إلى رقم تكتبه أنت. هذا ما يجعل انتحال صفتك صعباً.",
    en: "The code goes to the number the deceased registered for you — not to a number you type in. That is what makes impersonating you hard.",
  },

  // The laptop-webcam failure is discovered *after* the popup opens, so the
  // hand-off stays on screen for as long as a session exists.
  handoffTitle: { ar: "أكمل من هاتفك", en: "Finish on your phone" },
  handoffBody: {
    ar: "افتح هذا الرابط على هاتفك لتصوير هويتك بكاميرا الهاتف.",
    en: "Open this link on your phone to photograph your ID with the phone's camera.",
  },
  copyLink: { ar: "انسخ الرابط", en: "Copy the link" },
  copied: { ar: "نُسخ", en: "Copied" },

  privacyNote: {
    ar: "تُحفظ صورك مشفّرة وتُستخدم للتحقق فقط، ولا تُشارك مع الورثة الآخرين.",
    en: "Your photos are stored encrypted, used only for verification, and never shared with the other heirs.",
  },

  verified: { ar: "تم التحقق من هويتك", en: "Your identity is verified" },
  pending: {
    ar: "بدأتَ التحقق بالفعل. إن أُغلقت النافذة أو لم تُكمل الخطوات، افتحها من جديد — لا تُحسب عليك محاولة.",
    en: "You have already started. If the window closed or you did not finish, open it again — this does not cost you an attempt.",
  },
  // The reader stares at this while nothing moves, so it has to say who is
  // acting and that they need not.
  pendingWait: {
    ar: "إن أكملت الخطوات فالنتيجة تصل إلى هذه الصفحة وحدها — لا حاجة لتحديثها.",
    en: "If you finished the steps, the result lands on this page on its own — no need to refresh.",
  },
  resume: { ar: "افتح نافذة التحقق", en: "Reopen the verification window" },
  rejected: {
    ar: "لم يكتمل التحقق. يمكنك المحاولة مرة أخرى — {n} محاولة متبقية.",
    en: "Verification did not complete. You can try again — {n} attempts left.",
  },
  exhausted: {
    ar: "استُهلكت كل المحاولات. راسلنا وسنراجع الأمر يدوياً.",
    en: "All attempts have been used. Contact us and we will review it by hand.",
  },
  failed: {
    ar: "تعذّر بدء التحقق. حاول مرة أخرى.",
    en: "We could not start verification. Try again.",
  },
} as const satisfies Dictionary
