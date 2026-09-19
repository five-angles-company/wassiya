import type { Dictionary } from "@/lib/i18n/locale"

/** ٦.٤ from the console's side — the dead man's switch, per owner. */
export const CHECKINS = {
  pageTitle: { ar: "التحقق من الحياة", en: "Life check-ins" },

  colOwner: { ar: "المالك", en: "Owner" },
  colState: { ar: "الرتبة", en: "Rung" },
  colCadence: { ar: "الدورية", en: "Cadence" },
  colDue: { ar: "الموعد التالي", en: "Next due" },
  colOverdue: { ar: "التأخير", en: "Overdue" },
  colConfirmed: { ar: "آخر تأكيد", en: "Last confirmed" },

  searchPlaceholder: { ar: "ابحث باسم المالك أو بريده…", en: "Search by owner name or email…" },
  filterState: { ar: "الرتبة", en: "Rung" },

  cadence: { ar: "كل {n} شهر", en: "Every {n} months" },
  overdueBy: { ar: "متأخر {n} يوماً", en: "{n} days overdue" },
  dueIn: { ar: "بعد {n} يوماً", en: "in {n} days" },
  dueToday: { ar: "اليوم", en: "Today" },

  empty: { ar: "لا أحد متأخر", en: "Nobody is overdue" },
  emptyHint: {
    ar: "لا توجد حسابات مطابقة لهذه التصفية.",
    en: "No accounts match this filter.",
  },
  openMenu: { ar: "افتح القائمة", en: "Open menu" },
  actionOpenOwner: { ar: "افتح حساب المالك", en: "Open the owner's account" },
  colActions: { ar: "إجراءات", en: "Actions" },
} as const satisfies Dictionary
