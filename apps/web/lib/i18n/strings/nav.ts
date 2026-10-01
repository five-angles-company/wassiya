import type { Dictionary } from "@/lib/i18n/locale"

/** The page title, the skip link and the account menu. The header and footer copy is shared (`@workspace/ui/lib/site`). */
export const NAV = {
  appName: { ar: "وصيّة", en: "Wassiya" },
  description: {
    ar: "للإبلاغ عن وفاة شخص استخدم وصيّة، ولأوصيائه ليستلموا ما سُلِّم إليهم.",
    en: "Report the death of someone who used Wassiya, or receive what they handed over to you as their executor.",
  },
  skipToContent: { ar: "تخطَّ إلى المحتوى", en: "Skip to content" },

  notifications: { ar: "الإشعارات", en: "Notifications" },
  account: { ar: "حسابي", en: "My account" },
  // Clerk's own modal — email, sign-in methods, second factor — named for
  // what it holds, so it never reads as a second "account" row.
  security: { ar: "الدخول والأمان", en: "Sign-in & security" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  openMenu: { ar: "حسابك", en: "Your account" },
} as const satisfies Dictionary
