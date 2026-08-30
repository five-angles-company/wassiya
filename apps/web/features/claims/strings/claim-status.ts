import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.٤ — the page that gets re-opened weekly for a month.
 *
 * Read by someone who is mostly checking that nothing has gone wrong. Three
 * things here are design decisions written as copy:
 *
 * **`nothingBody` is stated even when a step *is* outstanding** — because the
 * commonest anxiety on a re-visit is that something was missed silently, and it
 * is cheaper to answer that before it forms than to field the email.
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
  timelineTitle: { ar: "أين وصل البلاغ", en: "Where the report stands" },

  daysLeft: {
    ar: "يوماً متبقياً في مدة الاعتراض",
    en: "days left in the objection period",
  },
  endsOn: { ar: "تنتهي", en: "Ends" },

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

  refNote: {
    ar: "الرقم المختصر {ref} للمراسلة فقط — لا يفتح البلاغ.",
    en: "The short reference {ref} is for correspondence only — it can't open the report.",
  },

  othersTitle: { ar: "هل يعرف الآخرون؟", en: "Do other heirs see this?" },
  othersBody: {
    ar: "كل وارث يرى بلاغه وصندوقه فقط. لا نكشف أسماء الورثة الآخرين ولا ما استلموه.",
    en: "Each heir sees only their own report and box. We never reveal the other heirs' names or what they received.",
  },

  // Terminal states.
  releasedHeading: { ar: "صندوقك جاهز", en: "Your box is ready" },
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

  lockedHeading: { ar: "هذه الخزنة موقوفة مؤقتاً", en: "This vault is barred for now" },
  lockedBody: {
    ar: "اعتُرض على بلاغ سابق، ومدة الإيقاف لم تنتهِ بعد. سيُغلق هذا البلاغ دون تسليم.",
    en: "An earlier report was objected to and the barring period has not ended. This report will close without a delivery.",
  },

  loading: { ar: "نقرأ حالة بلاغك…", en: "Reading your report's status…" },
} as const satisfies Dictionary
