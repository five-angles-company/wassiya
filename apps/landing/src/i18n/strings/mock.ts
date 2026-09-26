import type { Dictionary } from "@/i18n/locale"

/**
 * Text inside the drawn app screens and fragments. Where the app has the
 * string, this is the app's string (`apps/mobile/i18n/strings/*`), so the
 * pictures stay honest. Names and items are sample data, never a real person.
 */
export const MOCK = {
  time: { ar: "9:41", en: "9:41" },
  greeting: { ar: "مساء الخير", en: "Good evening" },
  ownerName: { ar: "عبدالله", en: "Abdullah" },
  ownerInitial: { ar: "ع", en: "A" },
  askTitle: { ar: "هل أنت بخير؟", en: "Are you well?" },
  askBody: {
    ar: "تأكيد واحد ببصمتك، ويعود العدّ من جديد.",
    en: "One touch, and the clock resets.",
  },
  askCta: { ar: "أنا بخير", en: "I'm well" },
  askSettings: { ar: "إعدادات النبض", en: "Check-in settings" },
  allReady: { ar: "كل شيء جاهز", en: "Everything is ready" },
  tileAssets: { ar: "الأصول", en: "Assets" },
  tileExecutors: { ar: "الأوصياء", en: "Executors" },
  tileHandedOver: { ar: "تُسلَّم", en: "Handed over" },
  tileDelivery: { ar: "التسليم", en: "Delivery" },
  tileDeliveryValue: { ar: "أوراقهم مطبوعة", en: "Sheets printed" },
  tileSheet: { ar: "الوثيقة", en: "Sheet" },
  tileSheetValue: { ar: "مطبوعة", en: "Printed" },
  tileIdentity: { ar: "الهوية", en: "Identity" },
  tileIdentityValue: { ar: "موثّقة", en: "Verified" },
  tabHome: { ar: "الرئيسية", en: "Home" },
  tabVault: { ar: "الخزنة", en: "Vault" },
  tabExecutors: { ar: "الأوصياء", en: "Executors" },
  tabAccount: { ar: "حسابي", en: "Account" },

  assetCrypto: { ar: "محفظة بيتكوين", en: "Bitcoin wallet" },
  assetBank: { ar: "الحساب الرئيسي", en: "Main account" },
  assetDeed: { ar: "صك المنزل", en: "House deed" },
  assetDiary: { ar: "مذكّراتي", en: "My journal" },
  handedOver: { ar: "يُسلَّم للوصي", en: "Handed over" },
  keptPrivate: { ar: "خاص — لا يُسلَّم", en: "Private — not handed over" },

  executorName: { ar: "محمد", en: "Mohammed" },
  executorRole: { ar: "الوصي", en: "Executor" },
  executorSheetPrinted: { ar: "ورقته مطبوعة", en: "His sheet is printed" },
  executorNote: {
    ar: "يستلم محمد كل ما يُسلَّم. ولا نراسله بشيء قبل وقته.",
    en: "Mohammed receives everything handed over. We send him nothing until it's time.",
  },

  checkCertificate: { ar: "الشهادة", en: "Certificate" },
  checkReview: { ar: "المراجعة", en: "Review" },
  checkVeto: { ar: "مدة الاعتراض", en: "Veto window" },
  checkIdentity: { ar: "هوية الوصي", en: "Executor's identity" },
  checkDone: { ar: "جاهز للتسليم", en: "Ready to deliver" },

  sheetMasthead: { ar: "وثيقة استرداد وصيّة", en: "Wassiya recovery document" },
  sheetCodeLabel: { ar: "رمز الاسترداد", en: "Recovery code" },
  sheetFooter: {
    ar: "من يحمل هذه الوثيقة يستطيع استعادة خزنتك. لا تُصوَّر ولا تُرسل رقمياً.",
    en: "Whoever holds this document can recover your vault. Don't photograph it or send it digitally.",
  },
  everyDay: { ar: "كل يوم · ببصمتك", en: "Every day · your fingerprint" },

  executorSheetMasthead: { ar: "ورقة الوصي", en: "Executor sheet" },
  executorSheetFor: { ar: "إلى محمد، وصيّي", en: "For Mohammed, my executor" },
  executorSheetCodeLabel: { ar: "رمز الوصي", en: "Executor code" },
  executorSheetStep1: { ar: "تصلك رسالة منّا بعد التحقق من الوفاة", en: "We message you once the death is verified" },
  executorSheetStep2: { ar: "تُثبت هويتك", en: "You confirm who you are" },
  executorSheetStep3: {
    ar: "تُدخل هذا الرمز، فتُفتح الأمانة",
    en: "You enter this code, and what was entrusted to you opens",
  },
  executorSheetFooter: {
    ar: "لا تفتح شيئاً ما دام صاحبها حيّاً. لا تُصوَّر ولا تُرسل رقمياً.",
    en: "Opens nothing while its owner is alive. Don't photograph it or send it digitally.",
  },
} as const satisfies Dictionary
