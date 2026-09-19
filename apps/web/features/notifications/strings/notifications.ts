import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The notification feed.
 *
 * ## A notification reports and navigates — it never confirms
 *
 * That rule comes from the check-in design and holds here too: the row for a
 * check-in escalation links to the mobile app, it does not offer a button. On
 * this surface it is easy to obey, because nothing an heir or a reporter is
 * asked to do is a one-tap action in the first place.
 *
 * ## The unknown kind is a first-class case
 *
 * `kind` is a free `v.string()` in the schema and this app is not the only
 * writer — `checkin.*` and `recovery.*` are written for owners, who mostly read
 * them on mobile but share one user record with this app. A kind with no entry
 * here renders its own name in a monospace run rather than an empty row, so a
 * missing translation looks like a missing translation instead of a bug.
 */
export const NOTIFICATIONS = {
  // ── The claimant's own, in claim order ───────────────────────────────────
  //
  // Each says what happened and, where the answer is "nothing", says that too.
  // A feed that only ever reports movement teaches its reader that silence
  // means something is wrong.
  claimFiled: { ar: "استلمنا بلاغك", en: "We have your report" },
  claimFiledBody: {
    ar: "بدأت المراجعة. سنراسلك عند كل تغيّر.",
    en: "Review has started. We'll email you at each change.",
  },
  claimCertificate: { ar: "وصلت شهادة الوفاة", en: "The certificate arrived" },
  claimCertificateBody: {
    ar: "استلمنا الوثيقة وأضفناها إلى بلاغك.",
    en: "We received the document and added it to your report.",
  },
  claimIdentity: { ar: "وُثِّقت هويتك", en: "Your identity is verified" },
  claimIdentityBody: {
    ar: "اكتمل التحقّق من هويتك. لا شيء آخر مطلوب منك في هذه الخطوة.",
    en: "Your identity check is complete. Nothing further is needed from you at this step.",
  },
  claimInReview: {
    ar: "اكتملت المراجعة — بدأت مهلة الاعتراض",
    en: "Review complete — the objection period has started",
  },
  claimInReviewBody: {
    ar: "مهلة ثلاثين يوماً يستطيع خلالها صاحب الخزنة إيقاف البلاغ. لا شيء مطلوب منك.",
    en: "Thirty days in which the account holder can stop the report. Nothing is needed from you.",
  },
  claimReviewFailed: { ar: "أُغلق بلاغك", en: "Your report is closed" },
  claimReviewFailedBody: {
    ar: "لم نتمكّن من متابعة هذا البلاغ. تواصل معنا إن كنت ترى أن هذا خطأ.",
    en: "We could not take this report further. Contact us if you believe that is wrong.",
  },

  title: { ar: "الإشعارات", en: "Notifications" },
  body: {
    ar: "كل ما راسلناك بشأنه. الأحدث أولاً.",
    en: "Everything we've contacted you about. Newest first.",
  },
  emptyTitle: { ar: "لا إشعارات", en: "No notifications" },
  emptyBody: {
    ar: "سيظهر هنا كل تغيّر يخصّك، ويصلك على بريدك أيضاً.",
    en: "Every change that concerns you appears here, and reaches your email too.",
  },

  markRead: { ar: "علّمه مقروءاً", en: "Mark as read" },
  unread: { ar: "جديد", en: "New" },
  loadMore: { ar: "المزيد", en: "Load more" },

  // ---- kinds -------------------------------------------------------------
  claimSubmitted: { ar: "قُدّم بلاغ على خزنتك", en: "A report was filed against your vault" },
  claimSubmittedBody: {
    ar: "افتح التطبيق على جوّالك للاطلاع والاعتراض إن لزم.",
    en: "Open the app on your phone to review it and object if you need to.",
  },
  claimBlocked: {
    ar: "حاول أحدهم تقديم بلاغ جديد وأُوقف",
    en: "Someone tried to file again and was blocked",
  },
  claimBlockedBody: {
    ar: "اعتراضك السابق ما زال سارياً، فلم يُقبل البلاغ.",
    en: "Your earlier objection is still in force, so the report was not accepted.",
  },
  claimVetoOpen: {
    ar: "بدأت مدة الاعتراض على خزنتك",
    en: "The objection period on your vault has begun",
  },
  claimVetoOpenBody: {
    ar: "إن كنت تقرأ هذا فأنت حيّ — اعترض من التطبيق على جوّالك.",
    en: "If you are reading this you are alive — object from the app on your phone.",
  },
  claimVetoed: { ar: "أُغلق بلاغك", en: "Your report was closed" },
  claimVetoedBody: {
    ar: "اعترض صاحب الخزنة خلال المدة المتاحة له.",
    en: "The vault's owner objected within the period available to them.",
  },
  claimReleased: { ar: "انتهت مهلة الاعتراض", en: "The objection period has ended" },
  claimReleasedBody: {
    ar: "نتواصل الآن مباشرةً مع كل وارث سمّاه صاحب الخزنة.",
    en: "We are now contacting each heir the account holder named, directly.",
  },
  checkin: { ar: "تذكير بتأكيد الحياة", en: "A life check-in reminder" },
  checkinBody: {
    ar: "التأكيد يتم من التطبيق على جوّالك ببصمتك — لا يمكن من المتصفّح.",
    en: "Confirming happens in the phone app with your fingerprint — it cannot be done in a browser.",
  },
  recovery: { ar: "استُخدمت وثيقة الاسترداد", en: "Your recovery sheet was used" },
  recoveryBody: {
    ar: "إن لم تكن أنت، فورقتك بيد غيرك. أعد طباعتها فوراً من التطبيق.",
    en: "If that wasn't you, someone else holds your sheet. Reprint it from the app immediately.",
  },
  unknownKind: { ar: "إشعار", en: "Notification" },
} as const satisfies Dictionary
