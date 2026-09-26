import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The notification feed.
 *
 * - **A notification reports and points somewhere — it never confirms.** The
 *   check-in row points to the phone app; nothing here is a one-tap action.
 * - **An unknown kind is a first-class case.** `kind` is a free string and
 *   owners' kinds (`checkin.*`, `recovery.*`) share this feed; a kind with no
 *   entry renders its own name, so a missing translation looks like one.
 * - Each row says what happened and, where the answer is "nothing needed",
 *   says that too: a feed that only reports movement teaches that silence means
 *   trouble.
 */
export const NOTIFICATIONS = {
  title: { ar: "الإشعارات", en: "Notifications" },
  body: { ar: "كل ما راسلناك بشأنه، الأحدث أولاً.", en: "Everything we've written to you about, newest first." },
  emptyTitle: { ar: "لا إشعارات بعد", en: "No notifications yet" },
  emptyBody: {
    ar: "سيظهر هنا كل تغيير يخصّك، ويصلك على بريدك أيضاً.",
    en: "Every change that concerns you appears here, and in your email too.",
  },
  markRead: { ar: "تمت القراءة", en: "Mark as read" },
  unread: { ar: "جديد", en: "New" },
  loadMore: { ar: "عرض المزيد", en: "Show more" },
  unknownKind: { ar: "إشعار", en: "Notification" },

  // The person who filed a report, in the order things happen.
  claimFiled: { ar: "استلمنا بلاغك", en: "We have your report" },
  claimFiledBody: { ar: "بدأنا المراجعة، وسنراسلك عند كل خطوة.", en: "We've started checking it and will email you at each step." },
  claimCertificate: { ar: "وصلت شهادة الوفاة", en: "The certificate arrived" },
  claimCertificateBody: { ar: "استلمنا الشهادة وأضفناها إلى بلاغك.", en: "We received the certificate and added it to your report." },
  claimIdentity: { ar: "تأكدنا من هويتك", en: "We've confirmed who you are" },
  claimIdentityBody: {
    ar: "اكتمل التحقق من هويتك، ولا شيء آخر مطلوب منك في هذه الخطوة.",
    en: "Your identity check is done, and nothing else is needed from you at this step.",
  },
  claimInReview: { ar: "انتهت المراجعة، وبدأت فترة الانتظار", en: "The check is done — the waiting period has started" },
  claimInReviewBody: {
    ar: "فترة يستطيع خلالها صاحب الخزنة إيقاف البلاغ إن كان حيّاً. لا شيء مطلوب منك.",
    en: "A period in which the vault's owner can stop the report if they're alive. Nothing is needed from you.",
  },
  claimReviewFailed: { ar: "أُغلق بلاغك", en: "Your report was closed" },
  claimReviewFailedBody: {
    ar: "لم نستطع متابعة هذا البلاغ. راسلنا إن رأيت أن هذا خطأ.",
    en: "We couldn't take this report further. Write to us if you think that's wrong.",
  },
  claimVetoed: { ar: "أُغلق بلاغك", en: "Your report was closed" },
  claimVetoedBody: {
    ar: "أوقف صاحب الخزنة البلاغ خلال فترة الانتظار.",
    en: "The vault's owner stopped the report during the waiting period.",
  },
  claimReleased: { ar: "انتهت فترة الانتظار", en: "The waiting period is over" },
  claimReleasedBody: {
    ar: "نتواصل الآن مباشرة مع كل وصيّ سمّاه صاحب الخزنة.",
    en: "We're now contacting each executor the vault's owner named, directly.",
  },

  // An owner's own, read here only because the feed is shared.
  claimSubmitted: { ar: "أُبلغ عن وفاتك", en: "Someone reported your death" },
  claimSubmittedBody: {
    ar: "افتح التطبيق على جوّالك لتراه، وأوقفه إن لزم.",
    en: "Open the app on your phone to see it, and stop it if you need to.",
  },
  claimBlocked: { ar: "حاول أحدهم الإبلاغ مجدداً وأُوقف", en: "Someone tried to report again and was stopped" },
  claimBlockedBody: {
    ar: "إيقافك السابق ما زال سارياً، فلم يُقبل البلاغ.",
    en: "Your earlier stop is still in force, so the report wasn't accepted.",
  },
  claimVetoOpen: { ar: "بدأت فترة الانتظار على خزنتك", en: "The waiting period on your vault has started" },
  claimVetoOpenBody: {
    ar: "إن كنت تقرأ هذا فأنت بخير — أوقف البلاغ من التطبيق على جوّالك.",
    en: "If you're reading this, you're alive — stop the report from the app on your phone.",
  },
  checkin: { ar: "تذكير بتأكيد أنك بخير", en: "A reminder to check in" },
  checkinBody: {
    ar: "التأكيد يتم من التطبيق على جوّالك ببصمتك — لا يمكن من المتصفّح.",
    en: "You check in from the phone app with your fingerprint — it can't be done in a browser.",
  },
  recovery: { ar: "استُخدمت ورقة الاسترداد", en: "Your recovery sheet was used" },
  recoveryBody: {
    ar: "إن لم تكن أنت، فورقتك بيد غيرك. اطبع ورقة جديدة من التطبيق فوراً.",
    en: "If that wasn't you, someone else has your sheet. Print a new one from the app right away.",
  },
} as const satisfies Dictionary
