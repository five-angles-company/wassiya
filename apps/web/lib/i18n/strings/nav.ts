import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The shell: the bar across the top and the columns at the bottom.
 *
 * **The top bar carries tasks; the footer carries documents.** Four links up
 * there, all of them something a reader might be trying to *do*. Terms and
 * privacy are things they might need to *read*, and belong at the bottom where
 * documents live — putting them in the bar would spend two of four slots on
 * text nobody navigates to.
 */
export const NAV = {
  skipToContent: { ar: "تخطَّ إلى المحتوى", en: "Skip to content" },
  openMenu: { ar: "القائمة", en: "Menu" },
  home: { ar: "الرئيسية", en: "Home" },

  fileClaim: { ar: "طلب وراثة", en: "File a claim" },
  guardian: { ar: "أنا وصي", en: "I'm a guardian" },
  security: { ar: "الأمان", en: "Security" },
  help: { ar: "مساعدة", en: "Help" },

  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
  /** The bar is tight on a 390px screen; the board drops the verb. */
  signInShort: { ar: "دخول", en: "Sign in" },
  myAccount: { ar: "حسابي", en: "My account" },

  footerService: { ar: "الخدمة", en: "Service" },
  footerLegal: { ar: "قانوني", en: "Legal" },
  footerSupport: { ar: "الدعم", en: "Support" },

  resume: { ar: "متابعة طلب سابق", en: "Resume a claim" },
  terms: { ar: "الشروط", en: "Terms" },
  privacy: { ar: "الخصوصية", en: "Privacy" },
  encryption: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
  contact: { ar: "تواصل معنا", en: "Contact us" },

  disclaimer: {
    ar: "وصيّة ليست جهة قانونية ولا تقسّم التركات.",
    en: "Wassiya is not a legal authority and does not divide estates.",
  },
} as const satisfies Dictionary
