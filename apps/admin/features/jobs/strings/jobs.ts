import type { Dictionary } from "@/lib/i18n/locale"

/** The four crons, and whether they are alive. */
export const JOBS = {
  pageTitle: { ar: "المهام المجدولة", en: "Scheduled jobs" },

  intro: {
    ar: "تُسجَّل كل دورة، حتى التي لا تجد شيئاً — لأن «هادئة» و«متوقفة» تبدوان متطابقتين بدون ذلك.",
    en: "Every pass is recorded, including the ones that find nothing — because without that, \"quiet\" and \"stopped\" look identical.",
  },

  jobCheckinSweep: { ar: "تصعيد التحقق من الحياة", en: "Check-in escalation" },
  jobClaimsAdvance: { ar: "تقديم طلبات الوراثة", en: "Advance death claims" },
  jobClaimsUnmatched: { ar: "إغلاق الطلبات بلا خزنة", en: "Close unmatched claims" },
  jobDeliveriesExpire: { ar: "إتلاف التسليمات المنتهية", en: "Expire deliveries" },

  lastRun: { ar: "آخر دورة", en: "Last run" },
  lastChange: { ar: "آخر تغيير", en: "Last change" },
  scanned: { ar: "فُحص {n}", en: "{n} scanned" },
  changed: { ar: "غُيّر {n}", en: "{n} changed" },
  rescheduled: { ar: "دفعة ممتلئة", en: "Full batch" },
  rescheduledFull: {
    ar: "امتلأت الدفعة، فجُدولت دورة أخرى فوراً",
    en: "The batch filled, so another pass was queued immediately",
  },

  // The health line. A job's age is only meaningful against its own schedule:
  // six hours is a failure for an hourly sweep and unremarkable for a daily
  // one, so the cadence comes from the server and the label states it rather
  // than assuming the reader knows.
  hourly: { ar: "كل ساعة", en: "Hourly" },
  daily: { ar: "كل يوم", en: "Daily" },
  ranAgo: { ar: "آخر دورة {ago}", en: "Last run {ago}" },
  healthFresh: { ar: "تعمل", en: "Running" },
  healthLate: { ar: "تأخّرت", en: "Late" },
  healthStale: { ar: "متوقفة على الأرجح", en: "Likely stopped" },
  healthLateHint: {
    ar: "مضى على آخر دورة مسجّلة أكثر من جدولها.",
    en: "More than its own schedule has passed since the last recorded pass.",
  },

  // Running a sweep by hand. Every job here acts only on rows whose deadline
  // has already passed, so this can retry a missed pass but can never bring
  // anything forward — which is the only reason a button is acceptable.
  run: { ar: "شغّلها الآن", en: "Run now" },
  runTitle: { ar: "تشغيل المهمة الآن", en: "Run this job now" },
  runBody: {
    ar: "تُجدول «{job}» فوراً. تعالج المهمة ما انقضى موعده فقط، فلا تُقدّم شيئاً قبل أوانه. ستظهر الدورة في الجدول بعد لحظات.",
    en: "Queues \"{job}\" immediately. The job only acts on what is already past its deadline, so nothing is brought forward. The pass appears in the table a moment later.",
  },
  runQueued: { ar: "جُدولت المهمة", en: "Job queued" },
  runFailed: { ar: "تعذّر تشغيل المهمة", en: "Could not run the job" },
  cancel: { ar: "إلغاء", en: "Cancel" },

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

  // The job table's own columns. One row per cron, its run history behind it.
  colJob: { ar: "المهمة", en: "Job" },
  colSchedule: { ar: "الجدول", en: "Schedule" },
  colHealth: { ar: "الحالة", en: "State" },
  colLastRun: { ar: "آخر دورة", en: "Last run" },
  colLastChange: { ar: "آخر تغيير", en: "Last change" },
  colActions: { ar: "إجراءات", en: "Actions" },

  searchPlaceholder: { ar: "ابحث باسم المهمة", en: "Search by job" },
  empty: { ar: "لا مهام مسجّلة", en: "No jobs registered" },
  emptyHint: {
    ar: "لم تُسجَّل أي مهمة في crons.ts.",
    en: "No cron is registered in crons.ts.",
  },

  sheetTitle: { ar: "دورات {job}", en: "{job} runs" },
  sheetBody: {
    ar: "آخر {n} دورة مسجّلة، الأحدث أولاً.",
    en: "The last {n} recorded passes, newest first.",
  },
} as const satisfies Dictionary
