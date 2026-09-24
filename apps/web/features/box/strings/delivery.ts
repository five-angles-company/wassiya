import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The heir's way in: the link we sent them, then the identity check that stands
 * between them and what was left to them. Every state says what happens next,
 * and whether anything is needed from them.
 */
export const DELIVERY = {
  // ⚠️ Names nobody: whoever holds the link may not be the heir.
  receiveEyebrow: { ar: "رسالة من وصيّة", en: "A message from Wassiya" },
  receiveTitleUnknown: { ar: "تُرك لك شيء", en: "Something was left for you" },
  receiveBody: {
    ar: "وصلك هذا الرابط لأن شخصاً سمّاك لتستلم شيئاً تركه لك. لن نذكر اسمه حتى نتأكد أنك الشخص المقصود: سجّل الدخول أو أنشئ حساباً، ثم أثبت هويتك. يأخذ ذلك دقائق.",
    en: "You have this link because someone named you to receive something they left. We won't say who until we're sure it's you: sign in or create an account, then confirm who you are. It takes a few minutes.",
  },
  receiveNextTitle: { ar: "الخطوة الأولى", en: "The first step" },
  receiveSignIn: { ar: "سجّل الدخول أو أنشئ حساباً", en: "Sign in or create an account" },
  receiveBinding: { ar: "جارٍ ربطه بحسابك…", en: "Linking it to your account…" },
  receiveBindFailed: {
    ar: "لم نستطع ربطه بحسابك. إن كان قد استُلم من قبل، راسلنا.",
    en: "We couldn't link it to your account. If it was already received, write to us.",
  },
  receiveWarning: {
    ar: "لن نطلب منك مالاً أو كلمة مرور، ولن نتصل بك لنطلبها. إن شككت في رسالة، اسألنا.",
    en: "We'll never ask you for money or a password, and we'll never call to ask for them. If a message looks wrong, ask us.",
  },
  receiveMissing: { ar: "هذا الرابط غير صالح", en: "This link isn't valid" },
  receiveMissingBody: {
    ar: "تأكد أنك فتحت الرابط كاملاً كما وصلك في الرسالة.",
    en: "Make sure you opened the whole link, exactly as it arrived in the message.",
  },

  identityTitle: { ar: "أثبت هويتك", en: "Confirm who you are" },
  identityBody: {
    ar: "نطابق هويتك بما سجّله صاحب الخزنة عنك. لا يُفتح شيء قبل ذلك.",
    en: "We match your ID to what the vault's owner registered about you. Nothing opens before that.",
  },
  checkingTitle: { ar: "نراجع هويتك", en: "We're checking your identity" },
  checkingBody: {
    ar: "تأكدنا من هويتك، ويراجعها الآن شخص من فريقنا مقابل ما سجّله صاحب الخزنة. لا شيء مطلوب منك — نراسلك حين يجهز.",
    en: "We've confirmed your ID, and a person on our team is now checking it against what the vault's owner registered. Nothing is needed from you — we'll email you when it's ready.",
  },
  rejectedTitle: { ar: "لم نستطع مطابقة هويتك", en: "We couldn't match your identity" },
  rejectedBody: {
    ar: "لم تطابق هويتك الشخص الذي سمّاه صاحب الخزنة. إن رأيت أن هذا خطأ، راسلنا وسيراجعه شخص من فريقنا.",
    en: "Your ID didn't match the person the vault's owner named. If you think that's wrong, write to us and a person on our team will look at it.",
  },
  expiredTitle: { ar: "انتهت مدة هذا التسليم", en: "This delivery has closed" },
  expiredBody: {
    ar: "مرّت سنة على التسليم وحُذف مفتاحه نهائياً، فلا يستطيع أحد فتحه بعد الآن — ولا نحن.",
    en: "A year has passed since it was released and its key was deleted for good, so nobody can open it now — not even us.",
  },
  back: { ar: "إلى الرئيسية", en: "Back to home" },
} as const satisfies Dictionary
