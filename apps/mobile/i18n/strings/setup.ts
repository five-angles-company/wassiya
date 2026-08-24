/**
 * Section ٢ · تهيئة الخزنة — copy for screens 2.1 to 2.6.
 *
 * Board copy, verbatim. Three constraints the board states in prose and this
 * file has to honour:
 *
 *  - **Never "one key".** 2.2 teaches a 2-of-3 model; any copy that implies a
 *    single key contradicts the product's security model, not just its tone.
 *  - `kyc.blockingNotice` is the promise that no vault exists before identity
 *    passes. `keyring.save` enforces it server-side; this string is how the
 *    user learns it, and it must stay true.
 *  - `recoveryKit.shownOnce` is a commitment, not a warning: after the print
 *    intent the code is wiped from memory and cannot be re-derived.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

export const KYC = {
  title: { ar: "لنتحقق من هويتك", en: "Let's verify your identity" },
  body: {
    ar: "التحقق يربط الخزنة باسمك الرسمي. هذا ما يضمن أن ورثتك — ولا أحد سواهم — يستلمون إرثك.",
    en: "Verification binds the vault to your legal name. That is what guarantees your heirs — and no one else — receive your legacy.",
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
  blockingNotice: {
    ar: "لا يمكن إنشاء الخزنة قبل إتمام التحقق. هذه خطوة إلزامية لمرة واحدة.",
    en: "No vault is created until verification passes. One mandatory step, once.",
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
  nothingEncryptedYet: {
    ar: "لم يُنشأ أي مفتاح بعد — يمكنك العودة دون أن تفقد شيئاً.",
    en: "No key has been created yet — you can go back without losing anything.",
  },
} satisfies LabelSet<string>

export const KYC_PENDING = {
  ring: { ar: "جارٍ التحقق", en: "Checking" },
  title: {
    ar: "مستنداتك قيد المراجعة",
    en: "Your documents are being reviewed",
  },
  body: {
    ar: "عادةً أقل من دقيقتين. سنخبرك بإشعار — يمكنك إغلاق التطبيق.",
    en: "Usually under two minutes. We'll notify you — you can close the app.",
  },
  stepDocument: { ar: "تم استلام صورة الهوية", en: "ID document received" },
  stepLiveness: {
    ar: "تم التحقق من أنك شخص حقيقي",
    en: "Liveness confirmed",
  },
  stepFaceMatch: {
    ar: "مطابقة الوجه مع الهوية",
    en: "Face match against the ID",
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
    ar: "بعد ثلاث محاولات نفضّل أن يراجعها أحد من فريقنا معك بدل أن تعيد المحاولة.",
    en: "After three attempts we would rather have someone on our team look at it with you than have you try again.",
  },
  contactSupport: { ar: "تواصل مع الدعم", en: "Contact support" },
} satisfies LabelSet<string>

export const KYC_VERIFIED = {
  title: { ar: "تم التحقق من هويتك", en: "Your identity is verified" },
  body: {
    ar: "هذا الاسم هو المرجع الذي تُطابق عليه شهادة الوفاة لاحقاً.",
    en: "This name is the reference a death certificate will later be matched against.",
  },
  verifiedName: { ar: "الاسم الموثّق", en: "Verified name" },
  document: { ar: "المستند", en: "Document" },
  verifiedAt: { ar: "وقت التحقق", en: "Verified at" },
  cta: { ar: "أكمل الإعداد", en: "Continue setup" },

  // Document kinds. Didit returns a machine string ("national_id"); showing it
  // raw would put an English snake_case token in an Arabic summary card. The
  // board also prints the document's last four digits beside the type, but the
  // schema deliberately stores only `identityDocType` — adding the digits means
  // adding a column, so the type stands alone until then.
  docNationalId: { ar: "الهوية الوطنية", en: "National ID" },
  docPassport: { ar: "جواز السفر", en: "Passport" },
  docResidencePermit: { ar: "الإقامة", en: "Residence permit" },
  docDrivingLicense: { ar: "رخصة القيادة", en: "Driving licence" },
  docOther: { ar: "مستند رسمي", en: "Official document" },
} satisfies LabelSet<string>

export const EXPLAINER = {
  title: { ar: "ثلاثة مفاتيح لخزنتك", en: "Three keys to your vault" },
  body: {
    ar: "خزنتك تُفتح بمفتاحين من ثلاثة. لا يفتحها أي مفتاح وحده — وهذه الثلاثة:",
    en: "Your vault opens with two of three keys. None of them opens it alone — and these are the three:",
  },
  deviceTitle: { ar: "هذا الجهاز", en: "This device" },
  deviceBody: {
    ar: "بصمتك تفتح المفتاح المحفوظ داخله",
    en: "Your fingerprint unlocks the key sealed inside it",
  },
  paperTitle: { ar: "ورقة مطبوعة", en: "A printed sheet" },
  paperBody: {
    ar: "تحفظها مع وصيّتك الموثّقة — ننشئها بعد قليل",
    en: "Kept with your notarised will — we make it in a moment",
  },
  guardianTitle: { ar: "وصيّك", en: "Your guardian" },
  guardianBody: {
    ar: "يحفظ نسخة مشفّرة، ولا يرى شيئاً من خزنتك",
    en: "Holds an encrypted copy and sees nothing inside",
  },
  cta: { ar: "فهمت، أكمل", en: "Got it, continue" },
} satisfies LabelSet<string>

export const BIOMETRICS = {
  title: {
    ar: "فعّل البصمة لإنشاء المفتاح",
    en: "Enable biometrics to create the key",
  },
  body: {
    ar: "سيطلب النظام بصمتك مرة واحدة. المفتاح يُنشأ ويُغلق داخل جهازك في نفس اللحظة.",
    en: "The system will ask for your fingerprint once. The key is generated and sealed inside your device at that moment.",
  },
  cta: { ar: "تأكيد بصمتك", en: "Confirm your fingerprint" },
  prompt: {
    ar: "المس مستشعر البصمة لإنشاء مفتاح خزنة وصيّة",
    en: "Touch the sensor to create your Wassiya vault key",
  },
  unenrolledTitle: {
    ar: "لا توجد بصمة مسجّلة على هذا الجهاز",
    en: "No biometrics enrolled on this device",
  },
  unenrolledBody: {
    ar: "سجّل بصمة أو رمز قفل في إعدادات جهازك، ثم عد لإكمال الإعداد. مفتاح خزنتك يُحفظ خلف هذا القفل.",
    en: "Add a fingerprint or device lock in your system settings, then come back. Your vault key is sealed behind that lock.",
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

export const BIOMETRICS_DONE = {
  title: { ar: "مفتاحك جاهز", en: "Your key is ready" },
  body: {
    ar: "من الآن، كل ما تضيفه يُشفّر على جهازك قبل أن يُرسل.",
    en: "From now on, everything you add is encrypted on your device before it is sent.",
  },
  sealed: {
    ar: "المفتاح محفوظ في العنصر الآمن لهذا الجهاز",
    en: "Key sealed in this device's secure element",
  },
  remaining: {
    ar: "تبقّى شيء واحد: نسخة الاسترداد المطبوعة",
    en: "One thing left: your printed recovery sheet",
  },
  cta: { ar: "أنشئ وثيقة الاسترداد", en: "Create my recovery sheet" },
} satisfies LabelSet<string>

export const RECOVERY_KIT = {
  title: { ar: "اطبع وثيقة الاسترداد", en: "Print your recovery sheet" },
  body: {
    ar: "احفظها مع وصيّتك الموثّقة. هي أحد ثلاثة مفاتيح — ومعها مفتاح آخر تُفتح الخزنة على جهاز جديد.",
    en: "Keep it with your notarised will. It is one of three keys — with any second key it opens the vault on a new phone.",
  },
  documentTitle: { ar: "وثيقة استرداد وصيّة", en: "وثيقة استرداد وصيّة" },
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
  handling: {
    ar: "هذه الوثيقة لا تُصوَّر ولا تُرسل رقمياً.",
    en: "Do not photograph or send this document digitally.",
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
  savePdf: { ar: "حفظ PDF", en: "Save PDF" },
  share: { ar: "مشاركة للطابعة", en: "Send to printer" },
  preparing: { ar: "جارٍ تجهيز الوثيقة…", en: "Preparing your document…" },
  noPrinter: {
    ar: "لم نجد طابعة. جرّب «حفظ PDF» واطبعها لاحقاً.",
    en: "No printer found. Try Save PDF and print it later.",
  },
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
    ar: "ثلاث حمايات مفعّلة، واثنتان في انتظارك.",
    en: "Three protections live, two waiting for you.",
  },
  identity: { ar: "هويتك موثّقة", en: "Identity verified" },
  deviceKey: { ar: "مفتاح الجهاز مفعّل", en: "Device key enrolled" },
  recoverySheet: { ar: "وثيقة الاسترداد مطبوعة", en: "Recovery sheet printed" },
  recoverySheetPending: {
    ar: "وثيقة الاسترداد لم تُطبع",
    en: "Recovery sheet not printed",
  },
  heirs: { ar: "الورثة", en: "Heirs" },
  checkIn: { ar: "التحقق من الحياة", en: "Life check-in" },
  needed: { ar: "مطلوب", en: "needed" },
  later: { ar: "لاحقاً", en: "later" },
  warning: {
    ar: "خزنة بلا ورثة لا تُسلّم شيئاً. أضف وارثاً واحداً على الأقل لتكتمل السلسلة.",
    en: "A vault with no heirs delivers nothing. Add at least one heir to close the chain.",
  },
  addHeirs: { ar: "أضف الورثة", en: "Add heirs" },
  addAsset: { ar: "أضف أول أصل", en: "Add my first asset" },
} satisfies LabelSet<string>

export const RECOVERY_STUB = {
  title: { ar: "استرداد الخزنة", en: "Recover your vault" },
  body: {
    ar: "هذا الجهاز لا يحمل مفتاح خزنتك. لفتحها هنا تحتاج وثيقة الاسترداد المطبوعة وموافقة وصيّك — مفتاحان من الثلاثة.",
    en: "This device does not hold your vault key. Opening it here needs your printed recovery sheet and your guardian's approval — two of the three keys.",
  },
  notReady: {
    ar: "ما زلنا نبني هذه الخطوة. تواصل مع الدعم وسنكمل الاسترداد معك.",
    en: "We are still building this step. Contact support and we will complete the recovery with you.",
  },
  contactSupport: { ar: "تواصل مع الدعم", en: "Contact support" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
} satisfies LabelSet<string>
