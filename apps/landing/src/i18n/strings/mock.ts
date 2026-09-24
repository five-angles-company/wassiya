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
  tileHeirs: { ar: "الورثة", en: "Heirs" },
  tileRouting: { ar: "التوجيه", en: "Routing" },
  tileRoutingValue: { ar: "الكل موجَّه", en: "All routed" },
  tileDelivery: { ar: "التسليم", en: "Delivery" },
  tileDeliveryValue: { ar: "جاهز للورثة", en: "Ready for heirs" },
  tileSheet: { ar: "الوثيقة", en: "Sheet" },
  tileSheetValue: { ar: "مطبوعة", en: "Printed" },
  tileIdentity: { ar: "الهوية", en: "Identity" },
  tileIdentityValue: { ar: "موثّقة", en: "Verified" },
  tabHome: { ar: "الرئيسية", en: "Home" },
  tabVault: { ar: "الخزنة", en: "Vault" },
  tabHeirs: { ar: "الورثة", en: "Heirs" },
  tabAccount: { ar: "حسابي", en: "Account" },

  assetCrypto: { ar: "محفظة بيتكوين", en: "Bitcoin wallet" },
  assetCryptoTo: { ar: "سارة، عمر", en: "Sara, Omar" },
  assetBank: { ar: "الحساب الرئيسي", en: "Main account" },
  assetBankTo: { ar: "كل الورثة", en: "All heirs" },
  assetDeed: { ar: "صك المنزل", en: "House deed" },
  assetDeedTo: { ar: "محمد", en: "Mohammed" },
  allShort: { ar: "الكل", en: "All" },

  heirSara: { ar: "سارة", en: "Sara" },
  heirMohammed: { ar: "محمد", en: "Mohammed" },
  heirNoura: { ar: "نورة", en: "Noura" },
  heirOmar: { ar: "عمر", en: "Omar" },
  previewNote: {
    ar: "هذا كل ما سيراه محمد بعد الإفراج — لا أكثر.",
    en: "This is everything Mohammed will see after release — nothing more.",
  },
  previewHeading: { ar: "ما تركته لمحمد", en: "What you left Mohammed" },
  whole: { ar: "كاملة", en: "Whole" },
  voiceMessage: { ar: "رسالة صوتية", en: "Voice message" },

  checkCertificate: { ar: "الشهادة", en: "Certificate" },
  checkReview: { ar: "المراجعة", en: "Review" },
  checkVeto: { ar: "مدة الاعتراض", en: "Veto window" },
  checkIdentity: { ar: "هوية الوارث", en: "Heir's identity" },
  checkDone: { ar: "جاهز للتسليم", en: "Ready to deliver" },

  sheetMasthead: { ar: "وثيقة استرداد وصيّة", en: "Wassiya recovery document" },
  sheetCodeLabel: { ar: "رمز الاسترداد", en: "Recovery code" },
  sheetFooter: {
    ar: "من يحمل هذه الوثيقة يستطيع استعادة خزنتك. لا تُصوَّر ولا تُرسل رقمياً.",
    en: "Whoever holds this document can recover your vault. Don't photograph it or send it digitally.",
  },
  everyDay: { ar: "كل يوم · ببصمتك", en: "Every day · your fingerprint" },

  letterMasthead: { ar: "أمانة لسارة", en: "Kept for Sara" },
  letterHeading: { ar: "ما تركته لها", en: "What you left her" },
  letterFooter: {
    ar: "مقفلة الآن. تصلها بعد التحقق من الوفاة ومن هويتها.",
    en: "Locked for now. It reaches her once the death and her identity are verified.",
  },
} as const satisfies Dictionary
