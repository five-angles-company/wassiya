import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The case page, re-opened weekly for a month by someone checking that nothing
 * has gone wrong.
 *
 * - `nothingBody` is said even when a step *is* outstanding: the commonest worry
 *   on a return visit is that something was missed silently.
 * - The owner being told is a step at full weight. A relative who later learns
 *   the owner was warned, and was not told so here, was misled.
 * - `vetoedLockout`'s 90 days is `VETO_LOCKOUT_DAYS` in
 *   `packages/backend/convex/model/claimFlow.ts` — change both or neither.
 */
export const CLAIM_STATUS = {
  stepReceived: { ar: "استلمنا البلاغ", en: "Report received" },
  stepIdentity: { ar: "إثبات هويتك", en: "Confirm who you are" },
  stepCertificate: { ar: "شهادة الوفاة", en: "The death certificate" },
  stepNotified: { ar: "أبلغنا صاحب الخزنة", en: "We told the vault's owner" },
  stepReview: { ar: "مراجعة الشهادة", en: "We check the certificate" },
  stepVeto: { ar: "فترة الانتظار", en: "The waiting period" },
  stepRelease: { ar: "نتواصل مع الورثة", en: "We contact the heirs" },
  timelineTitle: { ar: "مسار البلاغ", en: "Where the report is" },

  // One sentence about the report — never a status name.
  headIdentity: {
    ar: "نحتاج أن نتأكد من هويتك قبل أن نكمل.",
    en: "We need to confirm who you are before we go on.",
  },
  headCertificate: {
    ar: "بقيت شهادة الوفاة، ثم نراجع البلاغ.",
    en: "Only the death certificate is left, then we check the report.",
  },
  headReview: { ar: "نراجع شهادة الوفاة الآن.", en: "We're checking the death certificate." },
  headVeto: {
    ar: "انتهت المراجعة، وبدأت فترة الانتظار.",
    en: "The check is done, and the waiting period has started.",
  },
  vetoWhy: {
    ar: "هذه الفترة لسبب واحد: إن كان صاحب الخزنة حيّاً، فمن حقه أن يوقف البلاغ.",
    en: "It exists for one reason: if the vault's owner is alive, they can stop the report.",
  },
  vetoEnds: { ar: "تنتهي في", en: "Ends on" },
  headReleased: {
    ar: "انتهت فترة الانتظار، ونتواصل الآن مع الورثة.",
    en: "The waiting period is over, and we're contacting the heirs.",
  },
  releasedBody: {
    ar: "تقديم البلاغ لا يمنح صاحبه شيئاً. كل وارث سمّاه صاحب الخزنة تصله رسالة منّا، ويثبت هويته ليستلم ما خُصّص له. إن كنت أحدهم، ستصلك رسالتك.",
    en: "Filing a report doesn't give anything to the person who filed it. Each heir the owner named gets a message from us and confirms who they are to receive what was set aside for them. If you're one of them, your message will reach you.",
  },
  writeOn: { ar: "سنراسلك في {date}.", en: "We'll write to you on {date}." },
  nothingBody: {
    ar: "لا تحتاج أن تتصل بنا أو ترفع شيئاً آخر أو تفتح هذه الصفحة يومياً. ستصلك رسالة عند كل خطوة.",
    en: "You don't need to call us, upload anything else, or check this page daily. We'll email you at each step.",
  },

  // Endings.
  vetoedHeading: { ar: "أُغلق هذا البلاغ", en: "This report was closed" },
  vetoedBody: {
    ar: "أوقف صاحب الخزنة البلاغ خلال فترة الانتظار، فلن يُسلَّم شيء. هذا ليس خطأً منك — ربما كان الخبر الذي وصلك غير دقيق.",
    en: "The vault's owner stopped the report during the waiting period, so nothing will be delivered. This isn't your mistake — the news that reached you may simply have been wrong.",
  },
  vetoedLockout: {
    ar: "لا يمكن تقديم بلاغ جديد عن هذه الخزنة لمدة ٩٠ يوماً.",
    en: "A new report about this vault can't be filed for 90 days.",
  },
  // Not `locked`: nothing is held against the person who filed. The commonest
  // cause is a mistyped email, and the right next step is to file again.
  closedHeading: { ar: "انتهى هذا البلاغ", en: "This report has ended" },
  closedBody: {
    ar: "لم نجد خزنة بالبريد الذي أدخلته. غالباً يكون السبب خطأً في كتابته — راجعه وقدّم بلاغاً جديداً، ولا قيد عليك في ذلك.",
    en: "We found no vault with the email you entered. Usually it's a typo — check it and file a new report. There's no restriction on doing so.",
  },
  lockedHeading: { ar: "هذه الخزنة موقوفة مؤقتاً", en: "This vault is paused for now" },
  lockedBody: {
    ar: "أُوقف بلاغ سابق عنها، ولم تنتهِ مدة الإيقاف بعد. سيُغلق هذا البلاغ دون تسليم.",
    en: "An earlier report about it was stopped, and that pause hasn't ended yet. This report will close without a delivery.",
  },
} as const satisfies Dictionary
