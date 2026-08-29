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

  // The error boundary. Says what to do, not what went wrong — the reader is a
  // reviewer, and the cases this actually catches (a deployment mid-push, a
  // dropped socket, a role that changed under the session) are all cured by
  // trying again.
  errorTitle: { ar: "تعذّر تحميل هذه الشاشة", en: "This screen did not load" },
  errorBody: {
    ar: "انقطع الاتصال بالخادم أو رُفض الطلب. أعد المحاولة؛ إن تكرّر فالمعرّف أدناه يحدّد الخطأ في السجلات.",
    en: "The request to the server failed or was refused. Try again — if it keeps happening, the reference below identifies it in the logs.",
  },
  errorDigest: { ar: "المرجع", en: "Reference" },
  retry: { ar: "أعد المحاولة", en: "Try again" },

  // A detail route whose id names nothing. Reachable from a stale link out of
  // the audit log, which outlives the accounts it names.
  notFoundTitle: { ar: "لا يوجد سجل بهذا المعرّف", en: "No such record" },
  notFoundBody: {
    ar: "لم يعد هذا المعرّف يشير إلى شيء — إمّا حُذف السجل، أو أن الرابط الذي أوصلك إلى هنا قديم أو غير صحيح.",
    en: "This id no longer points at anything. Either the record is gone, or the link that brought you here is stale or mistyped.",
  },

  // The 404, for a path that matches no route at all — as opposed to a route
  // that exists and holds nothing.
  routeMissingTitle: { ar: "لا توجد صفحة هنا", en: "No page here" },
  routeMissingBody: {
    ar: "هذا المسار لا يقابل أي شاشة في اللوحة.",
    en: "This address does not match any screen in the console.",
  },
  backToDashboard: { ar: "العودة إلى اللوحة", en: "Back to the dashboard" },

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
