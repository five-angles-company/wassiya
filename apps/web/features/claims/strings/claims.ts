import type { Dictionary } from "@/lib/i18n/locale"

/**
 * Death reports — the list, the form, and the case page's chrome.
 *
 * The voice is plain, warm, and never euphemistic about death: "بلاغ وفاة" is
 * a death report and says so.
 *
 * - *"We're sorry for your loss"* appears **once**, in `newIntro`, and nowhere
 *   else in the app — repeated condolence reads as a script.
 * - The person filing is not a recipient. Nothing here may promise them what
 *   was left: Wassiya contacts the executors itself.
 */
export const CLAIMS = {
  listBody: {
    ar: "كل بلاغ قدّمته، وأين وصل. نراسلك عند كل خطوة، فلا حاجة لمتابعة هذه الصفحة.",
    en: "Every report you've filed, and where it stands. We email you at each step, so there's no need to keep checking this page.",
  },
  emptyTitle: { ar: "لا بلاغات بعد", en: "No reports yet" },
  emptyBody: {
    ar: "إن توفّي شخص كان يستخدم وصيّة، تبدأ من هنا.",
    en: "If someone who used Wassiya has died, this is where you start.",
  },
  newReport: { ar: "بلاغ جديد", en: "New report" },

  // `/file` is readable without an account, so the checklist can be read
  // first. Sending needs one: a report has to belong to a person, which is what
  // gives the rate limit and the 90-day lockout their meaning.
  signInTitle: { ar: "سجّل الدخول لتبدأ", en: "Sign in to start" },
  signInBody: {
    ar: "نحتاج حساباً ليكون البلاغ باسمك ونراسلك عند كل خطوة. الحساب مجاني ويأخذ دقيقة.",
    en: "We need an account so the report is in your name and we can email you at each step. It's free and takes a minute.",
  },
  signInAction: { ar: "سجّل الدخول وابدأ", en: "Sign in and start" },
  fileAgain: { ar: "قدّم بلاغاً جديداً", en: "File a new report" },
  otherCases: { ar: "كل بلاغاتك", en: "All your reports" },

  // A signed-in reader who did not file it — someone the link was forwarded
  // to. They may read the report; they cannot act on it.
  notYoursBody: {
    ar: "يمكنك متابعة أين وصل هذا البلاغ، لكن خطواته يقوم بها من قدّمه فقط.",
    en: "You can follow where this report stands, but only the person who filed it can take its next steps.",
  },
  unknownVault: { ar: "صاحب خزنة", en: "a vault owner" },

  // ---- the form -------------------------------------------------------------
  newTitle: { ar: "بلاغ وفاة", en: "Report a death" },
  newIntro: {
    ar: "نأسف لفقدك. سنطلب منك شهادة الوفاة. بعد أن نتأكد من كل شيء، نتواصل نحن مع الأوصياء مباشرة — فتقديم البلاغ لا يمنحك شيئاً بنفسه.",
    en: "We're sorry for your loss. We'll ask you to upload the death certificate. Once we've checked everything, we contact the executors ourselves — filing the report doesn't give you anything by itself.",
  },
  timing: {
    ar: "دقائق قليلة · يمكنك الإكمال لاحقاً",
    en: "A few minutes · you can finish later",
  },

  needTitle: { ar: "جهّز هذه قبل أن تبدأ", en: "Have these ready first" },
  needWhy: {
    ar: "أكثر ما يؤخّر الناس هو البدء دون شهادة الوفاة.",
    en: "What holds people up most is starting without the death certificate.",
  },
  needCertificateTitle: { ar: "شهادة الوفاة", en: "The death certificate" },
  needCertificateBody: {
    ar: "ملف PDF أو صورة واضحة، حتى ٢٠ م.ب",
    en: "A PDF or a clear photo, up to 20 MB",
  },
  needEmailTitle: { ar: "بريد المتوفّى في وصيّة", en: "Their Wassiya email" },
  needEmailBody: {
    ar: "البريد الذي أنشأ به حسابه — تجده غالباً على ورقة الاسترداد المطبوعة",
    en: "The email they signed up with — often printed on their recovery sheet",
  },

  // Three fields and no more: every extra one is a chance to stall someone
  // filling this in during the week of a funeral.
  formTitle: { ar: "بيانات البلاغ", en: "About the report" },
  subjectLabel: { ar: "بريد المتوفّى في وصيّة", en: "The email they used with Wassiya" },
  subjectHint: {
    ar: "كما هو على ورقة الاسترداد إن وجدتها",
    en: "As printed on their recovery sheet, if you have it",
  },
  nameLabel: { ar: "اسمك الكامل", en: "Your full name" },
  subjectPlaceholder: { ar: "name@example.com", en: "name@example.com" },
  contactPlaceholder: { ar: "05x xxx xxxx", en: "05x xxx xxxx" },
  contactLabel: { ar: "رقم جوّالك", en: "Your mobile number" },
  contactHint: {
    ar: "لنتواصل معك بشأن هذا البلاغ فقط",
    en: "Only to reach you about this report",
  },
  fileClaim: { ar: "أرسل البلاغ", en: "Send the report" },
  filing: { ar: "جارٍ الإرسال…", en: "Sending…" },
  fileFailed: {
    ar: "لم يُرسل البلاغ ولم يُحفظ شيء. حاول مرة أخرى.",
    en: "The report wasn't sent and nothing was saved. Please try again.",
  },
  // `submit` answers the same whether or not the email matched a vault — it
  // must not reveal which emails have one — so nothing after it may promise
  // that a vault was found.

  disclaimer: {
    ar: "وصيّة ليست جهة قانونية ولا تقسّم التركات؛ تقسيم الميراث يحكمه الشرع والقانون. نحن نوصل ما اختار صاحب الخزنة تسليمه إلى الأوصياء الذين سمّاهم فقط، وهم من ينفّذون وصيّته.",
    en: "Wassiya is not a legal authority and doesn't divide estates — that is set by law. We deliver what the vault's owner chose to hand over only to the executors they named, who carry out their will.",
  },
  needPrivacy: {
    ar: "نستخدم شهادة الوفاة للتحقق من البلاغ فقط، ولا نعطيها لأحد.",
    en: "We use the death certificate only to check this report, and never share it with anyone.",
  },

  // ---- the case page ----------------------------------------------------------
  detailEyebrow: { ar: "بلاغ وفاة", en: "Death report" },
  detailTitle: { ar: "بلاغ عن {name}", en: "Report about {name}" },
  backToList: { ar: "كل البلاغات", en: "All reports" },
} as const satisfies Dictionary
