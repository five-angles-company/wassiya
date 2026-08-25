/**
 * ٣ — الرئيسية، القفل، والإشعارات. The app's resting state.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٣.١ — the home dashboard. */
export const HOME = {
  // The board opens with a time-of-day greeting and the first name only.
  greetMorning: { ar: "صباح الخير", en: "Good morning" },
  greetAfternoon: { ar: "مساء الخير", en: "Good afternoon" },
  greetEvening: { ar: "مساء الخير", en: "Good evening" },

  // -- The verdict -----------------------------------------------------------
  // The question is printed above the answer because most owners have never
  // actually asked it. No pronoun: "لو حدث لك/لكِ" would force a gender the app
  // has no business assuming, and dropping it reads better anyway.
  question: {
    ar: "لو حدث شيء اليوم — هل تصل خزنتك إلى ورثتك؟",
    en: "If something happened today — would your vault reach your heirs?",
  },
  answerReady: {
    ar: "نعم. خزنتك تصل إلى {heirs}.",
    en: "Yes. Your vault reaches {heirs}.",
  },

  // Delivery failures. Each names the consequence, not the missing checkbox:
  // "لم تُضف ورثة" is a to-do, "فلا أحد يستلم شيئاً" is why it matters.
  blockedHeirs: {
    ar: "لا. لم تُضف ورثة بعد، فلا أحد يستلم شيئاً.",
    en: "No. You haven't added any heirs, so nobody would receive anything.",
  },
  blockedRouting: {
    ar: "لا. لا شيء في خزنتك موجَّه إلى أحد بعد.",
    en: "No. Nothing in your vault is routed to anyone yet.",
  },
  blockedCheckin: {
    ar: "لا. بدون نبض الحياة لن يعرف أحد أن شيئاً حدث، ولن يُسلَّم شيء.",
    en: "No. Without the life check-in nobody learns anything happened, and nothing is ever delivered.",
  },
  blockedIdentity: {
    ar: "لا. لم يكتمل التحقق من هويتك بعد.",
    en: "No. Your identity check isn't finished.",
  },

  // Access risks. The vault still reaches the family — the person exposed is
  // the owner. Saying "your heirs are at risk" here would be false and cruel.
  riskSheet: {
    ar: "تصل إلى ورثتك. لكنك قد تفقد أنت الوصول — لم تطبع وثيقة الاسترداد.",
    en: "It reaches your heirs. But you could lose access yourself — your recovery sheet isn't printed.",
  },
  riskGuardian: {
    ar: "تصل إلى ورثتك. لكن بلا وصي لا يمكن استرداد خزنتك على جهاز جديد.",
    en: "It reaches your heirs. But without a guardian it can't be recovered on a new device.",
  },

  fixHeirs: { ar: "أضف وارثاً", en: "Add an heir" },
  fixRouting: { ar: "وجّه أصولك", en: "Route your assets" },
  fixIdentity: { ar: "أكمل التحقق", en: "Finish verification" },
  fixSheet: { ar: "اطبع الوثيقة", en: "Print the sheet" },
  fixGuardian: { ar: "اختر وصياً", en: "Choose a guardian" },

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
  // "آخر مزامنة مشفّرة" — the word مشفّرة is doing real work: it says the sync
  // moved ciphertext, not contents.
  lastSync: { ar: "آخر مزامنة مشفّرة: {time}", en: "Last encrypted sync: {time}" },

  itemIdentity: { ar: "الهوية", en: "Identity" },
  itemKey: { ar: "المفتاح", en: "Key" },
  itemGuardian: { ar: "الوصي", en: "Guardian" },
  itemSheet: { ar: "الوثيقة", en: "Sheet" },
  itemHeirs: { ar: "الورثة", en: "Heirs" },
  itemRouting: { ar: "التوجيه", en: "Routing" },
  itemCheckin: { ar: "التحقق من الحياة", en: "Life check-in" },
  notSet: { ar: "غير مفعّل", en: "not on" },

  assetsTitle: { ar: "أصولك", en: "Your assets" },
  seeAll: { ar: "الكل", en: "All" },
  emptyAssets: { ar: "لم تُضف أصولاً بعد", en: "No assets yet" },
  vaultLine: { ar: "{assets} · {heirs}", en: "{assets} · {heirs}" },
  // The number that actually matters on this row: an asset with no
  // destination is the commonest silent failure in the product.
  unroutedLine: {
    ar: "{n} منها بلا وجهة",
    en: "{n} with no destination",
  },

  heirsSummary: {
    ar: "{heirs} · {routed} من {total} أصلاً لها مستلم",
    en: "{heirs} · {routed} of {total} assets have a recipient",
  },
  defaultRule: {
    ar: "{n} أصلاً تتبع القاعدة الافتراضية: جميع الورثة",
    en: "{n} assets follow the default rule: all heirs",
  },
  noHeirs: { ar: "لم تضف ورثة بعد", en: "No heirs yet" },

  // The single amber row. Exactly one at a time, the highest-ranked gap.
  gapPrefix: { ar: "{label}", en: "{label}" },
  gapNotOn: { ar: "غير مفعّل — أكمله لتكتمل السلسلة", en: "Not set — finish it to complete the chain" },
  fix: { ar: "أكمله", en: "Finish" },

  // Assets need their own forms: "١ أصلاً" is the 11+ accusative applied to
  // one thing, which reads the way "1 assets" does. See i18n/plural.ts.
  assetZero: { ar: "لا أصول", en: "No assets" },
  assetOne: { ar: "أصل واحد", en: "1 asset" },
  assetTwo: { ar: "أصلان", en: "2 assets" },
  assetFew: { ar: "{n} أصول", en: "{n} assets" },
  assetMany: { ar: "{n} أصلاً", en: "{n} assets" },

  countZero: { ar: "لا ورثة", en: "No heirs" },
  countOne: { ar: "وارث واحد", en: "1 heir" },
  countTwo: { ar: "وارثان", en: "2 heirs" },
  countFew: { ar: "{n} ورثة", en: "{n} heirs" },
  countMany: { ar: "{n} وارثاً", en: "{n} heirs" },
} satisfies LabelSet<string>

