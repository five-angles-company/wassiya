import type { Dictionary } from "@/lib/i18n/locale"

/** What the system sent, to whom, and when. */
export const EMAIL_LOG = {
  pageTitle: { ar: "البريد الصادر", en: "Outbound email" },

  // Says what the log holds and what it deliberately does not.
  intro: {
    ar: "يسجّل نوع الرسالة ومستلمها ووقتها — لا نصّها. إشعار التصعيد حقيقة عن حياة شخص، والسجل غير قابل للتعديل ويقرؤه فريق المراجعة.",
    en: "Records the kind of message, its recipient and the time — never its text. An escalation notice is a fact about someone's life, and this log is append-only and read by staff.",
  },

  colKind: { ar: "النوع", en: "Kind" },
  colRecipient: { ar: "المستلم", en: "Recipient" },
  colSentAt: { ar: "الوقت", en: "Sent" },
  colActions: { ar: "إجراءات", en: "Actions" },

  searchPlaceholder: { ar: "ابحث بالمستلم…", en: "Search by recipient…" },

  // The `what` labels `send()` passes, in the operator's language.
  kindEscalation: { ar: "تصعيد التحقق من الحياة", en: "Check-in escalation" },
  kindRecovery: { ar: "تنبيه الاسترداد", en: "Recovery alert" },
  kindDeliveryReady: { ar: "تسليم جاهز", en: "Delivery ready" },
  kindDeliveryExpiring: { ar: "تسليم يقترب من الإغلاق", en: "Delivery closing soon" },

  // Only sends recorded since the log started exist. Said once, at the top,
  // so an empty screen is not read as "nothing was ever sent".
  since: {
    ar: "يبدأ السجل من اللحظة التي أضيف فيها التسجيل — الرسائل الأقدم لم تُسجَّل.",
    en: "The log starts when recording was added. Anything sent before that left no trace.",
  },

  // The louder empty state. An unset `RESEND_FROM` means `send()` returns
  // early: no mail, and by design no row — so silence here is not calm.
  mailerOffTitle: {
    ar: "لا يوجد مُرسِل بريد مُهيّأ",
    en: "No mailer is configured",
  },
  mailerOffBody: {
    ar: "‏RESEND_FROM غير مضبوط على هذا النشر، فلا تُرسَل أي رسالة — بما فيها تنبيهات التصعيد. السجل فارغ لأن شيئاً لم يخرج، لا لأن شيئاً لم يُطلب.",
    en: "RESEND_FROM is not set on this deployment, so nothing is sent at all — escalation notices included. The log is empty because nothing left, not because nothing was asked for.",
  },

  empty: { ar: "لا رسائل مسجّلة", en: "No recorded messages" },
  emptyHint: {
    ar: "لم تُرسل رسالة منذ بدء التسجيل، أو لا شيء يطابق التصفية.",
    en: "Nothing has been sent since recording began, or nothing matches the filter.",
  },
  openMenu: { ar: "افتح القائمة", en: "Open menu" },
  actionOpenOwner: { ar: "افتح حساب المستلم", en: "Open the recipient's account" },
} as const satisfies Dictionary
