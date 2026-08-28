import type { Dictionary } from "@/lib/i18n/locale"

/**
 * Chrome for every table on the console.
 *
 * Shared rather than feature-owned: a pager reading "Next" in one workspace and
 * "Forward" in another is the sort of drift a per-feature copy invites, and
 * none of these words are about claims.
 */
export const DATA_TABLE = {
  search: { ar: "ابحث…", en: "Search…" },
  clearSearch: { ar: "امسح البحث", en: "Clear search" },
  columns: { ar: "الأعمدة", en: "Columns" },
  resetFilters: { ar: "أعد الضبط", en: "Reset" },
  filtersApplied: { ar: "عوامل تصفية مفعّلة", en: "Filters applied" },

  // -- The honesty line -----------------------------------------------------
  // The server caps a status page, so the search box searches what was loaded
  // and nothing further. Without this an operator types a name, sees nothing,
  // and concludes no such claim exists — when it is simply past the cap. It
  // sits beside the search box rather than under the table for that reason.
  cappedSearch: {
    ar: "القائمة مقتطعة",
    en: "List truncated",
  },
  cappedSearchHint: {
    ar: "الخادم يعيد {n} سجلاً كحد أقصى. البحث لا يتجاوز ما حُمّل.",
    en: "The server returns at most {n} rows. Search does not reach past what was loaded.",
  },
  // Names the truncated slice. "Some of this is missing" is not actionable;
  // "these two statuses are missing rows" tells an operator where to look.
  cappedSearchDetail: {
    ar: "بلغت هذه الحالات حد {n} سجلاً ولم تُحمَّل بالكامل: {statuses}. البحث لا يتجاوز ما حُمّل.",
    en: "These statuses hit the {n}-row cap and are not fully loaded: {statuses}. Search does not reach past what was loaded.",
  },

  // -- Selection ------------------------------------------------------------
  selectRow: { ar: "اختر الصف", en: "Select row" },
  selectAll: { ar: "اختر كل الصفوف الظاهرة", en: "Select all rows on this page" },
  selectedCount: { ar: "{n} محدّد", en: "{n} selected" },
  clearSelection: { ar: "ألغِ التحديد", en: "Clear" },
  copyIds: { ar: "انسخ المعرّفات", en: "Copy ids" },
  copied: { ar: "تم النسخ", en: "Copied" },
  exportCsv: { ar: "صدّر CSV", en: "Export CSV" },

  // -- Pagination -----------------------------------------------------------
  rowsPerPage: { ar: "لكل صفحة", en: "Rows per page" },
  pageOf: { ar: "صفحة {page} من {total}", en: "Page {page} of {total}" },
  firstPage: { ar: "الصفحة الأولى", en: "First page" },
  previous: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },
  lastPage: { ar: "الصفحة الأخيرة", en: "Last page" },
  rowCount: { ar: "{n} سجلاً", en: "{n} rows" },

  sortAsc: { ar: "تصاعدي", en: "Ascending" },
  sortDesc: { ar: "تنازلي", en: "Descending" },
  noResults: { ar: "لا نتائج مطابقة", en: "No matching results" },
  noResultsHint: {
    ar: "جرّب مصطلحاً أقصر، أو أعد ضبط عوامل التصفية.",
    en: "Try a shorter term, or reset the filters.",
  },
} as const satisfies Dictionary
