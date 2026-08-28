import type { Dictionary } from "@/lib/i18n/locale"

/** ٦.٢ from the console's side — who guards whom, and whether it works. */
export const GUARDIANS = {
  pageTitle: { ar: "الأوصياء", en: "Guardians" },

  colOwner: { ar: "المالك", en: "Owner" },
  colGuardian: { ar: "الوصي", en: "Guardian" },
  colRelation: { ar: "الصلة", en: "Relation" },
  colState: { ar: "الحالة", en: "State" },
  colExpires: { ar: "تنتهي الدعوة", en: "Invitation expires" },
  colInvited: { ar: "تاريخ الدعوة", en: "Invited" },
  colActions: { ar: "إجراءات", en: "Actions" },

  // The five derived states. `live` and `expired` are the two the raw status
  // cannot express, and they are the two worth acting on.
  stateLive: { ar: "فعّال", en: "Live" },
  stateAccepted: { ar: "قبل، بلا مفتاح", en: "Accepted, no key" },
  stateInvited: { ar: "بانتظار القبول", en: "Awaiting acceptance" },
  stateExpired: { ar: "انتهت الدعوة", en: "Invitation expired" },
  stateRevoked: { ar: "مُلغى", en: "Revoked" },

  nameNone: { ar: "بلا اسم", en: "No name" },
  expiredOn: { ar: "انتهت {date}", en: "Expired {date}" },

  // The banner. States the cause, because a console full of expired invitations
  // otherwise reads as owners ignoring their guardians.
  webPendingTitle: {
    ar: "لا يمكن قبول الدعوات بعد",
    en: "Invitations cannot be accepted yet",
  },
  webPendingBody: {
    ar: "يقبل الأوصياء دعواتهم من تطبيق الويب، وهو لم يُطلق بعد. كل دعوة تنتهي خلال سبعة أيام، لذا يُتوقع أن تكون معظم الصفوف هنا منتهية — وليس تجاهلاً من المالكين.",
    en: "Guardians accept in the web app, which has not shipped. Every invitation expires in seven days, so most rows here are expected to be expired — this is not owners ignoring them.",
  },

  empty: { ar: "لا أوصياء", en: "No guardians" },
  emptyHint: {
    ar: "لم يعيّن أي مالك وصياً مطابقاً لهذه التصفية.",
    en: "No owner has appointed a guardian matching this filter.",
  },

  openMenu: { ar: "افتح القائمة", en: "Open menu" },
  actionCopyOwnerEmail: { ar: "انسخ بريد المالك", en: "Copy owner's email" },

  // Shown when the scan cap is hit. Guardians are bounded by owners rather
  // than by traffic, so this should stay theoretical for a long time.
  cappedTitle: { ar: "القائمة مقتطعة", en: "List truncated" },
  cappedBody: {
    ar: "تعرض أول {n} صف. ضيّق بالحالة للوصول إلى الباقي.",
    en: "Showing the first {n} rows. Narrow by state to reach the rest.",
  },
} as const satisfies Dictionary
