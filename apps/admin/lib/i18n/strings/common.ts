import type { Dictionary } from "@/lib/i18n/locale"

/** Chrome shared by every screen: the shell, the gates, the toggles. */
export const COMMON = {
  appName: { ar: "وصيّة", en: "Wassiya" },
  consoleName: { ar: "لوحة الإدارة", en: "Admin console" },

  // The role gate. Worded as a fact about this account rather than an
  // accusation — the likeliest reader is a colleague whose row simply has not
  // been edited yet, not an intruder.
  notAuthorisedTitle: {
    ar: "هذا الحساب ليس حساب مراجعة",
    en: "Not a reviewer account",
  },
  notAuthorisedBody: {
    ar: "لوحة الإدارة مفتوحة لحسابات المراجعة فقط. صلاحية المراجعة تُمنح من لوحة Convex مباشرةً، ولا يوجد زر يمنحها — وهذا مقصود.",
    en: "The console is open to reviewer accounts only. The reviewer role is set directly in the Convex dashboard; there is deliberately no button that grants it.",
  },

  signedInAs: { ar: "مسجّل الدخول باسم", en: "Signed in as" },
  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  // The refusal panel renders instead of the whole shell, so the sidebar's
  // UserButton is not on screen. Without this line there is no way out of the
  // wrong account except clearing cookies by hand.
  signOutHint: {
    ar: "إن كان لديك حساب مراجعة آخر، سجّل الخروج ثم ادخل به.",
    en: "If you have another reviewer account, sign out and use that one.",
  },
  checkingSession: { ar: "جارٍ التحقق من الجلسة…", en: "Checking session…" },

  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "العربية" },
  english: { ar: "English", en: "English" },
  theme: { ar: "المظهر", en: "Theme" },
  themeLight: { ar: "فاتح", en: "Light" },
  themeDark: { ar: "داكن", en: "Dark" },

  toggleSidebar: { ar: "إظهار القائمة", en: "Toggle sidebar" },
  comingSoon: { ar: "قريباً", en: "Soon" },

  // Shared rather than owned by a feature: two features render a five-row
  // preview of a longer list, and a string both need was never feature-specific.
  // It also says the difference between "there are five" and "here are five of
  // many", which every preview table on this console has to say.
  showingOf: {
    ar: "تعرض {n} من {total}.",
    en: "Showing {n} of {total}.",
  },
} as const satisfies Dictionary
