import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The account screen. Almost nothing here can be changed — the profile comes
 * from sign-in, the identity result from the verification partner, and the
 * vault lives elsewhere. What it is for is answering "what does this service
 * know about me?".
 *
 * ⚠️ `seeBody` must keep the escrow trade (AGENTS.md): nobody opens a vault
 * while its owner lives, but at release Wassiya opens what was set aside for
 * each heir, to hand it over. Never "we cannot open an heir's box".
 */
export const ACCOUNT = {
  notificationsLink: { ar: "كل الإشعارات", en: "All notifications" },
  notificationsBody: { ar: "كل ما أرسلناه إليك، في مكان واحد.", en: "Everything we've sent you, in one place." },
  title: { ar: "حسابي", en: "My account" },
  body: {
    ar: "ما نعرفه عنك، وما لا نعرفه. بيانات الدخول تجدها في قائمة حسابك أعلى الصفحة.",
    en: "What we know about you, and what we don't. Your sign-in details are in your account menu at the top.",
  },

  profileTitle: { ar: "بياناتك", en: "Your details" },
  name: { ar: "الاسم", en: "Name" },
  email: { ar: "البريد", en: "Email" },
  notSet: { ar: "غير مُدخل", en: "Not set" },

  identityTitle: { ar: "التحقق من هويتك", en: "Your identity check" },
  identityUnverified: { ar: "لم يتم بعد", en: "Not done yet" },
  identityPending: { ar: "قيد المراجعة", en: "Being checked" },
  identityVerified: { ar: "تأكدنا من هويتك", en: "Confirmed" },
  identityRejected: { ar: "لم يكتمل", en: "Didn't go through" },
  identityVerifiedName: { ar: "الاسم في الوثيقة", en: "Name on the document" },
  identityVerifiedAt: { ar: "التاريخ", en: "Date" },
  identityAttempts: { ar: "بقيت {n} محاولات", en: "{n} attempts left" },
  identityWhy: {
    ar: "يتحقق الوارث من هويته قبل أن يستلم ما تُرك له. الإبلاغ عن وفاة لا يحتاج هذا التحقق.",
    en: "An heir confirms who they are before receiving what was left to them. Reporting a death doesn't need this check.",
  },

  seeTitle: { ar: "ما نراه وما لا نراه", en: "What we can and can't see" },
  seeBody: {
    ar: "ما دام صاحب الخزنة حيّاً، لا يفتح خزنته أحد — ولا نحن. بعد التأكد من الوفاة ومن هوية الوارث، نفتح فقط ما خصّصه لذلك الوارث لنسلّمه له. وما لم يُخصّص لأحد لا يُفتح أبداً.",
    en: "While a vault's owner is alive, nobody opens their vault — not even us. After the death and an heir's identity are confirmed, we open only what was set aside for that heir, to hand it over. Anything set aside for no one is never opened.",
  },

  languageTitle: { ar: "اللغة", en: "Language" },
  languageBody: {
    ar: "يُحفظ اختيارك في هذا المتصفّح، ويمكنك تغييره من أعلى الصفحة متى شئت.",
    en: "Your choice is saved in this browser, and you can change it at the top of the page any time.",
  },

  ownerTitle: { ar: "إن كانت لديك خزنة", en: "If you have a vault" },
  ownerBody: {
    ar: "خزنتك على تطبيق الجوّال. لا تُفتح من المتصفّح، ولا نحفظ مفتاحها.",
    en: "It lives in the phone app. It can't be opened in a browser, and we don't hold its key.",
  },
} as const satisfies Dictionary
