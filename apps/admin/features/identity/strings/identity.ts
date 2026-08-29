import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٱلتحقق من الهوية — the Didit verification queue.
 *
 * The four state labels are **not** here: three screens share them, so they
 * live in `lib/i18n/strings/identity-status.ts`.
 */
export const IDENTITY = {
  pageTitle: { ar: "التحقق من الهوية", en: "Identity verification" },

  colOwner: { ar: "المالك", en: "Owner" },
  colStatus: { ar: "الحالة", en: "Status" },
  colAttempts: { ar: "المحاولات", en: "Attempts" },
  colVerifiedName: { ar: "الاسم الموثّق", en: "Verified name" },
  colDocType: { ar: "المستند", en: "Document" },
  colVerifiedAt: { ar: "تاريخ التوثيق", en: "Verified" },
  colJoined: { ar: "تاريخ التسجيل", en: "Joined" },
  colActions: { ar: "إجراءات", en: "Actions" },

  // Says what the box does, because it does less than a search box implies:
  // `users` has an equality index on email and no full-text index, so a
  // partial address or a name matches nothing at all.
  searchPlaceholder: { ar: "ابحث بالبريد كاملاً…", en: "Search by full email…" },

  filterStuck: { ar: "المحاولات", en: "Attempts" },
  stuckOnly: { ar: "استنفد المحاولات", en: "Out of attempts" },
  stuckBadge: { ar: "متوقف", en: "Stuck" },

  nameNone: { ar: "بلا اسم", en: "No name" },
  none: { ar: "—", en: "—" },

  // Not "nobody is waiting" — that read the table as the pending queue, which
  // it was only while `pending`/`rejected` were preselected. Nothing is
  // preselected now, so an empty table means the filter matched nothing.
  empty: { ar: "لا حسابات", en: "No accounts" },
  emptyHint: {
    ar: "لا توجد حسابات مطابقة لهذه التصفية.",
    en: "No accounts match this filter.",
  },

  openMenu: { ar: "افتح القائمة", en: "Open menu" },
  actionCopyEmail: { ar: "انسخ البريد", en: "Copy email" },

  // -- The one action ------------------------------------------------------
  reset: { ar: "أعد المحاولات", en: "Reset attempts" },
  resetDialogTitle: { ar: "إعادة محاولات التحقق؟", en: "Reset verification attempts?" },
  // States the limit of what it does, because the tempting misreading is that
  // it verifies someone.
  resetDialogBody: {
    ar: "سيتمكّن {name} من إعادة محاولة التحقق من جديد. هذا لا يوثّق هويته — التوثيق يأتي من مزوّد التحقق وحده، ولا يوجد زر يمنحه.",
    en: "{name} will be able to attempt verification again. This does not verify them — verification comes from the identity provider alone, and there is no button that grants it.",
  },
  resetConfirm: { ar: "أعد المحاولات", en: "Reset attempts" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  toastReset: { ar: "أُعيدت المحاولات", en: "Attempts reset" },
  toastFailed: { ar: "تعذّر تنفيذ الإجراء", en: "That didn't work" },
  // Shown instead of the button where the action would be refused anyway.
  resetNotNeeded: { ar: "لا حاجة", en: "Not needed" },
} as const satisfies Dictionary
