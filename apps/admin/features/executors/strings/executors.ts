import type { Dictionary } from "@/lib/i18n/locale"

/** الأوصياء, across every account. */
export const EXECUTORS = {
  pageTitle: { ar: "الأوصياء", en: "Executors" },

  colExecutor: { ar: "الوصي", en: "Executor" },
  colPhone: { ar: "الهاتف", en: "Phone" },
  colEmail: { ar: "البريد", en: "Email" },
  colOwner: { ar: "المالك", en: "Owner" },
  colSheet: { ar: "ورقة الوصي", en: "Executor sheet" },
  colAdded: { ar: "أُضيف", en: "Added" },

  sheetPrinted: {
    ar: "طُبعت {date} · الإصدار {version}",
    en: "Printed {date} · version {version}",
  },
  sheetNone: { ar: "لا ورقة", en: "No sheet" },

  filterSheet: { ar: "الورقة", en: "Sheet" },
  withoutSheetOnly: { ar: "بلا ورقة فقط", en: "Without a sheet only" },

  empty: { ar: "لا أوصياء", en: "No executors" },
  emptyHint: {
    ar: "لم يُسمِّ أي مالك وصياً مطابقاً لهذه التصفية.",
    en: "No owner has named an executor matching this filter.",
  },

  // Names the owner, because that is what the search matches.
  searchPlaceholder: {
    ar: "ابحث باسم المالك أو بريده…",
    en: "Search by owner name or email…",
  },
} as const satisfies Dictionary
