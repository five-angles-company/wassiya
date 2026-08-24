/**
 * Section ١ · الدخول — copy for screens 1.1 to 1.5.
 *
 * Every string is the design board's, verbatim in both languages. Two of them
 * are load-bearing rather than decorative and must not be paraphrased in a
 * future localisation pass:
 *
 *  - `signUp.nameNotice` — the name is what a death certificate is later
 *    matched against, so the warning has to be on the field that collects it.
 *  - `otp.notice` — the board's trust claim that an OTP proves identity and
 *    never touches the vault. It is the whole reason the screen has a notice.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

export const SPLASH = {
  encrypted: {
    ar: "تشفير من الطرف إلى الطرف",
    en: "End-to-end encrypted",
  },
} satisfies LabelSet<string>

export const WELCOME = {
  skip: { ar: "تخطّي", en: "Skip" },
  next: { ar: "التالي", en: "Next" },
  getStarted: { ar: "ابدأ الآن", en: "Get started" },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },

  vaultTitle: {
    ar: "كل ما يهمّك، في خزنة واحدة",
    en: "Everything that matters, in one vault",
  },
  vaultBody: {
    ar: "محافظ رقمية، حسابات بنكية، مستندات، صور وحسابات — محفوظة ومنظّمة في مكان واحد تتحكّم به وحدك.",
    en: "Crypto wallets, bank accounts, documents, photos and online accounts — kept in one place only you control.",
  },

  zeroKnowledgeTitle: {
    ar: "حتى نحن لا نستطيع قراءة بياناتك",
    en: "Not even we can read your data",
  },
  zeroKnowledgeBody: {
    ar: "التشفير يحدث على جهازك قبل أن يصل أي شيء إلى خدماتنا. المفتاح لا يغادر جهازك أبداً.",
    en: "Encryption happens on your device before anything reaches our servers. The key never leaves your phone.",
  },

  releaseTitle: {
    ar: "ورثتك يستلمون بعد التحقق من الوفاة",
    en: "Your heirs receive only after death is verified",
  },
  releaseBody: {
    ar: "الوارث الصامت لا يعرف شيئاً قبل ذلك — ولا يرى محتوى خزنتك أبداً قبل الإفراج.",
    en: "A silent heir knows nothing before then, and sees nothing inside your vault until release.",
  },
  gateIdentity: {
    ar: "تحقّق من هوية الوارث",
    en: "The heir's identity is verified",
  },
  gateCertificate: {
    ar: "شهادة وفاة رسمية تُطابق هويتك",
    en: "An official certificate matched to your ID",
  },
  gateGuardian: { ar: "موافقة وصيّك", en: "Your guardian's confirmation" },
  gateVeto: {
    ar: "مدة اعتراض تملك إيقافها بضغطة",
    en: "A veto window you can stop with one tap",
  },

  nothingToMemoriseTitle: {
    ar: "لا شيء عليك أن تحفظه",
    en: "Nothing for you to memorise",
  },
  nothingToMemoriseBody: {
    ar: "بصمتك تفتح الخزنة، وورقة استرداد واحدة تحفظها مع وصيّتك الموثّقة. لا كلمات مرور ولا عبارات سرّية.",
    en: "Your fingerprint opens the vault, and one printed recovery sheet lives with your notarised will. No passwords, no seed phrases.",
  },
} satisfies LabelSet<string>

export const SIGN_UP = {
  title: { ar: "أنشئ حسابك", en: "Create your account" },
  subtitle: {
    ar: "بلا كلمة مرور. نرسل لك رمزاً لمرة واحدة في كل مرة تدخل.",
    en: "No password. We send a one-time code each time you sign in.",
  },
  nameLabel: {
    ar: "الاسم الكامل كما في الهوية",
    en: "Full name as on your ID",
  },
  namePlaceholder: { ar: "الاسم الثلاثي", en: "Your full name" },
  emailLabel: { ar: "البريد الإلكتروني", en: "Email address" },
  emailPlaceholder: { ar: "you@example.com", en: "you@example.com" },
  countryLabel: { ar: "الدولة", en: "Country" },
  countryHint: {
    ar: "تحدّد نوع الهوية المقبولة وصيغة الحساب البنكي لاحقاً.",
    en: "Sets which ID documents are accepted, and your bank format later.",
  },
  nameNotice: {
    ar: "اسمك يجب أن يطابق هويتك الرسمية — عليه يعتمد التحقق من الوفاة لاحقاً.",
    en: "Your name must match your official ID — the later death-verification match depends on it.",
  },
  legal: {
    ar: "بالمتابعة أنت توافق على الشروط وسياسة الخصوصية.",
    en: "By continuing you accept the Terms and Privacy Policy.",
  },
  cta: { ar: "أرسل الرمز", en: "Send code" },
  alreadyRegistered: {
    ar: "هذا البريد مسجّل بالفعل. سجّل الدخول بدلاً من ذلك.",
    en: "That email is already registered. Sign in instead.",
  },
  invalidEmail: {
    ar: "أدخل بريداً إلكترونياً صحيحاً.",
    en: "Enter a valid email address.",
  },
} satisfies LabelSet<string>

export const OTP = {
  title: { ar: "أدخل رمز التحقق", en: "Enter your code" },
  subtitlePrefix: { ar: "أرسلنا ٦ أرقام إلى", en: "We sent 6 digits to" },
  notice: {
    ar: "هذا الرمز يثبت هويتك فقط — لا يفتح الخزنة ولا يفكّ التشفير.",
    en: "This code proves who you are. It does not open the vault or decrypt anything.",
  },
  resend: { ar: "إعادة إرسال الرمز", en: "Resend code" },
  resendLimit: {
    ar: "وصلت للحد الأقصى من المحاولات. انتظر قليلاً ثم أعد المحاولة.",
    en: "You have reached the resend limit. Wait a moment and try again.",
  },
  verify: { ar: "تأكيد", en: "Verify" },
  needsMoreSteps: {
    ar: "هذا الحساب يحتاج خطوة إضافية لا تدعمها هذه الشاشة.",
    en: "This account needs another step that this screen does not handle.",
  },
  resendFailed: {
    ar: "تعذّر إرسال الرمز. حاول مرة أخرى.",
    en: "We couldn't send the code. Try again.",
  },
  // Prefixes a raw Clerk code — a missing field, or a failure reason. Framed as
  // a support detail rather than a user instruction, because none of what it
  // names is actionable by the person holding the phone.
  detailPrefix: {
    ar: "تفاصيل للدعم:",
    en: "Details for support:",
  },
} satisfies LabelSet<string>

export const SIGN_IN = {
  title: { ar: "مرحباً بعودتك", en: "Welcome back" },
  subtitle: {
    ar: "أدخل بريدك وسنرسل لك رمزاً.",
    en: "Enter your email and we'll send a code.",
  },
  emailLabel: { ar: "البريد الإلكتروني", en: "Email address" },
  cta: { ar: "أرسل الرمز", en: "Send code" },
  newDeviceTitle: { ar: "جهاز جديد؟", en: "New device?" },
  newDeviceBody: {
    ar: "الرمز يثبت هويتك، لكن فتح الخزنة على جهاز جديد يحتاج وثيقة الاسترداد المطبوعة.",
    en: "The code proves your identity, but unlocking the vault on a new device needs your printed recovery sheet.",
  },
  noAccount: { ar: "ليس لديك حساب؟", en: "No account yet?" },
  createOne: { ar: "أنشئ واحداً", en: "Create one" },
  unknownAccount: {
    ar: "لا يوجد حساب بهذا البريد. أنشئ حساباً جديداً.",
    en: "No account with that email. Create one instead.",
  },
} satisfies LabelSet<string>
