/**
 * ٨ — الأمان: the recovery ceremony.
 *
 * ⚠️ **Design-blind**, like ٦ and ٩ — the board's reads all stop inside section
 * ٥. What is known precisely is the screen's identity and job:
 * the stub this replaces recorded it as *"8.1 — recovery on a device with no
 * key"*, ٣.٢'s spec routes "biometrics removed → 8.1", and the ceremony itself
 * is fully specified by AGENTS.md's locked model and `@workspace/crypto`.
 *
 * So the *steps* are not guesswork even though the layout is: paper share plus
 * guardian share rebuild K_rec, and K_rec unwraps MK. Nothing else can.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٨.١ — recovery, owner side. */
export const RECOVERY = {
  title: { ar: "استعادة خزنتك", en: "Recover your vault" },
  // Said first, because someone reaching this screen has usually just lost a
  // phone and is bracing for the worst answer.
  intro: {
    ar: "هذا الجهاز لا يحمل مفتاح خزنتك. يمكنك استعادته بشيئين معاً: وثيقتك المطبوعة، ونصيب الوصي.",
    en: "This device doesn't hold your vault key. You can rebuild it from two things together: your printed sheet, and your guardian's share.",
  },
  bothNeeded: {
    ar: "أيٌّ منهما وحده لا يكفي — وهذا ما يجعل خزنتك آمنة حتى لو فُقد أحدهما.",
    en: "Neither half is enough alone — which is what keeps your vault safe if one of them is lost.",
  },

  step1: { ar: "١ · وثيقتك المطبوعة", en: "1 · Your printed sheet" },
  codeLabel: { ar: "رمز الاسترداد", en: "Recovery code" },
  codeHint: {
    ar: "انسخه من الوثيقة التي طبعتها عند تهيئة الخزنة.",
    en: "Copy it from the sheet you printed when you set up your vault.",
  },
  codeInvalid: {
    ar: "هذا الرمز غير صالح. راجع الأحرف — لا نستطيع تصحيحه نيابةً عنك.",
    en: "That code isn't valid. Check the characters — we can't correct it for you.",
  },

  step2: { ar: "٢ · نصيب الوصي", en: "2 · Your guardian's share" },
  shareLabel: { ar: "نصيب الوصي", en: "Guardian's share" },
  shareHint: {
    ar: "اطلبه من وصيّك. يفتح تطبيقه ويوافق على الاستعادة، ثم يرسل لك النصيب.",
    en: "Ask your guardian for it. They open their app, approve the recovery, and send you the share.",
  },
  sharePlaceholder: {
    ar: "الصق النصيب الذي أرسله الوصي",
    en: "Paste the share your guardian sent",
  },

  recover: { ar: "استعد خزنتي", en: "Recover my vault" },
  recovering: { ar: "جارٍ الاستعادة…", en: "Recovering…" },
  // The keystore prompt when the rebuilt key is sealed onto this device.
  storePrompt: {
    ar: "أثبت هويتك لحفظ مفتاح الخزنة على هذا الجهاز",
    en: "Confirm it's you to store the vault key on this device",
  },

  // A wrong half and a tampered wrapper are indistinguishable — `unwrap` throws
  // identically — so the message names the recoverable cause.
  failed: {
    ar: "لم ينجح هذان النصفان في فتح خزنتك. تأكد من نسخ الرمز كاملاً، ومن أن النصيب من وصيّك الحالي.",
    en: "Those two halves didn't open your vault. Check the code is complete, and that the share is from your current guardian.",
  },
  noKeyring: {
    ar: "لا توجد خزنة على هذا الحساب بعد.",
    en: "There's no vault on this account yet.",
  },

  doneTitle: { ar: "عادت خزنتك", en: "Your vault is back" },
  doneBody: {
    ar: "المفتاح محفوظ على هذا الجهاز خلف بصمتك. وثيقتك القديمة استُخدمت — اطبع وثيقة جديدة الآن.",
    en: "The key is stored on this device behind your biometrics. Your old sheet has been used — print a fresh one now.",
  },
  reprint: { ar: "اطبع وثيقة جديدة", en: "Print a new sheet" },
  later: { ar: "لاحقاً", en: "Later" },

  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
} satisfies LabelSet<string>

/** The guardian's side of the same ceremony. */
export const GUARDIAN_APPROVE = {
  title: { ar: "من أنت وصي عليهم", en: "People you guard" },
  intro: {
    ar: "تحتفظ بنصف مفتاح استرداد لكل شخص هنا. لا ترى محتوى خزنته أبداً.",
    en: "You hold half a recovery key for each person here. You never see their vault's contents.",
  },
  empty: { ar: "لست وصياً على أحد", en: "You aren't a guardian for anyone" },
  relation: { ar: "صلتك: {relation}", en: "Your relation: {relation}" },

  approve: { ar: "وافق على الاستعادة", en: "Approve a recovery" },
  approving: { ar: "جارٍ الفتح…", en: "Opening…" },
  // The biometric that opens their own guardian key.
  prompt: {
    ar: "أثبت هويتك لفتح نصيب الاستعادة",
    en: "Confirm it's you to open the recovery share",
  },

  // The moment that matters: the plaintext exists only on this screen.
  shareTitle: { ar: "نصيب الاستعادة", en: "The recovery share" },
  shareBody: {
    ar: "أرسل هذا إلى صاحب الخزنة بطريقة تثق بها. لا نحتفظ بنسخة منه، ولا نستطيع إرساله نيابةً عنك.",
    en: "Send this to the vault's owner by a channel you trust. We keep no copy of it and cannot send it for you.",
  },
  // The one warning that matters here — this is not a routine share.
  verifyFirst: {
    ar: "تأكّد أولاً أنك تكلّم صاحب الخزنة نفسه. من يحصل على هذا مع الوثيقة المطبوعة يفتح الخزنة.",
    en: "Make sure you're really speaking to the vault's owner. Whoever has this and the printed sheet can open the vault.",
  },
  copy: { ar: "انسخ النصيب", en: "Copy the share" },
  copied: { ar: "نُسخ", en: "Copied" },
  done: { ar: "تم", en: "Done" },
  failed: {
    ar: "تعذّر فتح النصيب على هذا الجهاز.",
    en: "Could not open the share on this device.",
  },
  keyLost: {
    ar: "تغيّرت بصمات هذا الجهاز ولم يعد يستطيع فتح مفتاح الوصاية. على صاحب الخزنة اختيار وصي بديل.",
    en: "This device's biometrics changed and it can no longer open your guardian key. The vault's owner will need to choose a replacement guardian.",
  },
} satisfies LabelSet<string>
