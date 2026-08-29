import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.٤ — the status page they re-open for weeks.
 *
 * Two lines here carry the design and must not be softened in either language.
 * `why` states the reason for the wait first and without hedging: the board's
 * note is that vagueness at this point reads as theft or stonewalling.
 * `stepNotified` says out loud that the account holder was told — radical
 * transparency is the instruction, and hiding that step is what would read as
 * a seizure.
 */
export const CLAIM_STATUS = {
  metaTitle: { ar: "حالة طلب الوراثة · وصيّة", en: "Claim status · Wassiya" },
  heading: { ar: "طلبك قيد الانتظار", en: "Your claim is waiting" },
  why: {
    ar: "هذه المدة موجودة لسبب واحد: إن كان صاحب الحساب حيّاً، فله الحق أن يعترض. لن نُفرج عن شيء قبل {date}.",
    en: "This period exists for one reason: if the account holder is alive, they have the right to object. We will release nothing before {date}.",
  },
  claimRef: { ar: "رقم الطلب", en: "Claim number" },
  submittedAt: { ar: "قُدّم في {date}", en: "Filed on {date}" },
  daysLeft: { ar: "يوماً متبقياً", en: "days left" },
  vetoEnds: {
    ar: "تنتهي مدة الاعتراض {date}",
    en: "The objection period ends {date}",
  },
  noLogin: {
    ar: "أرسلنا هذا الرابط إلى بريدك — لا حاجة لحساب أو كلمة مرور.",
    en: "We sent this link to your email — no account or password needed.",
  },
  contact: { ar: "تواصل معنا بشأن الطلب", en: "Contact us about this claim" },

  stepReceived: {
    ar: "استُلم البلاغ وتحقّقنا من هويتك",
    en: "Report received and your identity verified",
  },
  stepNotified: {
    ar: "أُبلغ صاحب الحساب على كل قنواته",
    en: "The account holder was notified on every channel",
  },
  stepNotifiedMeta: {
    ar: "إشعار، بريد، رسالة نصية",
    en: "In-app, email, SMS",
  },
  stepVeto: {
    ar: "مدة الاعتراض جارية",
    en: "The objection period is running",
  },
  stepGuardian: { ar: "تأكيد الوصي", en: "Guardian confirmation" },
  stepGuardianMeta: {
    ar: "يُطلب منه بعد انتهاء المدة",
    en: "Asked for once the period ends",
  },
  stepRelease: {
    ar: "الإفراج عمّا خُصّص لك",
    en: "Release of what was left to you",
  },
  stepReleaseMeta: {
    ar: "تلقائياً — نرسل لك رابطاً",
    en: "Automatic — we send you a link",
  },

  statusWaiting: { ar: "قيد الانتظار", en: "Waiting" },
  statusReview: { ar: "قيد المراجعة اليدوية", en: "In manual review" },
  statusGuardian: {
    ar: "بانتظار تأكيد الوصي",
    en: "Awaiting guardian confirmation",
  },
  statusReleased: { ar: "تم الإفراج", en: "Released" },
  statusVetoed: { ar: "أُغلق الطلب", en: "Claim closed" },
  statusLocked: { ar: "الطلب مغلق", en: "Claim locked" },

  // A veto is a designed state, not an error, and must not read as an
  // accusation — the person reading it has usually just lost someone.
  vetoedTitle: { ar: "أُغلق هذا الطلب", en: "This claim was closed" },
  vetoedBody: {
    ar: "اعترض صاحب الحساب على الطلب خلال المدة المتاحة له، ولذلك لن يُفرج عن شيء. إن كنت تعتقد أن هناك خطأً، تواصل معنا.",
    en: "The account holder objected within the period available to them, so nothing will be released. If you believe this is a mistake, contact us.",
  },
  releasedTitle: { ar: "تم الإفراج", en: "Released" },
  releasedBody: {
    ar: "أرسلنا إلى بريدك رابطاً لصندوقك.",
    en: "We have emailed you a link to your box.",
  },
  openBox: { ar: "افتح صندوقك", en: "Open your box" },

  notFoundTitle: {
    ar: "لم نجد هذا الطلب",
    en: "We could not find this claim",
  },
  notFoundBody: {
    ar: "قد يكون الرابط قديماً أو غير مكتمل. افتح الرابط الذي أرسلناه إلى بريدك، أو ابدأ بلاغاً جديداً.",
    en: "The link may be old or incomplete. Open the link we emailed you, or start a new report.",
  },
  startOver: { ar: "ابدأ بلاغاً جديداً", en: "Start a new report" },
} as const satisfies Dictionary