/** ٣.٢ — the vault lock. */
export const LOCK = {
  title: { ar: "خزنتك مقفلة", en: "Your vault is locked" },
  body: { ar: "المس مستشعر البصمة للمتابعة", en: "Touch the sensor to continue" },
  autoLocked: {
    ar: "قُفلت تلقائياً بعد {n} دقائق",
    en: "Locked automatically after {n} minutes",
  },
  unlock: { ar: "فتح بالبصمة", en: "Unlock" },
  unlocking: { ar: "جارٍ الفتح…", en: "Unlocking…" },
  useRecovery: { ar: "استخدم وثيقة الاسترداد", en: "Use your recovery sheet" },
  prompt: { ar: "افتح خزنتك", en: "Unlock your vault" },
  denied: {
    ar: "لم يتم التحقق. حاول مرة أخرى، أو استخدم وثيقة الاسترداد.",
    en: "Not verified. Try again, or use your recovery sheet.",
  },
  // Biometrics changed on the device — the key is gone, and only the recovery
  // ceremony helps. Named separately because retrying can never fix it.
  keyLost: {
    ar: "تغيّرت بصمات هذا الجهاز، ولم يعد بإمكانه فتح مفتاحك. استخدم وثيقة الاسترداد.",
    en: "This device's biometrics changed and it can no longer open your key. Use your recovery sheet.",
  },
} satisfies LabelSet<string>

/** ٣.٣ — notifications. */
export const NOTIFICATIONS = {
  title: { ar: "الإشعارات", en: "Notifications" },
  markAllRead: { ar: "تحديد كمقروء", en: "Mark as read" },

  // Two bands, never one flat feed.
  needsAttention: { ar: "يحتاج انتباهك", en: "Needs your attention" },
  history: { ar: "هذا الأسبوع", en: "This week" },

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
  wasMe: { ar: "كنت أنا", en: "That was me" },

  checkinDue: { ar: "وقت التحقق من الحياة", en: "Time to check in" },
  checkinDueBody: {
    ar: "تأكيد واحد بالبصمة",
    en: "One confirmation with your fingerprint",
  },
  openCheckin: { ar: "افتح التأكيد", en: "Open check-in" },

  guardianAccepted: { ar: "قبِل {name} دعوة الوصاية", en: "{name} accepted the guardian invitation" },
  claimSubmitted: { ar: "طلب وراثة على حسابك", en: "An inheritance claim on your account" },
  claimBlocked: {
    ar: "حُجبت محاولة طلب وراثة",
    en: "An inheritance claim attempt was blocked",
  },
  claimVetoed: { ar: "أُوقف طلب الوراثة", en: "The inheritance claim was stopped" },
  bundlesRebuilt: { ar: "حُدّثت مفاتيح التسليم", en: "Delivery keys were updated" },
  generic: { ar: "تحديث في خزنتك", en: "An update in your vault" },
} satisfies LabelSet<string>
