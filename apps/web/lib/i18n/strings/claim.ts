import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.١ — the claim funnel's entry page.
 *
 * The voice is the board's: **plain, warm, never euphemistic about death.**
 * "بلاغ وفاة" is a *death report* and the headline says so in two words.
 *
 * Two lines here are placed rather than merely written. *"We're sorry for your
 * loss"* appears once, on this page, and never again in the funnel — repeated
 * condolence stops reading as sympathy and starts reading as a script. And the
 * no-legal-authority line sits here, in the reader's path, rather than in a
 * footer where the belief it corrects would already have formed.
 */
export const CLAIM = {
  metaTitle: {
    ar: "بلاغ وفاة · وصيّة",
    en: "Report a death · Wassiya",
  },
  metaDescription: {
    ar: "إن توفّي شخص ترك لك شيئاً في وصيّة، تبدأ من هنا. لا تحتاج حساباً ولا بطاقة.",
    en: "If someone who left you something in Wassiya has died, start here. No account, no card.",
  },

  alreadyFiled: { ar: "لديك بلاغ سابق؟", en: "Already filed?" },

  timing: {
    ar: "نحو عشر دقائق · يمكنك التوقّف والعودة",
    en: "About ten minutes · you can stop and come back",
  },
  title: { ar: "بلاغ وفاة", en: "Report a death" },
  intro: {
    ar: "نأسف لفقدك. سنطلب منك إثبات هويتك وشهادة الوفاة، ثم نبدأ إجراءً واضحاً ينتهي بتسليمك ما تركه لك — دون أن نطلع على شيء منه.",
    en: "We're sorry for your loss. We'll ask you to prove who you are and upload the death certificate, then begin a clear process that ends with you receiving what was left to you — without us seeing any of it.",
  },
  start: { ar: "ابدأ الخطوة الأولى", en: "Start step one" },
  startMeta: { ar: "لا تحتاج حساباً ولا بطاقة", en: "No account, no card" },

  disclaimer: {
    ar: "وصيّة ليست جهة قانونية ولا تقسّم التركات. الأنصبة يحدّدها القانون والفرائض الشرعية — نحن نوصّل ما وُجّه إليك بالاسم، لا أكثر.",
    en: "Wassiya is not a legal authority and does not divide estates. Shares are set by law and by the fara'id — we only deliver what was routed to you by name.",
  },

  // The ink panel. Three items and no more; the third carries the longest
  // explanation because "the email they registered" is the one an heir usually
  // has to go and find.
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
  needEmailTitle: { ar: "بريد المتوفّى المسجّل", en: "The email they registered" },
  needEmailBody: {
    ar: "البريد الذي أنشأ به خزنته — غالباً في وثيقة الاسترداد المطبوعة",
    en: "The address their vault was created with — usually on the printed recovery sheet",
  },
  needPrivacy: {
    ar: "مستنداتك تُستخدم للتحقق من البلاغ فقط، ولا تُسلّم لأي وارث آخر.",
    en: "Your documents are used to verify this report only, and are never passed to another heir.",
  },
} as const satisfies Dictionary
