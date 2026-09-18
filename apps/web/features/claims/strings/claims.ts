import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The heir's reports — the list, the filing form, and the detail page's chrome.
 *
 * The voice: **plain, warm, never euphemistic about death.**
 * "بلاغ وفاة" is a *death report* and the headline says so in two words.
 *
 * Two lines are placed rather than merely written. *"We're sorry for your
 * loss"* appears once, on the filing form, and never again — repeated
 * condolence stops reading as sympathy and starts reading as a script. And the
 * no-legal-authority line sits in the reader's path rather than in a footer,
 * where the belief it corrects would already have formed.
 */
export const CLAIMS = {
  listBody: {
    ar: "كل بلاغ قدّمته، وأين وصل. نراسلك على بريدك عند كل تغيّر — لا حاجة لمتابعة هذه الصفحة يومياً.",
    en: "Every report you have filed, and where it stands. We email you at each change — there's no need to watch this page.",
  },
  emptyTitle: { ar: "لا بلاغات بعد", en: "No reports yet" },
  emptyBody: {
    ar: "إن توفّي شخص ترك لك شيئاً في وصيّة، تبدأ من هنا.",
    en: "If someone who left you something in Wassiya has died, you start here.",
  },
  newReport: { ar: "بلاغ جديد", en: "New report" },
  // For a reader who has the link but no session — a relative it was forwarded
  // to, or the claimant on a new device. The page is fully readable; only the
  // steps that ask for something swap to this.
  signInToAct: { ar: "سجّل الدخول للمتابعة", en: "Sign in to continue" },

  // `/file` is readable with no account so the checklist beside it can be read
  // first. The form itself needs one: a report has to belong to a person, which
  // is what makes the rate limit and the 90-day lockout mean anything.
  signInTitle: { ar: "قبل أن تبدأ", en: "Before you start" },
  signInBody: {
    ar: "نحتاج حساباً لنربط البلاغ بك ونراسلك عند كل تغيّر. الحساب مجاني ويستغرق دقيقة. اقرأ ما تحتاجه على اليمين أولاً — أكثر ما يوقف الناس هو البدء بلا شهادة الوفاة.",
    en: "We need an account so the report belongs to you and we can email you at each change. It is free and takes a minute. Read what you will need first — the commonest reason people stall is starting without the death certificate.",
  },
  signInAction: { ar: "سجّل الدخول وابدأ", en: "Sign in and start" },
  fileAgain: { ar: "قدّم بلاغاً جديداً", en: "File a new report" },
  otherCases: { ar: "كل بلاغاتك", en: "All your reports" },

  // For a reader who is signed in but is not the claimant — a relative the link
  // was forwarded to. They may read the whole report, which is what
  // `publicStatus` is for; they simply cannot act on it. Telling them to sign in
  // was the bug: they already had.
  notYoursTitle: { ar: "هذا بلاغ شخص آخر", en: "This is someone else's report" },
  notYoursBody: {
    ar: "يمكنك متابعة أين وصل هذا البلاغ، لكن لا يمكن لأحد غير مقدّمه إثبات هويته أو رفع الشهادة أو فتح الصندوق.",
    en: "You can follow where this report stands, but only the person who filed it can verify their identity, upload the certificate or open the box.",
  },
  unknownVault: { ar: "خزنة", en: "A vault" },

  // ---- filing ------------------------------------------------------------
  newTitle: { ar: "بلاغ وفاة", en: "Report a death" },
  newIntro: {
    ar: "نأسف لفقدك. سنطلب منك إثبات هويتك وشهادة الوفاة، ثم نبدأ إجراءً واضحاً ينتهي بتسليمك ما تركه لك — دون أن نطلع على شيء منه.",
    en: "We're sorry for your loss. We'll ask you to prove who you are and upload the death certificate, then begin a clear process that ends with you receiving what was left to you — without us seeing any of it.",
  },
  timing: {
    ar: "نحو عشر دقائق · يمكنك التوقّف والعودة",
    en: "About ten minutes · you can stop and come back",
  },

  // Three items and no more; the third carries the longest explanation because
  // "the email they registered" is the one an heir usually has to go and find.
  needTitle: { ar: "جهّز هذه قبل أن تبدأ", en: "Have these ready first" },
  needWhy: {
    ar: "أكثر ما يوقف الناس هو البدء بلا شهادة الوفاة.",
    en: "The commonest reason people stall is starting without the certificate.",
  },
  needIdTitle: { ar: "هويتك أنت", en: "Your own ID" },
  needIdBody: {
    ar: "الهوية الوطنية أو الإقامة أو جواز السفر — صورة وسيلفي حيّة",
    en: "National ID, iqama or passport — a photo and a liveness selfie",
  },
  needCertificateTitle: { ar: "شهادة الوفاة", en: "The death certificate" },
  needCertificateBody: {
    ar: "PDF أو صورة واضحة، حتى ٢٠ م.ب",
    en: "PDF or a clear photo, up to 20 MB",
  },
  needEmailTitle: {
    ar: "بريد المتوفّى المسجّل",
    en: "The email they registered",
  },
  needEmailBody: {
    ar: "البريد الذي أنشأ به خزنته — غالباً في وثيقة الاسترداد المطبوعة",
    en: "The address their vault was created with — usually on the printed recovery sheet",
  },

  // The form itself. Three fields and no more — every extra one is a chance to
  // stall someone who is filling this in the week of a funeral.
  subjectLabel: {
    ar: "بريد صاحب الحساب المتوفى",
    en: "The deceased account holder's email",
  },
  subjectHint: {
    ar: "البريد الذي كان يستخدمه في وصيّة",
    en: "The email they used with Wassiya",
  },
  nameLabel: {
    ar: "اسمك الكامل كما في هويتك",
    en: "Your full name as it appears on your ID",
  },
  // Placeholders, not repeated hints: both fields are Latin machine strings
  // in an Arabic form, and a shape to match is worth more than another
  // sentence.
  subjectPlaceholder: { ar: "name@example.com", en: "name@example.com" },
  contactPlaceholder: { ar: "05x xxx xxxx", en: "05x xxx xxxx" },
  contactLabel: { ar: "رقم جوالك", en: "Your mobile number" },
  contactHint: {
    ar: "سنستخدمه للتواصل بشأن البلاغ",
    en: "We will use it to contact you about the report",
  },
  fileClaim: { ar: "تسجيل البلاغ", en: "File the report" },
  filing: { ar: "جارٍ التسجيل…", en: "Filing…" },
  fileFailed: {
    ar: "تعذّر تسجيل البلاغ. لم يُحفظ شيء — حاول مرة أخرى.",
    en: "We could not file the report. Nothing was saved — try again.",
  },
  // `submit` answers `{ received: true }` whether or not the email matched a
  // vault, because it must not be an enumeration oracle. So the confirmation
  // cannot promise a vault was found, and this line is worded not to.

  disclaimer: {
    ar: "وصيّة ليست جهة قانونية ولا تقسّم التركات. الأنصبة يحدّدها القانون والفرائض الشرعية — نحن نوصّل ما وُجّه إليك بالاسم، لا أكثر.",
    en: "Wassiya is not a legal authority and does not divide estates. Shares are set by law and by the fara'id — we only deliver what was routed to you by name.",
  },
  needPrivacy: {
    ar: "مستنداتك تُستخدم للتحقق من البلاغ فقط، ولا تُسلّم لأي وارث آخر.",
    en: "Your documents are used to verify this report only, and are never passed to another heir.",
  },

  // ---- detail chrome -----------------------------------------------------
  detailTitle: { ar: "بلاغ خزنة {name}", en: "Report for {name}'s vault" },
  backToList: { ar: "كل البلاغات", en: "All reports" },
} as const satisfies Dictionary
