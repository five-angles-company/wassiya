import type { Dictionary } from "@/lib/i18n/locale"

/** The two hourly crons, and whether they are alive. */
export const JOBS = {
  pageTitle: { ar: "المهام المجدولة", en: "Scheduled jobs" },

  intro: {
    ar: "تُسجَّل كل دورة، حتى التي لا تجد شيئاً — لأن «هادئة» و«متوقفة» تبدوان متطابقتين بدون ذلك.",
    en: "Every pass is recorded, including the ones that find nothing — because without that, \"quiet\" and \"stopped\" look identical.",
  },

  jobCheckinSweep: { ar: "تصعيد التحقق من الحياة", en: "Check-in escalation" },
  jobClaimsAdvance: { ar: "تقديم طلبات الوراثة", en: "Advance death claims" },

  lastRun: { ar: "آخر دورة", en: "Last run" },
  lastChange: { ar: "آخر تغيير", en: "Last change" },
  scanned: { ar: "فُحص {n}", en: "{n} scanned" },
  changed: { ar: "غُيّر {n}", en: "{n} changed" },
  rescheduled: { ar: "دفعة ممتلئة — أُعيدت الجدولة", en: "Full batch — rescheduled" },

  never: { ar: "لم تُسجَّل أي دورة", en: "No run recorded" },
  neverHint: {
    ar: "إمّا أنها لم تعمل منذ إضافة التسجيل، أو أن اسمها تغيّر. لا يعني هذا أنها متوقفة بالضرورة.",
    en: "Either it has not run since recording was added, or its name changed. It does not necessarily mean it has stopped.",
  },
  noChangeYet: { ar: "لا تغيير في الدورات المعروضة", en: "No change in the runs shown" },
  noChangeHint: {
    ar: "كل الدورات المعروضة ({n}) لم تغيّر شيئاً. قد يكون التغيير الأخير أقدم من النافذة.",
    en: "All {n} runs shown changed nothing. The last change may simply be older than this window.",
  },

  runsTitle: { ar: "آخر الدورات", en: "Recent runs" },
  colRanAt: { ar: "الوقت", en: "When" },
  colScanned: { ar: "فُحص", en: "Scanned" },
  colChanged: { ar: "غُيّر", en: "Changed" },
} as const satisfies Dictionary
