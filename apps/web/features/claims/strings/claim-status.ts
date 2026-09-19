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

  daysLeft: {
    ar: "يوماً متبقياً في مدة الاعتراض",
    en: "days left in the objection period",
  },

  stepReceived: { ar: "استلمنا البلاغ", en: "Report received" },
  // The spine splits what the old timeline collapsed into one step: filing,
  // the identity check and the certificate are three separate things a reader
  // does, and merging them hid whichever one they were actually stuck on.
  stepFiledMeta: { ar: "{date}", en: "{date}" },
  stepIdentity: { ar: "إثبات هويتك", en: "Prove who you are" },
  stepIdentityDoneMeta: {
    ar: "اكتمل التحقّق من هويتك",
    en: "Your identity check is complete",
  },
  stepCertificate: { ar: "شهادة الوفاة", en: "The death certificate" },
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
  stepReview: { ar: "مراجعة الشهادة", en: "Certificate review" },
  stepReviewMeta: {
    ar: "نطابق الاسم في الشهادة باسم صاحب الخزنة الموثّق — لا يحتاج منك شيئاً",
    en: "We match the name on the certificate to the account holder's verified name — nothing needed from you",
  },
  stepRelease: { ar: "التواصل مع الورثة", en: "Heirs contacted" },
  stepReleaseMeta: {
    ar: "نتواصل مباشرةً مع كل وارث سمّاه صاحب الخزنة",
    en: "We contact each heir the account holder named, directly",
  },

  // Where things stand, as one line. Each is a sentence about the report, not a
  // status name — "awaiting_veto" is a column, not something to tell a reader.
  headIdentity: {
    ar: "نحتاج إثبات هويتك قبل أن نُكمل.",
    en: "We need proof of who you are before we can go on.",
  },
  headCertificate: {
    ar: "بقيت شهادة الوفاة، ثم نراجع البلاغ.",
    en: "The death certificate is what's left, then we review the report.",
  },
  headReview: {
    ar: "نراجع شهادة الوفاة.",
    en: "We are reviewing the death certificate.",
  },
  headVeto: {
    ar: "اكتملت المراجعة، ومدة الاعتراض تسري الآن.",
    en: "Review is complete, and the objection period is now running.",
  },
  headReleased: {
    ar: "انتهت مدة الاعتراض، ونتواصل الآن مع الورثة.",
    en: "The objection period has ended, and we are contacting the heirs.",
  },
  releasedBody: {
    ar: "لا يستلم من يبلّغ شيئاً بمجرد البلاغ. كل وارث سمّاه صاحب الخزنة تصله رسالة منّا، ويُثبت هويته ليستلم ما تُرك له. إن كنت أحدهم، ستصلك رسالتك.",
    en: "Filing a report does not receive anything. Each heir the account holder named gets a message from us and proves their identity to receive what was left to them. If you are one of them, your message will reach you.",
  },
  writeOn: { ar: "سنراسلك في {date}.", en: "We'll write to you on {date}." },

  nothingTitle: { ar: "لا شيء مطلوب منك", en: "Nothing is required of you" },
  nothingBody: {
    ar: "لا تحتاج أن تتصل بنا أو ترفع مستنداً آخر أو تفتح هذه الصفحة يومياً. سيصلك بريد عند كل خطوة.",
    en: "You don't need to call us, upload anything else, or check this page daily. An email arrives at each step.",
  },


  othersTitle: { ar: "هل يعرف الآخرون؟", en: "Do other heirs see this?" },
  othersBody: {
    ar: "كل وارث يستلم ما تُرك له وحده. لا نكشف أسماء الورثة الآخرين ولا ما استلموه.",
    en: "Each heir receives only what was left to them. We never reveal the other heirs' names or what they received.",
  },

  // Terminal states.

  vetoedHeading: { ar: "أُغلق هذا البلاغ", en: "This report was closed" },
  vetoedBody: {
    ar: "اعترض صاحب الخزنة خلال المدة المتاحة له، ولذلك لن يُسلَّم شيء. هذا ليس خطأً منك — النظام يعمل تماماً كما صُمّم، وقد يكون الخبر الذي وصلك غير دقيق.",
    en: "The vault's owner objected within the period available to them, so nothing will be delivered. This is not a mistake on your part — the system worked exactly as designed, and the news that reached you may simply have been wrong.",
  },
  vetoedLockout: {
    ar: "لا يمكن تقديم بلاغ جديد على هذه الخزنة لمدة ٩٠ يوماً.",
    en: "A new report cannot be filed against this vault for 90 days.",
  },

  // `closed` is not `locked`: nothing is held against this claimant and there
  // is no waiting period. Saying so is the point — the commonest cause is a
  // mistyped address, and the right next step is to file again.
  closedHeading: {
    ar: "انتهى هذا البلاغ",
    en: "This report has ended",
  },
  closedBody: {
    ar: "لم نجد خزنة مرتبطة بالبريد الذي أدخلته. غالباً ما يكون السبب خطأً في كتابة البريد — تحقّق منه وقدّم بلاغاً جديداً. لا يوجد أي قيد على ذلك.",
    en: "We found no vault for the address you entered. The commonest reason is a typo — check it and file again. There is no restriction on doing so.",
  },
  lockedHeading: { ar: "هذه الخزنة موقوفة مؤقتاً", en: "This vault is barred for now" },
  lockedBody: {
    ar: "اعتُرض على بلاغ سابق، ومدة الإيقاف لم تنتهِ بعد. سيُغلق هذا البلاغ دون تسليم.",
    en: "An earlier report was objected to and the barring period has not ended. This report will close without a delivery.",
  },

} as const satisfies Dictionary
