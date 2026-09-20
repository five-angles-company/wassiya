import type { Dictionary } from "@/lib/i18n/locale"

/** ٩.٣ from the console's side — the append-only record. */
export const AUDIT = {
  pageTitle: { ar: "سجل التدقيق", en: "Audit log" },

  // Says what the log is for and what it will not do, because a compliance
  // record that could be edited would not be one.
  intro: {
    ar: "سجل غير قابل للتعديل: لا تملك هذه اللوحة — ولا أي دالة في الخادم — طريقة لتغيير سطر أو حذفه. يُعرض اسم الحدث كما سُجّل تماماً.",
    en: "Append-only. Neither this console nor any function on the deployment can edit or delete a line. Event names are shown exactly as recorded.",
  },

  colEvent: { ar: "الحدث", en: "Event" },
  colSubject: { ar: "الحساب", en: "Account" },
  colActor: { ar: "من نفّذ", en: "Done by" },
  filterActor: { ar: "أفعال موظّف", en: "One staff member" },
  actorNotice: {
    ar: "يبدأ عمود «من نفّذ» من يوم تفعيل الأدوار. ما قبله يحمل منفّذه داخل التفاصيل ولا يمكن الترشيح به — السجلّ لا يُعدَّل بأثر رجعي.",
    en: "The “Done by” column starts the day roles were switched on. Older rows carry their actor inside the details and cannot be filtered by it — the log is never rewritten.",
  },
  clearActor: { ar: "كل الأفعال", en: "Everyone" },
  colMeta: { ar: "التفاصيل", en: "Details" },
  colAt: { ar: "الوقت", en: "When" },

  searchPlaceholder: { ar: "ابحث بالحساب…", en: "Search by account…" },
  filterDomain: { ar: "المجال", en: "Area" },

  empty: { ar: "لا سجلات", en: "No entries" },
  emptyHint: {
    ar: "لا شيء مطابق لهذه التصفية.",
    en: "Nothing matches this filter.",
  },
} as const satisfies Dictionary
