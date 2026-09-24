import type { Dictionary } from "@/lib/i18n/locale"

/** The shell: header, footer and the account menu. */
export const NAV = {
  appName: { ar: "وصيّة", en: "Wassiya" },
  skipToContent: { ar: "تخطَّ إلى المحتوى", en: "Skip to content" },

  home: { ar: "الرئيسية", en: "Home" },
  reportDeath: { ar: "أبلغ عن وفاة", en: "Report a death" },
  help: { ar: "المساعدة", en: "Help" },
  writeToUs: { ar: "راسلنا", en: "Write to us" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  account: { ar: "حسابي", en: "My account" },
  // Clerk's own modal — email, sign-in methods, second factor — named for
  // what it holds, so it never reads as a second "account" row.
  security: { ar: "الدخول والأمان", en: "Sign-in & security" },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  openMenu: { ar: "حسابك", en: "Your account" },
  mainNav: { ar: "التنقّل الرئيسي", en: "Main navigation" },

  footerFamilies: { ar: "للعائلات", en: "For families" },
  footerLegal: { ar: "قانوني", en: "Legal" },
  footerAbout: { ar: "وصيّة", en: "Wassiya" },
  aboutSite: { ar: "عن وصيّة", en: "About Wassiya" },
  getApp: { ar: "حمّل التطبيق", en: "Get the app" },
  terms: { ar: "شروط الاستخدام", en: "Terms of use" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  encryption: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
  // The same sentence as mobile's `LEGAL.notLegal` and the landing footer:
  // the product's most important legal statement, repeated wherever a reader
  // already is.
  notLegal: {
    ar: "وصيّة ليست جهة قانونية ولا تقسّم التركات. الأنصبة يحدّدها القانون وفق الفرائض.",
    en: "Wassiya is not a legal authority and does not divide estates. Shares are set by law under the fara'id.",
  },
  copyright: { ar: "© {year} وصيّة", en: "© {year} Wassiya" },
} as const satisfies Dictionary
