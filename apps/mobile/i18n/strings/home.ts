/**
 * ٣ — الرئيسية، القفل، والإشعارات. The app's resting state.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٣.١ — the home dashboard. */
export const HOME = {
  // Home opens with a time-of-day greeting and the first name only.
  greetMorning: { ar: "صباح الخير", en: "Good morning" },
  greetAfternoon: { ar: "مساء الخير", en: "Good afternoon" },
  greetEvening: { ar: "مساء الخير", en: "Good evening" },

  // -- The check-in hero -----------------------------------------------------
  checkinConfirmed: {
    ar: "آخر تأكيد: {last} · التالي: {next}",
    en: "Last confirmed {last} · next {next}",
  },
  checkinDue: { ar: "حان وقت التأكيد", en: "It's time to confirm" },
  checkinOverdue: {
    ar: "تأخّر التأكيد. بدأ التنبيه يتصاعد.",
    en: "Overdue. Escalation has started.",
  },
  // -- Still to do, and the vault at a glance ---------------------------
  todoTitle: { ar: "بقي عليك", en: "Still to do" },
  todoIdentity: { ar: "أكمل التحقق من هويتك", en: "Finish verifying your identity" },
  todoSheet: { ar: "اطبع وثيقة الاسترداد", en: "Print your recovery sheet" },
  todoExecutors: { ar: "سمِّ وصيّاً", en: "Name an executor" },
  todoDelivery: { ar: "اطبع ورقة لكل وصيّ", en: "Print a sheet for every executor" },
  yearlyRow: { ar: "راجع أوصياءك — مرّت سنة", en: "Review your executors — it's been a year" },
  overviewTitle: { ar: "خزنتك", en: "Your vault" },
  allReady: { ar: "كل شيء جاهز", en: "Everything is ready" },
  itemAssets: { ar: "الأصول", en: "Assets" },

  itemIdentity: { ar: "الهوية", en: "Identity" },
  itemKey: { ar: "المفتاح", en: "Key" },
  itemSheet: { ar: "الوثيقة", en: "Sheet" },
  itemExecutors: { ar: "الأوصياء", en: "Executors" },
  itemPrivate: { ar: "خاصة", en: "Private" },
  itemDelivery: { ar: "التسليم", en: "Delivery" },

  // The yearly check. Numbers get recycled and paper gets lost; the owner is
  // the only person who can fix either while it still matters.
  contactsTitle: {
    ar: "هل ما زال أوصياؤك على حالهم؟",
    en: "Are your executors still set?",
  },
  contactsBody: {
    ar: "تأكّد أن أرقامهم ما زالت لهم، وأن كل واحد يحتفظ بورقته.",
    en: "Check their numbers are still theirs, and that each still has their sheet.",
  },
  contactsLater: { ar: "لاحقاً", en: "Later" },
  contactsConfirm: { ar: "كل شيء صحيح", en: "All correct" },
  itemCheckin: { ar: "تأكيد الحياة", en: "Life check-in" },
} satisfies LabelSet<string>

/** ٣.٣ — notifications. */
export const NOTIFICATIONS = {
  title: { ar: "الإشعارات", en: "Notifications" },
  markAllRead: { ar: "تحديد كمقروء", en: "Mark as read" },

  // Two bands, never one flat feed.
  needsAttention: { ar: "يحتاج انتباهك", en: "Needs your attention" },
  history: { ar: "هذا الأسبوع", en: "This week" },
  loadMore: { ar: "أظهر المزيد", en: "Show more" },

  empty: { ar: "لا إشعارات", en: "Nothing here" },
  emptyBody: {
    ar: "سنُعلمك هنا بأي محاولة استرداد، أو عند موعد التحقق من الحياة.",
    en: "We'll tell you here about any recovery attempt, or when a check-in is due.",
  },

  // Event copy, keyed by the backend's own event names.
  recoveryAttempt: { ar: "محاولة استرداد من جهاز جديد", en: "Recovery attempt from a new device" },
  recoveryAttemptBody: {
    ar: "إن لم تكن أنت، أوقفها الآن.",
    en: "If this wasn't you, stop it now.",
  },
  wasntMe: { ar: "لم أكن أنا", en: "Wasn't me" },

  checkinDue: { ar: "وقت التحقق من الحياة", en: "Time to check in" },
  checkinDueBody: {
    ar: "تأكيد واحد بالبصمة",
    en: "One confirmation with your fingerprint",
  },
  openCheckin: { ar: "افتح التأكيد", en: "Open check-in" },

  claimSubmitted: { ar: "بلاغ وفاة على حسابك", en: "A death report on your account" },
  claimBlocked: {
    ar: "حُجب بلاغ وفاة",
    en: "An inheritance claim attempt was blocked",
  },
  claimVetoed: { ar: "أُوقف طلب الوراثة", en: "The inheritance claim was stopped" },
  supportReply: { ar: "ردّ فريق الدعم على رسالتك", en: "Support replied to your message" },
  generic: { ar: "تحديث في خزنتك", en: "An update in your vault" },
} satisfies LabelSet<string>
