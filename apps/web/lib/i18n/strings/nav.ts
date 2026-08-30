import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The nav bar's labels, and the shell's.
 *
 * `config/nav.ts` indexes this dictionary by key rather than carrying copy of
 * its own, so adding a nav item without adding both languages fails the build
 * instead of shipping an English label into an Arabic bar.
 */
export const NAV = {
  appName: { ar: "وصيّة", en: "Wassiya" },
  skipToContent: { ar: "تخطَّ إلى المحتوى", en: "Skip to content" },
  openMenu: { ar: "افتح القائمة", en: "Open the menu" },
  closeMenu: { ar: "أغلق القائمة", en: "Close the menu" },

  groupOverview: { ar: "البداية", en: "Start" },
  home: { ar: "الرئيسية", en: "Home" },

  // The heir's side. "بلاغاتي" rather than "مطالباتي": a claim here is a report
  // someone files about a death, not a demand against an estate.
  groupHeir: { ar: "ما تركوه لك", en: "Left to you" },
  claims: { ar: "بلاغاتي", en: "My reports" },
  newClaim: { ar: "بلاغ جديد", en: "New report" },
  box: { ar: "صندوقي", en: "My box" },

  // The guardian's side.
  groupGuardian: { ar: "وصايتك", en: "Your guardianship" },
  guardian: { ar: "ما هو مطلوب", en: "What needs you" },
  guardianKey: { ar: "مفتاحي", en: "My key" },

  groupAccount: { ar: "حسابك", en: "Your account" },
  notifications: { ar: "الإشعارات", en: "Notifications" },
  account: { ar: "الحساب", en: "Account" },

  /** The bell's unread badge, capped — counting past ten is waste. */
  unreadMany: { ar: "٩+", en: "9+" },

  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  language: { ar: "اللغة", en: "Language" },
} as const satisfies Dictionary
