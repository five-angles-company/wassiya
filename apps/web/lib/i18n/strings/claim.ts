import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧ — the heir-claim funnel's landing page.
 *
 * The voice is the constraint, and it is the board's: **plain, warm, never
 * euphemistic about death.** The English is written to that instruction rather
 * than mirrored word for word off the Arabic — "بلاغ وفاة" is a *death report*,
 * not a "bereavement notification", and softening it here would be the one
 * thing the board rules out.
 *
 * Lists are flattened into individual keys rather than kept as arrays, because
 * `t()` resolves a `Record<string, LabelSet>`. The call site rebuilds the array
 * from the resolved labels, which also makes each line addressable on its own.
 */
export const CLAIM = {
  metaTitle: {
    ar: "طلب الوصول إلى إرث رقمي · وصيّة",
    en: "Claim access to a digital legacy · Wassiya",
  },
  metaDescription: {
    ar: "إذا فقدت شخصاً عزيزاً كان يحفظ إرثه الرقمي في وصيّة، يمكنك تقديم بلاغ وفاة لبدء التحقق. مجاناً، وبدون تطبيق.",
    en: "If you have lost someone who kept their digital legacy in Wassiya, you can file a death report to begin verification. Free, and no app to install.",
  },

  brand: { ar: "وصيّة", en: "Wassiya" },
  myAccount: { ar: "هذا حسابي", en: "This is my account" },

  title: {
    ar: "طلب الوصول إلى إرث رقمي",
    en: "Claim access to a digital legacy",
  },
  intro: {
    ar: "إذا فقدت شخصاً عزيزاً كان يحفظ إرثه الرقمي في وصيّة، يمكنك تقديم بلاغ وفاة لبدء التحقق.",
    en: "If you have lost someone who kept their digital legacy in Wassiya, you can file a death report to begin verification.",
  },
  condolence: {
    ar: "نعتذر لخسارتك. سنشرح كل خطوة قبل أن تبدأها، ولن نطلب منك أي مبلغ.",
    en: "We are sorry for your loss. We will explain every step before you take it, and we will never ask you for money.",
  },

  start: { ar: "تقديم بلاغ وفاة", en: "File a death report" },
  startMeta: {
    ar: "٣ خطوات · نحو ١٠ دقائق",
    en: "3 steps · about 10 minutes",
  },

  resumeTitle: { ar: "لديك رابط طلب سابق؟", en: "Already have a claim link?" },
  resumeBody: {
    ar: "افتحه لمتابعة الحالة — أرسلناه إلى بريدك",
    en: "Open it to follow the status — we emailed it to you",
  },
  guardianTitle: { ar: "أنت وصي؟", en: "Are you a guardian?" },
  guardianBody: {
    ar: "دورك يأتي بعد مدة الاعتراض",
    en: "Your part comes after the objection period",
  },

  needTitle: { ar: "ستحتاج ثلاثة أشياء", en: "You will need three things" },
  needId: {
    ar: "هويتك الوطنية أو الإقامة",
    en: "Your national ID or residence permit",
  },
  needCertificate: {
    ar: "شهادة الوفاة الرسمية",
    en: "The official death certificate",
  },
  needPhone: {
    ar: "الهاتف الذي سجّله لك",
    en: "The phone they registered for you",
  },

  stepsTitle: { ar: "ما يحدث بعد ذلك", en: "What happens next" },
  stepIdentity: { ar: "تحقّق من هويتك", en: "Verify your identity" },
  stepIdentityMeta: { ar: "دقيقتان", en: "2 minutes" },
  stepCertificate: {
    ar: "رفع شهادة الوفاة ومطابقة الاسم",
    en: "Upload the death certificate and match the name",
  },
  stepVeto: { ar: "مدة اعتراض ٣٠ يوماً", en: "A 30-day objection period" },
  stepVetoMeta: {
    ar: "نُبلغ صاحب الحساب",
    en: "We notify the account holder",
  },
  stepRelease: {
    ar: "الإفراج عمّا خُصّص لك وحدك",
    en: "Release of what was left to you alone",
  },

  // The three-step chrome on ٧.٢ and ٧.٣. Shorter than the `step*` labels
  // above, which describe what happens; these name where you are.
  stepperIdentity: { ar: "هويتك", en: "Your identity" },
  stepperCertificate: { ar: "شهادة الوفاة", en: "Death certificate" },
  stepperWaiting: { ar: "الانتظار", en: "Waiting" },

  disclaimer: {
    ar: "وصيّة ليست جهة قانونية ولا تقسّم التركات.",
    en: "Wassiya is not a legal authority and does not divide estates.",
  },
  terms: { ar: "الشروط", en: "Terms" },
  privacy: { ar: "الخصوصية", en: "Privacy" },
  howEncryption: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
} as const satisfies Dictionary
