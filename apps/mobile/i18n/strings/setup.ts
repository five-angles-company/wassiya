/**
 * Section ٢ · تهيئة الخزنة — copy for screens 2.1 to 2.6, verbatim. Three
 * constraints it has to honour:
 *
 *  - **Two keys, two jobs, not interchangeable.** The device key opens the vault
 *    daily and the printed sheet opens it when the device is gone. Executors never
 *    open it: they receive only what is routed to them, after a verified death.
 *    Copy implying a third key contradicts the security model, not its tone.
 *  - `recoveryKit.shownOnce` is a commitment, not a warning: after the print
 *    intent the code is wiped from memory and cannot be re-derived.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

export const KYC = {

  title: { ar: "لنتحقق من هويتك", en: "Let's verify your identity" },
  body: {
    ar: "نربط خزنتك باسمك الرسمي، فلا يستلم ما تتركه إلا أوصياؤك.",
    en: "We bind your vault to your legal name, so only your executors receive what you leave.",
  },
  requirementDocument: {
    ar: "الهوية الوطنية أو الإقامة أو جواز السفر",
    en: "National ID, iqama or passport",
  },
  requirementSelfie: { ar: "صورة حيّة لوجهك", en: "A live photo of your face" },
  requirementTime: {
    ar: "إضاءة جيدة ودقيقتان من وقتك",
    en: "Good light and two minutes",
  },
  countryLabel: { ar: "الدولة", en: "Country" },
  countryNotice: {
    ar: "اختر دولتك لنعرض نوع الهوية المقبولة.",
    en: "Choose your country so we can show which ID documents are accepted.",
  },
  cta: { ar: "ابدأ التحقق", en: "Start verification" },
  opening: { ar: "جارٍ فتح صفحة التحقق…", en: "Opening verification…" },
  failed: {
    ar: "تعذّر بدء التحقق. حاول مرة أخرى.",
    en: "Could not start verification. Please try again.",
  },
} satisfies LabelSet<string>

export const KYC_PENDING = {
  title: {
    ar: "مستنداتك قيد المراجعة",
    en: "Your documents are being reviewed",
  },
  body: {
    ar: "عادةً أقل من دقيقتين. يمكنك إغلاق التطبيق.",
    en: "Usually under two minutes. You can close the app.",
  },
  // ⚠️ The checks being run, never checks that have passed: Didit reports one
  // verdict and no sub-steps.
  checksLine: {
    ar: "نتحقق من هويتك، وأنك شخص حقيقي، ومن مطابقة وجهك.",
    en: "We check your ID, that you are a real person, and your face against it.",
  },
  rejectedTitle: { ar: "لم يكتمل التحقق", en: "Verification didn't pass" },
  rejectedBody: {
    ar: "الصورة غير واضحة. تأكد من الإضاءة ومن ظهور الهوية كاملة، ثم حاول مرة أخرى.",
    en: "The photo wasn't clear. Check the lighting and that the whole ID is visible, then try again.",
  },
  tryAgain: { ar: "حاول مرة أخرى", en: "Try again" },
  attemptsLeft: { ar: "المحاولات المتبقية", en: "Attempts remaining" },
  supportTitle: { ar: "لنكمل هذا معك", en: "Let's finish this together" },
  supportBody: {
    ar: "بعد ثلاث محاولات يكمل فريقنا التحقق معك.",
    en: "After three attempts our team finishes this with you.",
  },
  contactSupport: { ar: "تواصل مع الدعم", en: "Contact support" },
} satisfies LabelSet<string>

export const KYC_VERIFIED = {
  title: { ar: "تم التحقق من هويتك", en: "Your identity is verified" },
  body: {
    ar: "بهذا الاسم تُطابَق شهادة الوفاة لاحقاً.",
    en: "A death certificate is matched against this name.",
  },
  verifiedName: { ar: "الاسم الموثّق", en: "Verified name" },
  document: { ar: "المستند", en: "Document" },
  cta: { ar: "أكمل الإعداد", en: "Continue setup" },

  // Document kinds. Didit returns a machine string ("national_id"); showing it
  // raw would put an English snake_case token in an Arabic summary card. The
  // design also prints the document's last four digits beside the type, but the
  // schema deliberately stores only `identityDocType` — adding the digits means
  // adding a column, so the type stands alone until then.
  docNationalId: { ar: "الهوية الوطنية", en: "National ID" },
  docPassport: { ar: "جواز السفر", en: "Passport" },
  docResidencePermit: { ar: "الإقامة", en: "Residence permit" },
  docDrivingLicense: { ar: "رخصة القيادة", en: "Driving licence" },
  docOther: { ar: "مستند رسمي", en: "Official document" },
} satisfies LabelSet<string>

export const EXPLAINER = {
  title: { ar: "مفتاحان لخزنتك", en: "Two keys to your vault" },
  deviceTitle: { ar: "هذا الجهاز", en: "This device" },
  deviceBody: {
    ar: "بصمتك تفتح خزنتك كل يوم",
    en: "Your fingerprint opens your vault every day",
  },
  paperTitle: { ar: "وثيقة الاسترداد", en: "Your recovery sheet" },
  paperBody: {
    ar: "تفتحها إن فقدت جهازك — احفظها مع وصيّتك",
    en: "Opens it if you lose your phone — keep it with your will",
  },
  // Not a third key to the vault: an executor sheet opens only what was handed
  // over, and only after a verified death.
  executorsTitle: { ar: "وأوصياؤك، لاحقاً", en: "And your executors, later" },
  executorsBody: {
    ar: "لا يفتحون خزنتك — يستلمون ما سلّمته بعد وفاتك",
    en: "They never open your vault — they receive what you hand over, after your death",
  },
} satisfies LabelSet<string>

export const BIOMETRICS = {
  body: {
    ar: "بصمتك تُنشئ المفتاح داخل هذا الجهاز، مرة واحدة.",
    en: "Your fingerprint creates the key inside this phone, once.",
  },
  cta: { ar: "أنشئ المفتاح ببصمتك", en: "Create the key" },
  prompt: {
    ar: "المس مستشعر البصمة لإنشاء مفتاح خزنة وصيّة",
    en: "Touch the sensor to create your Wassiya vault key",
  },
  unenrolledTitle: {
    ar: "لا توجد بصمة مسجّلة على هذا الجهاز",
    en: "No biometrics enrolled on this device",
  },
  unenrolledBody: {
    ar: "سجّل بصمة أو رمز قفل في إعدادات جهازك، ثم عد.",
    en: "Add a fingerprint or device lock in your settings, then come back.",
  },
  openSettings: { ar: "افتح الإعدادات", en: "Open settings" },
  recheck: { ar: "تحققت، أعد المحاولة", en: "I've done it, check again" },
  cancelled: {
    ar: "أُلغي التأكيد. المفتاح لم يُنشأ بعد.",
    en: "Confirmation cancelled. The key has not been created yet.",
  },
  failed: {
    ar: "تعذّر إنشاء المفتاح على هذا الجهاز. حاول مرة أخرى.",
    en: "Could not create the key on this device. Please try again.",
  },
} satisfies LabelSet<string>

export const RECOVERY_KIT = {
  keyReady: { ar: "مفتاحك جاهز على هذا الجهاز", en: "Your key is ready on this phone" },
  title: { ar: "اطبع وثيقة الاسترداد", en: "Print your recovery sheet" },
  // The bearer warning, on the screen that hands the sheet over. It is the
  // whole of recovery — no second key, and nobody to ask.
  body: {
    ar: "احفظها مع وصيّتك. من يحملها يفتح خزنتك على أي جهاز.",
    en: "Keep it with your will. Whoever holds it can open your vault on any device.",
  },
  documentTitle: { ar: "وثيقة استرداد وصيّة", en: "وثيقة استرداد وصيّة" },
  // The masthead beside the mark. Arabic in both locales, like the title:
  // this document is filed in Arabic-speaking jurisdictions whatever language
  // the app is running in.
  brandName: { ar: "وصيّة", en: "وصيّة" },
  documentSubtitle: {
    ar: "WASSIYA RECOVERY DOCUMENT",
    en: "WASSIYA RECOVERY DOCUMENT",
  },
  codeLabel: { ar: "رمز الاسترداد", en: "Recovery code" },
  /**
   * The OS BiometricPrompt on this screen — a system sheet, so it gets its own
   * short line rather than reusing any of the page copy. It has to name what
   * the fingerprint is *for*: unsealing the vault key long enough to derive
   * the paper share.
   */
  keyPrompt: {
    ar: "أكّد بصمتك لإنشاء وثيقة الاسترداد",
    en: "Confirm your fingerprint to create your recovery sheet",
  },
  shownOnce: {
    ar: "تُعرض مرة واحدة فقط. لن نستطيع إظهارها لك مرة أخرى — ولا نحتفظ بنسخة.",
    en: "Shown once. We cannot show it again — and we keep no copy.",
  },
  // Printed on the sheet itself, and it now carries the reason. "Do not
  // photograph" without a consequence reads as tidiness; with one it reads as
  // what it is. This page is the entire recovery path — there is no second
  // share and no person to ask.
  handling: {
    ar: "من يحمل هذه الوثيقة يستطيع استعادة خزنتك. لا تُصوَّر ولا تُرسل رقمياً.",
    en: "Whoever holds this sheet can recover your vault. Do not photograph it or send it digitally.",
  },
  // The printed sheet's instructions. It is filed with a will and read years
  // later by someone who has lost every device — quite possibly not the person
  // who printed it — so the document has to explain itself without the app.
  howTitle: { ar: "متى تحتاجها، وكيف تُستخدم", en: "When you need it, and how" },
  howWhen: {
    ar: "إن فقدت كل أجهزتك المسجّلة، هذه الوثيقة هي الطريق الوحيد لاستعادة خزنتك. لا يوجد طريق آخر، ولا نملك نسخة منها.",
    en: "If you lose every enrolled device, this sheet is the only way back into your vault. There is no other path, and we hold no copy.",
  },
  howStep1: {
    ar: "ثبّت تطبيق وصيّة على جهاز جديد، واختر «استعادة».",
    en: "Install Wassiya on a new device and choose “Recover”.",
  },
  howStep2: {
    ar: "اكتب الرمز أعلاه كما هو تماماً — حروف لاتينية، والشرطات ليست جزءاً منه.",
    en: "Type the code above exactly as printed — Latin letters; the dashes are not part of it.",
  },
  howStep3: {
    ar: "بعد الاستعادة اطبع وثيقة جديدة. تتوقف هذه عن العمل، ونُشعرك عند استخدامها.",
    en: "Print a new sheet afterwards. This one stops working, and we notify you when it is used.",
  },
  qrCaption: { ar: "للمسح بدل الكتابة", en: "Scan instead of typing" },
  sheetFooter: {
    ar: "وثيقة واحدة من صفحة واحدة · لا تحتوي على معرّف حسابك",
    en: "One document, one page · it does not contain your account identifier",
  },
  keepWithWill: {
    ar: "احفظها مع وصيّتك الموثّقة عند كاتب العدل.",
    en: "Keep it with your notarised will at the notary.",
  },
  owner: { ar: "صاحب الخزنة", en: "Vault owner" },
  account: { ar: "حساب وصيّة", en: "Wassiya account" },
  issued: { ar: "تاريخ الإصدار", en: "Issued" },
  version: { ar: "الإصدار", en: "Version" },
  print: { ar: "طباعة", en: "Print" },
  saveOrShare: { ar: "حفظ أو مشاركة PDF", en: "Save or share the PDF" },
  preparing: { ar: "جارٍ تجهيز الوثيقة…", en: "Preparing your document…" },
  cancelled: {
    ar: "أُلغيت العملية. الوثيقة ما زالت معروضة.",
    en: "Cancelled. The document is still on screen.",
  },
  screenshotBlocked: {
    ar: "لقطات الشاشة معطّلة على هذه الصفحة — اطبع الوثيقة بدلاً من تصويرها.",
    en: "Screenshots are disabled on this page — print the document instead.",
  },
  failed: {
    ar: "تعذّر تجهيز الوثيقة. حاول مرة أخرى.",
    en: "Could not prepare the document. Please try again.",
  },
} satisfies LabelSet<string>

export const SETUP_COMPLETE = {
  title: { ar: "خزنتك جاهزة", en: "Your vault is ready" },
  subtitle: {
    ar: "بقي أن تسمّي وصيّاً.",
    en: "One thing left: name an executor.",
  },
  identity: { ar: "هويتك موثّقة", en: "Identity verified" },
  deviceKey: { ar: "مفتاح الجهاز مفعّل", en: "Device key enrolled" },
  recoverySheet: { ar: "وثيقة الاسترداد مطبوعة", en: "Recovery sheet printed" },
  executors: { ar: "وصيّ واحد على الأقل", en: "At least one executor" },
  delivery: { ar: "ورقة لكل وصيّ", en: "A sheet for every executor" },
  checkIn: { ar: "تأكيد الحياة", en: "Life check-in" },
  needed: { ar: "مطلوب", en: "needed" },
  later: { ar: "لاحقاً", en: "later" },
  addExecutors: { ar: "سمِّ وصياً", en: "Name an executor" },
  openVault: { ar: "افتح خزنتك", en: "Open your vault" },
} satisfies LabelSet<string>

