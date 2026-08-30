import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.٤ — the page that gets bookmarked.
 *
 * Re-opened weekly for a month, forwarded to relatives, and read by someone
 * who is mostly checking that nothing has gone wrong. Three things here are
 * design decisions written as copy:
 *
 * **`nothingRequired` is stated twice** — once in the lede and once as its own
 * olive card — because the commonest anxiety on a re-visit is that a step was
 * missed, and it is cheaper to answer it before it forms than to field the
 * email.
 *
 * **The owner being notified is step two, at full weight.** Burying it would be
 * the lie by omission: a relative who later learns the owner was warned, and
 * was not told so here, was deceived at the exact moment they were deciding
 * whether to trust us.
 *
 * **The short reference is described as unable to open the report.** It is a
 * lossy hash, and saying so stops someone treating it as a password.
 */
export const CLAIM_STATUS = {
  metaTitle: { ar: "حالة البلاغ · وصيّة", en: "Report status · Wassiya" },

  contact: { ar: "تواصل معنا", en: "Contact us" },
  forVault: {
    ar: "بلاغ خزنة {name}",
    en: "Report for {name}'s vault",
  },

  headingOne: { ar: "بلاغك مقبول،", en: "Your report is accepted," },
  headingTwo: {
    ar: "ومدة الاعتراض تسري.",
    en: "the objection period is running.",
  },
  lede: {
    ar: "لا يُطلب منك شيء الآن. سنراسلك على بريدك عند كل تغيّر، ويمكنك حفظ هذا الرابط والرجوع إليه وقتما شئت.",
    en: "Nothing is required of you now. We'll email you at every change, and you can save this link and come back whenever you like.",
  },

  daysLeft: {
    ar: "يوماً متبقياً في مدة الاعتراض",
    en: "days left in the objection period",
  },
  endsOn: { ar: "تنتهي", en: "Ends" },

  timelineTitle: { ar: "أين وصل البلاغ", en: "Where the report stands" },

  stepReceived: { ar: "استلمنا البلاغ", en: "Report received" },
  stepReceivedMeta: {
    ar: "{date} · تحقّقنا من هويتك ومن الشهادة",
    en: "{date} · your identity and the certificate were verified",
  },
  stepNotified: {
    ar: "أُبلغ صاحب الخزنة",
    en: "The vault's owner was notified",
  },
  stepNotifiedMeta: {
    ar: "{date} · على البريد والجوّال والتطبيق",
    en: "{date} · by email, SMS and in the app",
  },
  stepVeto: { ar: "مدة الاعتراض تسري", en: "Objection period running" },
  stepVetoMeta: {
    ar: "تنتهي {date}. توجد هذه المدة لسبب واحد: إن كان صاحب الخزنة على قيد الحياة، فمن حقه أن يعترض.",
    en: "Ends {date}. This period exists for one reason: if the account holder is alive, they have the right to object.",
  },
  stepGuardian: { ar: "تأكيد الوصي", en: "Guardian confirmation" },
  stepGuardianMeta: {
    ar: "نطلبه بعد انتهاء المدة — لا يحتاج منك شيئاً",
    en: "Requested once the period ends — nothing needed from you",
  },
  stepRelease: { ar: "تسليم صندوقك", en: "Your box is released" },
  stepReleaseMeta: {
    ar: "يُرسل إليك رابط الصندوق على بريدك",
    en: "A link to your box is emailed to you",
  },

  nothingTitle: { ar: "لا شيء مطلوب منك", en: "Nothing is required of you" },
  nothingBody: {
    ar: "لا تحتاج أن تتصل بنا أو ترفع مستنداً آخر أو تفتح هذه الصفحة يومياً. سيصلك بريد عند كل خطوة.",
    en: "You don't need to call us, upload anything else, or check this page daily. An email arrives at each step.",
  },

  saveTitle: { ar: "احفظ هذا الرابط", en: "Save this link" },
  saveEmail: { ar: "أرسله لبريدي", en: "Email it to me" },
  saveCopy: { ar: "انسخ", en: "Copy" },
  saveNote: {
    ar: "الرقم المختصر {ref} للمراسلة فقط — لا يفتح البلاغ.",
    en: "The short reference {ref} is for correspondence only — it can't open the report.",
  },

  othersTitle: { ar: "هل يعرف الآخرون؟", en: "Do other heirs see this?" },
  othersBody: {
    ar: "كل وارث يرى بلاغه وصندوقه فقط. لا نكشف أسماء الورثة الآخرين ولا ما استلموه.",
    en: "Each heir sees only their own report and box. We never reveal the other heirs' names or what they received.",
  },

  // Terminal states.
  releasedHeadingOne: { ar: "صندوقك جاهز.", en: "Your box is ready." },
  releasedHeadingTwo: { ar: "افتحه متى شئت.", en: "Open it whenever you like." },
  releasedBody: {
    ar: "انتهت مدة الاعتراض وأكّد الوصي. يبقى الصندوق متاحاً ٩٠ يوماً — حمّل ما يهمّك قبل ذلك.",
    en: "The objection period ended and the guardian confirmed. The box stays open for 90 days — download what matters before then.",
  },
  openBox: { ar: "افتح صندوقك", en: "Open your box" },
  releasedKeyNote: {
    ar: "ستحتاج نصيب الوصي من المفتاح لفتح الصندوق — سنشرح كيف تطلبه.",
    en: "You'll need the guardian's half of the key to open it — we'll show you how to ask.",
  },

  vetoedHeading: { ar: "أُغلق هذا البلاغ", en: "This report was closed" },
  vetoedBody: {
    ar: "اعترض صاحب الخزنة خلال المدة المتاحة له، ولذلك لن يُسلَّم شيء. هذا ليس خطأً منك — النظام يعمل تماماً كما صُمّم، وقد يكون الخبر الذي وصلك غير دقيق.",
    en: "The vault's owner objected within the period available to them, so nothing will be delivered. This is not a mistake on your part — the system worked exactly as designed, and the news that reached you may simply have been wrong.",
  },
  vetoedLockout: {
    ar: "لا يمكن تقديم بلاغ جديد على هذه الخزنة لمدة ٩٠ يوماً.",
    en: "A new report cannot be filed against this vault for 90 days.",
  },

  notFoundHeading: { ar: "لم نجد هذا البلاغ", en: "We couldn't find this report" },
  notFoundBody: {
    ar: "قد يكون الرابط ناقصاً أو قديماً. افتح الرابط الكامل الذي أرسلناه إلى بريدك — الرقم المختصر وحده لا يفتح البلاغ.",
    en: "The link may be incomplete or old. Open the full link we emailed you — the short reference alone cannot open a report.",
  },
  startOver: { ar: "ابدأ بلاغاً جديداً", en: "Start a new report" },

  loading: { ar: "نقرأ حالة بلاغك…", en: "Reading your report's status…" },
} as const satisfies Dictionary
