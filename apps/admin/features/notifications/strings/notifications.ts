import type { Dictionary } from "@/lib/i18n/locale"

/** ٣.٣ from the console's side — what owners were told inside the app. */
export const NOTIFICATIONS = {
  pageTitle: { ar: "الإشعارات", en: "Notifications" },

  // Names its pair. The two together answer the question neither answers
  // alone, which is why both screens exist.
  intro: {
    ar: "ما ظهر للمالك داخل التطبيق — مقابل «البريد الصادر» الذي يسجّل ما خرج بالبريد. السؤال «هل وصل هذا الشخص أي خبر؟» لا يُجاب إلا بالاثنين معاً.",
    en: "What an owner saw inside the app — the pair to Outbound email, which records what left by mail. \"Did this person hear from us at all?\" is only answerable with both.",
  },

  colKind: { ar: "النوع", en: "Kind" },
  colRecipient: { ar: "المستلم", en: "Recipient" },
  colPayload: { ar: "التفاصيل", en: "Details" },
  colRead: { ar: "الحالة", en: "State" },
  colAt: { ar: "الوقت", en: "When" },

  searchPlaceholder: { ar: "ابحث بالمستلم…", en: "Search by recipient…" },
  filterDomain: { ar: "المجال", en: "Area" },
  filterRead: { ar: "الحالة", en: "State" },

  read: { ar: "مقروء", en: "Read" },
  unread: { ar: "غير مقروء", en: "Unread" },

  empty: { ar: "لا إشعارات", en: "No notifications" },
  emptyHint: {
    ar: "لا شيء مطابق لهذه التصفية.",
    en: "Nothing matches this filter.",
  },
} as const satisfies Dictionary
