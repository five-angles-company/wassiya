/**
 * ٨ — الأمان: the recovery ceremony.
 *
 * The steps are not a design choice: the paper share **is** K_rec, and K_rec
 * unwraps MK. Nothing else can.
 *
 * This screen once described two halves and said *"neither is enough alone"*.
 * That is now false in both directions, and it is the most dangerous kind of
 * stale copy — it would tell an owner the sheet is safe to be careless with. One
 * share means the sheet is a bearer token, and these strings say so on the way
 * in and again on the way out.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٨.١ — recovery, owner side. */
export const RECOVERY = {
  title: { ar: "استعادة خزنتك", en: "Recover your vault" },
  // Said first, because someone reaching this screen has usually just lost a
  // phone and is bracing for the worst answer. The good news is now genuinely
  // good: they need nothing but the sheet, and nobody else has to be reached.
  intro: {
    ar: "هذا الجهاز لا يحمل مفتاح خزنتك. وثيقتك المطبوعة وحدها تكفي لاستعادته — لا تحتاج إلى أحد.",
    en: "This device doesn't hold your vault key. Your printed sheet alone is enough to rebuild it — you don't need anyone else.",
  },

  codeLabel: { ar: "رمز الاسترداد", en: "Recovery code" },
  codeHint: {
    ar: "انسخه من الوثيقة التي طبعتها عند تهيئة الخزنة.",
    en: "Copy it from the sheet you printed when you set up your vault.",
  },
  codeInvalid: {
    ar: "هذا الرمز غير صالح. راجع الأحرف — لا نستطيع تصحيحه نيابةً عنك.",
    en: "That code isn't valid. Check the characters — we can't correct it for you.",
  },

  recover: { ar: "استعد خزنتي", en: "Recover my vault" },
  recovering: { ar: "جارٍ الاستعادة…", en: "Recovering…" },
  // The keystore prompt when the rebuilt key is sealed onto this device.
  storePrompt: {
    ar: "أثبت هويتك لحفظ مفتاح الخزنة على هذا الجهاز",
    en: "Confirm it's you to store the vault key on this device",
  },

  // A wrong code, a tampered wrapper and a sheet from an older printing are
  // indistinguishable — `unwrap` throws identically for all three — so the
  // message names every recoverable cause rather than guessing at one.
  failed: {
    ar: "لم يفتح هذا الرمز خزنتك. تأكد من نسخه كاملاً، ومن أنه من أحدث وثيقة طبعتها.",
    en: "That code didn't open your vault. Check it's complete, and that it's from the most recent sheet you printed.",
  },
  noKeyring: {
    ar: "لا توجد خزنة على هذا الحساب بعد.",
    en: "There's no vault on this account yet.",
  },
  // Says what to do rather than what went wrong, and does not pretend the code
  // might still work. Honest about needing the other device, because that is
  // the only thing that helps.
  staleWrapper: {
    ar: "وثيقتك صادرة بنسخة أقدم لم يعد هذا الإصدار يقرأها. افتح وصيّة على جهاز ما يزال يحمل مفتاح خزنتك — سيطلب منك طباعة وثيقة جديدة تعمل في كل مكان.",
    en: "Your sheet was issued by an older version this build can no longer read. Open Wassiya on a device that still holds your vault key — it will ask you to print a new sheet, and that one works everywhere.",
  },

  doneTitle: { ar: "عادت خزنتك", en: "Your vault is back" },
  doneBody: {
    ar: "المفتاح محفوظ على هذا الجهاز خلف بصمتك.",
    en: "The key is stored on this device behind your biometrics.",
  },
  // Stated as a consequence, not a chore. The sheet still works — that is
  // precisely the problem — and only printing a new one ends that.
  reprintUrgent: {
    ar: "الوثيقة التي استخدمتها ما تزال صالحة، ومن يحصل عليها يفتح خزنتك. طباعة وثيقة جديدة هي ما يُبطلها.",
    en: "The sheet you just used still works, and whoever holds it can open your vault. Printing a new one is what voids it.",
  },
  reprint: { ar: "اطبع وثيقة جديدة", en: "Print a new sheet" },
  later: { ar: "لاحقاً", en: "Later" },

  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
} satisfies LabelSet<string>
