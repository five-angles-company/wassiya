import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The heir's way in: the link we sent them, then the one identity check that
 * stands between them and what was left to them. Every state says what
 * happens next, and whether anything is needed from them.
 */
export const DELIVERY = {
  // ---- the link, before anyone is signed in -----------------------------
  receiveTitle: {
    ar: "ترك لك {name} شيئاً",
    en: "{name} left something for you",
  },
  receiveTitleUnknown: {
    ar: "تُرك لك شيء",
    en: "Something was left for you",
  },
  receiveBody: {
    ar: "نأسف لفقدك. قبل أن يُفتح أي شيء نتحقّق من أنك الشخص الذي سمّاه — بحسابك أولاً، ثم بهويتك الرسمية. يستغرق ذلك دقائق.",
    en: "We are sorry for your loss. Before anything opens we check that you are the person they named — first with an account, then with your official ID. It takes a few minutes.",
  },
  receiveSignIn: { ar: "ادخل أو أنشئ حساباً", en: "Sign in or create an account" },
  receiveBinding: { ar: "جارٍ الربط بحسابك…", en: "Linking it to your account…" },
  receiveBindFailed: {
    ar: "تعذّر ربط هذا الإرث بحسابك. إن كان قد استُلم من قبل، تواصل معنا.",
    en: "We couldn't link this to your account. If it has already been received, contact us.",
  },
  receiveMissing: {
    ar: "هذا الرابط غير صالح",
    en: "This link isn't valid",
  },
  receiveMissingBody: {
    ar: "تأكّد أنك فتحت الرابط كاملاً كما وصلك في الرسالة.",
    en: "Check that you opened the whole link, exactly as it arrived in the message.",
  },

  // ---- signed in ---------------------------------------------------------
  identityTitle: { ar: "أثبت هويتك", en: "Prove who you are" },
  identityBody: {
    ar: "نطابق هويتك الرسمية بما سجّله صاحب الخزنة عنك. لا يُفتح شيء قبل ذلك، ولا نحفظ صورة وثيقتك.",
    en: "We match your official ID to what the account holder registered about you. Nothing opens before that, and we do not keep an image of your document.",
  },
  checkingTitle: { ar: "نراجع هويتك", en: "We are checking your identity" },
  checkingBody: {
    ar: "تحقّقت هويتك، ويراجعها أحد فريقنا مقابل ما سجّله صاحب الخزنة. لا شيء مطلوب منك — نراسلك على بريدك حين يجهز.",
    en: "Your identity is verified, and a member of our team is checking it against what the account holder registered. Nothing is needed from you — we will email you when it is ready.",
  },
  rejectedTitle: { ar: "لم نستطع مطابقة هويتك", en: "We couldn't match your identity" },
  rejectedBody: {
    ar: "لم تطابق هويتك الشخص الذي سمّاه صاحب الخزنة. إن كنت ترى أن هذا خطأ، تواصل معنا وسيراجعه أحد فريقنا بنفسه.",
    en: "Your identity did not match the person the account holder named. If you believe that is wrong, contact us and a person will look at it.",
  },
  expiredTitle: { ar: "انتهت مدة هذا الإرث", en: "This delivery has closed" },
  expiredBody: {
    ar: "مرّت سنة على التسليم وأُتلف المفتاح نهائياً، فلا يستطيع أحد فتحه بعد الآن — ولا نحن.",
    en: "A year has passed since release and its key has been destroyed for good, so nobody can open it now — us included.",
  },
  back: { ar: "إلى البداية", en: "Back to the start" },
} as const satisfies Dictionary
