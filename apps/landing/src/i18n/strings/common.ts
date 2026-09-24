import type { Dictionary } from "@/i18n/locale"

export const COMMON = {
  appName: { ar: "وصيّة", en: "Wassiya" },
  skipToContent: { ar: "تخطَّ إلى المحتوى", en: "Skip to content" },
  /** Named in the language it switches to, so a reader can always find it. */
  switchLanguage: { ar: "English", en: "العربية" },
  download: { ar: "حمّل التطبيق", en: "Get the app" },

  navHow: { ar: "كيف تعمل", en: "How it works" },
  navSecurity: { ar: "الخصوصية", en: "Privacy" },
  navPlans: { ar: "الخطط", en: "Plans" },
  navFaq: { ar: "أسئلة", en: "Questions" },

  appStoreAlt: { ar: "حمّل من App Store", en: "Download on the App Store" },
  playStoreAlt: { ar: "احصل عليه من Google Play", en: "Get it on Google Play" },
  storesSoon: {
    ar: "قريباً على App Store وGoogle Play",
    en: "Coming soon to the App Store and Google Play",
  },

  // The same sentence as mobile's `LEGAL.notLegal`: the product's most
  // important legal statement, repeated wherever a reader already is.
  notLegal: {
    ar: "وصيّة ليست جهة قانونية ولا تقسّم التركات. الأنصبة يحدّدها القانون وفق الفرائض.",
    en: "Wassiya is not a legal authority and does not divide estates. Shares are set by law under the fara'id.",
  },
  terms: { ar: "شروط الاستخدام", en: "Terms of use" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  encryption: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
  help: { ar: "المساعدة", en: "Help" },
  reportDeath: { ar: "أبلغ عن وفاة", en: "Report a death" },
  footerProduct: { ar: "وصيّة", en: "Wassiya" },
  footerLegal: { ar: "قانوني", en: "Legal" },
  footerHelp: { ar: "للعائلات", en: "For families" },
  cookieSettings: { ar: "إعدادات التتبّع", en: "Cookie settings" },
  copyright: { ar: "© {year} وصيّة", en: "© {year} Wassiya" },
} as const satisfies Dictionary
