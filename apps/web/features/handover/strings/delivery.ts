import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The executor's way in: the link we sent them, then the identity check that
 * stands between them and the handover. Every state says what happens next,
 * and whether anything is needed from them.
 */
export const DELIVERY = {
  // ⚠️ Names nobody: whoever holds the link may not be the executor.
  receiveEyebrow: { ar: "رسالة من وصيّة", en: "A message from Wassiya" },
  receiveTitleUnknown: { ar: "سمّاك شخص وصيّاً", en: "Someone named you as their executor" },
  receiveBody: {
    ar: "وصلك هذا الرابط لأن شخصاً سمّاك وصيّاً على ما تركه لدى وصيّة. لن نذكر اسمه حتى نتأكد أنك الشخص المقصود: سجّل الدخول أو أنشئ حساباً، ثم أثبت هويتك، ثم تفتح ما تركه بورقة الوصي. يأخذ ذلك دقائق.",
    en: "You have this link because someone named you as the executor of what they left with Wassiya. We won't say who until we're sure it's you: sign in or create an account, confirm who you are, then open what they left with the executor sheet. It takes a few minutes.",
  },
  receiveNextTitle: { ar: "الخطوة الأولى", en: "The first step" },
  receiveSignIn: { ar: "سجّل الدخول أو أنشئ حساباً", en: "Sign in or create an account" },
  receiveBinding: { ar: "جارٍ ربطه بحسابك…", en: "Linking it to your account…" },
  receiveBindFailed: {
    ar: "لم نستطع ربطه بحسابك. إن كان قد استُلم من قبل، راسلنا.",
    en: "We couldn't link it to your account. If it was already received, write to us.",
  },
  receiveWarning: {
    ar: "لن نطلب منك مالاً أو كلمة مرور، ولن يطلب منك أحد منّا أن تقرأ له رمز ورقتك أو ترسله. إن شككت في رسالة، اسألنا.",
    en: "We'll never ask you for money or a password, and nobody from Wassiya will ever ask you to read out or send your sheet's code. If a message looks wrong, ask us.",
  },
  receiveMissing: { ar: "هذا الرابط غير صالح", en: "This link isn't valid" },
  receiveMissingBody: {
    ar: "تأكد أنك فتحت الرابط كاملاً كما وصلك في الرسالة.",
    en: "Make sure you opened the whole link, exactly as it arrived in the message.",
  },

  identityTitle: { ar: "أثبت هويتك", en: "Confirm who you are" },
  identityBody: {
    ar: "نطابق هويتك بما سجّله صاحب الخزنة عنك. لا يُفتح شيء قبل ذلك، وبعده تفتحه بورقة الوصي — جهّزها.",
    en: "We match your ID to what the vault's owner registered about you. Nothing opens before that; after it, you open it with the executor sheet — have it ready.",
  },
  checkingTitle: { ar: "نراجع هويتك", en: "We're checking your identity" },
  checkingBody: {
    ar: "تأكدنا من هويتك، ويراجعها الآن شخص من فريقنا مقابل ما سجّله صاحب الخزنة. لا شيء مطلوب منك — نراسلك حين يجهز، فجهّز ورقة الوصي.",
    en: "We've confirmed your ID, and a person on our team is now checking it against what the vault's owner registered. Nothing is needed from you — we'll email you when it's ready, so have the executor sheet at hand.",
  },
  rejectedTitle: { ar: "لم نستطع مطابقة هويتك", en: "We couldn't match your identity" },
  rejectedBody: {
    ar: "لم تطابق هويتك الشخص الذي سمّاه صاحب الخزنة. إن رأيت أن هذا خطأ، راسلنا وسيراجعه شخص من فريقنا.",
    en: "Your ID didn't match the person the vault's owner named. If you think that's wrong, write to us and a person on our team will look at it.",
  },
  expiredTitle: { ar: "انتهت مدة هذا التسليم", en: "This delivery has closed" },
  expiredBody: {
    ar: "مرّت سنة على التسليم وحُذف كل ما فيه نهائياً، فلا يستطيع أحد فتحه بعد الآن — ولا نحن.",
    en: "A year has passed since it was released and everything in it was deleted for good, so nobody can open it now — not even us.",
  },
  back: { ar: "إلى الرئيسية", en: "Back to home" },
} as const satisfies Dictionary
