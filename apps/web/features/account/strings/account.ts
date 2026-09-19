import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The account screen.
 *
 * Short on purpose. There is almost nothing an heir or a reporter can change
 * here — the profile is synced from Clerk, the identity verdict comes from
 * Didit, and the vault is somewhere else entirely. What the screen is actually
 * for is answering *"what does this service know about me?"*, which on a
 * product that asks people for a passport photo in the week of a funeral is a
 * question worth a page rather than a footnote.
 */
export const ACCOUNT = {
  // The feed has no bell any more; this is its door.
  notificationsLink: { ar: "كل الإشعارات", en: "All notifications" },
  title: { ar: "الحساب", en: "Account" },
  body: {
    ar: "ما نعرفه عنك، وما لا نعرفه. تُدار بيانات الدخول من نافذة الحساب في الأعلى.",
    en: "What we know about you, and what we don't. Sign-in details are managed from the account menu at the top.",
  },

  profileTitle: { ar: "بياناتك", en: "Your details" },
  name: { ar: "الاسم", en: "Name" },
  email: { ar: "البريد", en: "Email" },
  notSet: { ar: "غير مُدخل", en: "Not set" },

  identityTitle: { ar: "التحقق من الهوية", en: "Identity verification" },
  identityUnverified: { ar: "لم يتم التحقق", en: "Not verified" },
  identityPending: { ar: "قيد المعالجة", en: "Being processed" },
  identityVerified: { ar: "تم التحقق", en: "Verified" },
  identityRejected: { ar: "لم يكتمل", en: "Did not complete" },
  identityVerifiedName: { ar: "الاسم في الوثيقة", en: "Name on the document" },
  identityVerifiedAt: { ar: "بتاريخ", en: "On" },
  identityAttempts: {
    ar: "{n} محاولة متبقية",
    en: "{n} attempts remaining",
  },
  identityWhy: {
    ar: "نطلب التحقق عند تقديم بلاغ وفاة، ويتحقّق الوارث مرة أخرى قبل أن يُفتح ما تُرك له.",
    en: "We ask for verification when a death report is filed, and an heir verifies again before what was left to them opens.",
  },

  // The line the page exists for.
  weCannotTitle: { ar: "ما لا نستطيع رؤيته", en: "What we cannot see" },
  weCannotBody: {
    ar: "لا نستطيع قراءة محتوى أي خزنة، ولا أسماء ما فيها، ولا فتح صندوق وارث وحدنا. ما نحفظه نصّ مشفّر لا نملك مفتاحه.",
    en: "We cannot read the contents of any vault, or the names of what is in it, or open an heir's box on our own. What we hold is ciphertext we have no key for.",
  },

  languageTitle: { ar: "اللغة", en: "Language" },
  languageBody: {
    ar: "يُحفظ اختيارك في هذا المتصفّح. يمكنك تبديله من أعلى الصفحة في أي وقت.",
    en: "Your choice is kept in this browser. You can switch it from the top of the page at any time.",
  },

  ownerTitle: { ar: "خزنتك أنت", en: "Your own vault" },
  ownerBody: {
    ar: "إن كنت صاحب خزنة، فهي على تطبيق الجوّال. لا تُفتح من المتصفّح ولا نحفظ مفتاحها لدينا.",
    en: "If you own a vault, it lives in the phone app. It can't be opened in a browser and we don't hold its key.",
  },
} as const satisfies Dictionary
