import type { Dictionary } from "@/lib/i18n/locale"

/** ٱلورثة, across every account. */
export const HEIRS = {
  pageTitle: { ar: "الورثة", en: "Heirs" },

  colHeir: { ar: "الوارث", en: "Heir" },
  colOwner: { ar: "المالك", en: "Owner" },
  colReceives: { ar: "يستلم", en: "Receives" },
  colAdded: { ar: "أُضيف", en: "Added" },
  colActions: { ar: "إجراءات", en: "Actions" },

  filterRouting: { ar: "التوجيه", en: "Routing" },
  unroutedOnly: { ar: "لا يستلم شيئاً", en: "Receives nothing" },
  // The number an operator is really reading. "3 (1 مشترك)" — direct first,
  // because an heir with only shared routing is a different situation from one
  // the owner picked deliberately.
  receives: { ar: "{n} أصلاً", en: "{n} assets" },
  receivesShared: { ar: "منها {n} بالقاعدة العامة", en: "{n} via the default rule" },
  receivesNothing: { ar: "لا شيء", en: "Nothing" },

  empty: { ar: "لا ورثة", en: "No heirs" },
  emptyHint: {
    ar: "لم يُضف أي مالك وارثاً مطابقاً لهذه التصفية.",
    en: "No owner has added an heir matching this filter.",
  },

  // Names the owner, because that is what it matches. A device is called
  // "iPhone 15" and an heir's row is on their owner's page — the person is the
  // only useful key here, and a generic "Search…" would imply otherwise.
  searchPlaceholder: {
    ar: "ابحث باسم المالك أو بريده…",
    en: "Search by owner name or email…",
  },

  openMenu: { ar: "افتح القائمة", en: "Open menu" },
  actionOpenOwner: { ar: "افتح حساب المالك", en: "Open the owner's account" },

  // The tally counts every heir, not the filtered set — the filter needs two
  // indexed probes per row to evaluate. Labelled so the number is not misread.
  totalLabel: { ar: "إجمالي الورثة", en: "heirs in total" },
} as const satisfies Dictionary
