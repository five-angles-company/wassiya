import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.٢ — step 1: who are you, and whose vault is this.
 *
 * `intro` is the board's own line and does the work of not making a grieving
 * relative feel accused at the first gate. `whyNumberBody` explains the one
 * genuinely unusual thing about this check — the code goes to a number the
 * *deceased* registered, not one the claimant types — because an unexplained
 * constraint reads as an obstacle rather than a protection.
 */
export const CLAIM_IDENTITY = {
  metaTitle: {
    ar: "التحقق من هويتك · وصيّة",
    en: "Verifying your identity · Wassiya",
  },
  step: { ar: "الخطوة ١ من ٣", en: "Step 1 of 3" },
  heading: { ar: "من أنت؟", en: "Who are you?" },
  intro: {
    ar: "نتحقق من هويتك أولاً — لا لأننا نشكّ فيك، بل لأن أحداً غيرك قد ينتحل صفتك.",
    en: "We verify your identity first — not because we doubt you, but because someone else might claim to be you.",
  },

  signInTitle: { ar: "سجّل الدخول أولاً", en: "Sign in first" },
  signInBody: {
    ar: "نحتاج حساباً لنربط الطلب بك، ولنمنع تقديم طلبات متكررة باسمك. مجاناً، ودقيقة واحدة.",
    en: "We need an account to link the claim to you, and to stop repeated claims being filed in your name. Free, and it takes a minute.",
  },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },

  subjectLabel: {
    ar: "بريد صاحب الحساب المتوفى",
    en: "The deceased account holder's email",
  },
  subjectHint: {
    ar: "البريد الذي كان يستخدمه في وصيّة",
    en: "The email they used with Wassiya",
  },
  nameLabel: {
    ar: "اسمك الكامل كما في هويتك",
    en: "Your full name as it appears on your ID",
  },
  contactLabel: { ar: "رقم جوالك", en: "Your mobile number" },
  contactHint: {
    ar: "سنستخدمه للتواصل بشأن الطلب",
    en: "We will use it to contact you about the claim",
  },
  fileClaim: { ar: "تسجيل البلاغ", en: "File the report" },
  filing: { ar: "جارٍ التسجيل…", en: "Filing…" },

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
  continue: {
    ar: "متابعة إلى شهادة الوفاة",
    en: "Continue to the death certificate",
  },
  failed: {
    ar: "تعذّر بدء التحقق. حاول مرة أخرى.",
    en: "We could not start verification. Try again.",
  },
  filed: { ar: "سجّلنا بلاغك", en: "We have recorded your report" },
} as const satisfies Dictionary
