import type { Dictionary } from "@/lib/i18n/locale"

/** Death reports that matched no vault — the typo queue. */
export const UNMATCHED = {
  pageTitle: { ar: "بلاغات بلا خزنة", en: "Unmatched reports" },

  // Says what the queue is and why it has a deadline. An operator who does not
  // know that these close themselves would treat it as a backlog rather than
  // as a queue.
  intro: {
    ar: "بلاغات وفاة لم تطابق أي خزنة — غالباً خطأ في رقم الهوية أو البريد، أو وثيقة غير التي وثّق بها صاحب الخزنة هويته. من يُربط بالخزنة الصحيحة يكمل مساره كأنه طابق من البداية، وما لا يُربط تُغلقه المهمة المجدولة بعد المهلة.",
    en: "Death reports that matched no vault — usually a typo in the ID number or email, or a different document from the one the owner verified with. Linked to the right vault, a report carries on as if it had matched; left alone, the scheduled job closes it after the grace window.",
  },

  colTyped: { ar: "ما أُدخل", en: "Entered" },
  withIdNumber: { ar: "ومعه رقم هوية", en: "Plus an ID number" },
  openReport: { ar: "افتح البلاغ", en: "Open report" },
  colClaimant: { ar: "المُبلِّغ", en: "Filed by" },
  colCertificate: { ar: "الشهادة", en: "Certificate" },
  colSubmitted: { ar: "تاريخ البلاغ", en: "Filed" },
  colActions: { ar: "إجراءات", en: "Actions" },

  none: { ar: "—", en: "—" },
  searchPlaceholder: {
    ar: "ابحث في البريد المكتوب",
    en: "Search the typed address",
  },

  empty: { ar: "لا بلاغات بلا خزنة", en: "No unmatched reports" },
  emptyHint: {
    ar: "كل بلاغ وصل طابق خزنة. هذه هي الحالة الطبيعية.",
    en: "Every report that arrived matched a vault. This is the normal state.",
  },

  // The repair.
  link: { ar: "اربط بخزنة", en: "Link a vault" },
  linkTitle: { ar: "ربط البلاغ بخزنة", en: "Link this report to a vault" },
  linkBody: {
    ar: "كُتب «{typed}». ابحث عن صاحب الخزنة المقصود واخترهـ ليكمل البلاغ مساره المعتاد.",
    en: '"{typed}" was typed. Find the vault owner who was meant and pick them, and the report carries on through its ordinary path.',
  },
  linkBodyNoEmail: {
    ar: "أُدخل رقم هوية لم يطابق أي خزنة. اقرأ الشهادة من صفحة البلاغ، ثم ابحث عن صاحب الخزنة واختره.",
    en: "An ID number was entered that matched no vault. Read the certificate on the report's page, then find the vault owner and pick them.",
  },
  // The one-way rule, said where it matters rather than discovered as an error.
  linkOnce: {
    ar: "الربط لا يُعكس: البلاغ يُربط بخزنة واحدة ولا يُنقل بعدها.",
    en: "Linking cannot be undone: a report attaches to one vault and is never moved after.",
  },
  linkSearch: { ar: "ابحث بالاسم أو البريد", en: "Search by name or email" },
  linkNoResults: { ar: "لا حساب مطابق", en: "No matching account" },
  linkHintShort: {
    ar: "اكتب حرفين على الأقل.",
    en: "Type at least two characters.",
  },
  linkConfirm: { ar: "اربط", en: "Link" },
  cancel: { ar: "إلغاء", en: "Cancel" },

  toastLinked: { ar: "رُبط البلاغ بالخزنة", en: "Report linked" },
  toastFailed: { ar: "تعذّر ربط البلاغ", en: "Could not link the report" },
} as const satisfies Dictionary
