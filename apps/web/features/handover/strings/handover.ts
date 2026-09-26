import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The executor's handover: the sheet code in front of it, and what is behind it.
 *
 * ⚠️ Wassiya holds no key (AGENTS.md "Handover"). Nothing here may say Wassiya
 * can open, recover or reset anything. What is true, and said: only the
 * executor's sheet or the owner's recovery sheet opens it, on this device; if
 * both are lost nobody can; and after the window everything is deleted.
 */
export const HANDOVER = {
  gateEyebrow: { ar: "جاهز للفتح", en: "Ready to open" },
  gateTitle: { ar: "افتح ما سُلِّم إليك", en: "Open what was handed over to you" },
  gateBody: {
    ar: "تأكدنا من الوفاة ومن هويتك. ما اختار صاحب الخزنة تسليمه يُفتح بورقة الوصي التي طبعها لك، على جهازك هذا وحده.",
    en: "We've confirmed the death and who you are. What the vault's owner chose to hand over opens with the executor sheet they printed for you, on this device alone.",
  },
  gateBodyRecoveryOnly: {
    ar: "تأكدنا من الوفاة ومن هويتك. لم يطبع صاحب الخزنة ورقة وصيّ لك، فما اختار تسليمه لا يفتحه إلا رمز ورقة استرداده، على جهازك هذا وحده.",
    en: "We've confirmed the death and who you are. The vault's owner didn't print an executor sheet for you, so what they chose to hand over opens only with the code on their own recovery sheet, on this device alone.",
  },

  askTitle: { ar: "أدخل الرمز من ورقة الوصي", en: "Enter the code from your executor sheet" },
  askTitleRecoveryOnly: { ar: "أدخل الرمز من ورقة الاسترداد", en: "Enter the code from the recovery sheet" },
  codeLabel: { ar: "الرمز كما هو مطبوع", en: "The code, as printed" },
  codeHint: {
    ar: "يبدأ رمز ورقة الوصي بـ WSE. وإن كانت معك ورقة استرداد صاحب الخزنة بدلاً منها، فرمزها يبدأ بـ WSY ويفتحه أيضاً. لا تهمّ المسافات ولا الشرطات.",
    en: "The executor sheet's code starts with WSE. If you have the owner's recovery sheet instead, its code starts with WSY and opens it too. Spaces and hyphens don't matter.",
  },
  codeHintExecutorOnly: {
    ar: "يبدأ رمز ورقة الوصي بـ WSE. لا تهمّ المسافات ولا الشرطات.",
    en: "The executor sheet's code starts with WSE. Spaces and hyphens don't matter.",
  },
  codeHintRecoveryOnly: {
    ar: "يبدأ رمز ورقة الاسترداد بـ WSY. لا تهمّ المسافات ولا الشرطات.",
    en: "The recovery sheet's code starts with WSY. Spaces and hyphens don't matter.",
  },
  open: { ar: "افتح", en: "Open" },
  onDevice: {
    ar: "يُفتح على جهازك — لا يُرسل الرمز إلينا ولا يُحفظ",
    en: "Opens on your device — the code is never sent to us or saved",
  },

  failUnreadable: {
    ar: "هذا الرمز ناقص أو فيه حرف مختلف عن الورقة. قارنه بها حرفاً حرفاً.",
    en: "This code is incomplete, or a character differs from the sheet. Compare it with the sheet one character at a time.",
  },
  failExecutorReplaced: {
    ar: "هذه ورقة وصيّ قديمة: طبع لك صاحب الخزنة ورقة أحدث منها، فلم تعد هذه تفتح شيئاً. ابحث عن الورقة الأحدث.",
    en: "This is an older executor sheet: the owner printed a newer one for you, and this one no longer opens anything. Look for the newer sheet.",
  },
  failRecoveryReplaced: {
    ar: "هذه ورقة استرداد قديمة: طبع صاحب الخزنة ورقة أحدث منها، فلم تعد هذه تفتح شيئاً.",
    en: "This is an older recovery sheet: the owner printed a newer one, and this one no longer opens anything.",
  },
  failNoExecutorSheet: {
    ar: "لم يُكمل صاحب الخزنة طباعة ورقة وصيّ لك، فلا تفتحه أي ورقة وصيّ. رمز ورقة استرداده هو ما يفتحه.",
    en: "The owner never finished printing an executor sheet for you, so no executor sheet opens it. The code on their recovery sheet does.",
  },
  failNoRecoverySheet: {
    ar: "ورقة الاسترداد لا تفتح هذا التسليم. استعمل ورقة الوصي التي طبعها لك صاحب الخزنة.",
    en: "The recovery sheet can't open this handover. Use the executor sheet the owner printed for you.",
  },
  failWrongSheet: {
    ar: "الرمز مقروء، لكنه لا يفتح هذا التسليم. تأكّد أنها أحدث ورقة طبعها صاحب هذه الخزنة.",
    en: "The code reads correctly, but it doesn't open this handover. Make sure it's the latest sheet this vault's owner printed.",
  },

  lostTitle: { ar: "لم تجد ورقة الوصي؟", en: "Can't find your executor sheet?" },
  lostTitleRecovery: { ar: "لم تجد ورقة الاسترداد؟", en: "Can't find the recovery sheet?" },
  lostLook: {
    ar: "ابحث عنها مع وصيّة المتوفّى وأوراقه المهمة، فكثيرون يحفظونها معاً.",
    en: "Look with the will and the other important papers of the person who died — many people keep them together.",
  },
  lostFallback: {
    ar: "إن وجدت ورقة استرداده بدلاً منها (يبدأ رمزها بـ WSY)، أدخل رمزها في الخانة نفسها. تفتح ما اختار تسليمه فقط.",
    en: "If you find their recovery sheet instead (its code starts with WSY), type its code in the same field. It opens only what they chose to hand over.",
  },
  lostNone: {
    ar: "إن لم تجد أي ورقة تفتحه، فلا يمكن فتح شيء: لا نملك أي مفتاح، فلا نستطيع فتحه نحن أيضاً.",
    en: "If you can't find any sheet that opens it, nothing can be opened: we hold no key, so we can't open it either.",
  },
  lostHelp: { ar: "اقرأ المزيد في المساعدة", en: "More in help" },

  emptyTitle: { ar: "لم يُسلَّم شيء", en: "Nothing was handed over" },
  emptyBody: {
    ar: "لم يختر صاحب الخزنة تسليم أي شيء، فلا شيء هنا لتفتحه. ما أبقاه خاصاً رحل معه، ولا يستطيع أحد فتحه — ولا نحن.",
    en: "The vault's owner didn't choose to hand anything over, so there's nothing here to open. What they kept private went with them — nobody can open it, not even us.",
  },
  sealedTitle: { ar: "لا يمكن فتح هذا التسليم", en: "This handover can't be opened" },
  sealedBody: {
    ar: "لم يطبع صاحب الخزنة ورقة وصيّ لك، ولا توجد ورقة استرداد تفتحه. لا نملك أي مفتاح، فلا يستطيع أحد فتحه — ولا نحن.",
    en: "The vault's owner didn't print an executor sheet for you, and no recovery sheet opens it. We hold no key, so nobody can open it — not even us.",
  },
  loadFailedTitle: { ar: "لم يُحمَّل التسليم", en: "The handover didn't load" },
  loadFailedBody: {
    ar: "حدث خطأ مؤقت. حاول مرة أخرى بعد قليل.",
    en: "Something went wrong for a moment. Please try again shortly.",
  },

  closesOn: {
    ar: "يبقى متاحاً حتى {date}، ثم يُحذف كل ما فيه نهائياً ولا يستطيع أحد فتحه — ولا نحن. نزّل ما تحتاجه قبل ذلك.",
    en: "It stays available until {date}. Then everything in it is deleted for good and nobody can open it — not even us. Download what you need before then.",
  },

  openTitle: { ar: "ما سُلِّم إليك مفتوح", en: "What was handed over is open" },
  openBody: {
    ar: "هذا كل ما اختار صاحب الخزنة تسليمه. بصفتك وصيّه، أوصل كل شيء كما تنصّ وصيّته — فنحن لا نقسّم التركات.",
    en: "This is everything the vault's owner chose to hand over. As their executor, pass each thing on as their will says — Wassiya doesn't divide estates.",
  },
  openThisPage: {
    ar: "يبقى مفتوحاً في هذه الصفحة فقط. إن أغلقتها، تحتاج الرمز مرة أخرى.",
    en: "It stays open on this page only. If you close it, you'll need the code again.",
  },
  itemCount: { ar: "{n} عنصراً", en: "{n} items" },
} as const satisfies Dictionary
