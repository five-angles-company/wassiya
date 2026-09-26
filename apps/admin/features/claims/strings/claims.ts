import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The claims feature's copy.
 *
 * ## The word for a claim is `طلب`, not `مطالبة`
 *
 * The console used to say `مطالبة`, which appears nowhere else in the product.
 * The claimant reads `بلاغ وفاة` and `طلب` on the web funnel; the owner reads
 * `طلب وراثة` on their phone. An operator on a support call has to use the same
 * word as the person they are helping, so the console adopts theirs.
 *
 * ## The status labels are lifted from `apps/web/lib/claim-copy.ts`
 *
 * That file carries six `status*` labels — written, reviewed, and with no
 * consumer anywhere in the product. Reusing them means the operator's status
 * vocabulary and the claimant's are the same by construction rather than by
 * anyone remembering.
 */
export const CLAIMS = {
  queueTitle: { ar: "طابور المراجعة", en: "Review queue" },
  pageTitle: { ar: "الطلبات", en: "Claims" },
  reviewTitle: { ar: "مراجعة الطلب", en: "Claim review" },
  back: { ar: "رجوع إلى الطلبات", en: "Back to claims" },

  // Status labels, matching what the claimant is shown for the same state.
  statusSubmitted: { ar: "قيد المراجعة اليدوية", en: "Manual review" },
  statusAwaitingVeto: { ar: "مدة الاعتراض جارية", en: "Veto window running" },
  statusReleased: { ar: "تم الإفراج", en: "Released" },
  statusVetoed: { ar: "أُغلق الطلب", en: "Owner objected" },
  // Not "Closed": `statusLocked` already uses that word, and the two mean
  // opposite things to an operator — locked is a ruling with a 90-day bar,
  // ended is a claim that never had a vault to rule on.
  statusClosed: { ar: "مُنتهٍ", en: "Ended, no vault" },
  statusLocked: { ar: "الطلب مغلق", en: "Closed" },

  colClaimant: { ar: "مقدّم الطلب", en: "Claimant" },
  colCertificate: { ar: "شهادة الوفاة", en: "Certificate" },
  colOwner: { ar: "الاسم المُوثّق للمالك", en: "Owner's verified name" },
  colSubmitted: { ar: "تاريخ التقديم", en: "Submitted" },
  colStatus: { ar: "الحالة", en: "Status" },
  actionCopyContact: {
    ar: "انسخ وسيلة التواصل",
    en: "Copy contact",
  },
  colActions: { ar: "إجراءات", en: "Actions" },

  certificateView: { ar: "فتح الملف", en: "Open file" },
  certificateNone: { ar: "لم تصل", en: "Not received" },
  ownerNameNone: { ar: "—", en: "—" },

  openMenu: { ar: "فتح القائمة", en: "Open menu" },
  actionCopyId: { ar: "نسخ معرّف الطلب", en: "Copy claim id" },
  actionOpen: { ar: "افتح الطلب", en: "Open claim" },

  // "In this state" assumed a status was always selected. None is, now.
  empty: { ar: "لا طلبات", en: "No claims" },
  emptyHint: {
    ar: "لا شيء هنا الآن — وهذا هو الوضع الطبيعي، لا خلل.",
    en: "Nothing here right now. That is the normal state, not a fault.",
  },
  filterPlaceholder: {
    ar: "ابحث باسم مقدّم الطلب",
    en: "Filter by claimant name",
  },
  columns: { ar: "الأعمدة", en: "Columns" },
  previous: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },

  // ── The review screen ────────────────────────────────────────────────────
  comparisonTitle: { ar: "المقارنة", en: "The comparison" },
  comparisonHint: {
    ar: "هذا هو الحكم كلّه: الاسم على الشهادة مقابل الاسم المُوثّق للمالك. لا يقارنهما البرنامج — اختلاف الرسم والألقاب وترتيب الأسماء يجعل المقارنة الآلية غير آمنة.",
    en: "This is the whole judgement: the name on the certificate against the owner's verified legal name. No code compares them — transliteration, honorifics and name order make that unsafe.",
  },
  certificateNameLabel: {
    ar: "الاسم على الشهادة",
    en: "Name on the certificate",
  },
  ownerNameLabel: { ar: "الاسم المُوثّق للمالك", en: "Owner's verified name" },
  claimantLabel: { ar: "مقدّم الطلب", en: "Claimant" },
  contactLabel: { ar: "وسيلة التواصل", en: "Contact" },

  executorTitle: { ar: "الأوصياء", en: "Executors" },
  executorHint: {
    ar: "بعد مدة الاعتراض يستلم كل وصي كل ما اختار المالك تسليمه، ويُثبت هويته بنفسه، ثم يفتحه بورقته.",
    en: "After the objection period each executor receives everything the owner chose to hand over, proves their own identity, then opens it with their sheet.",
  },
  executorSheet: { ar: "ورقته مطبوعة", en: "Sheet printed" },
  executorNoSheet: { ar: "لا ورقة", en: "No sheet" },
  executorNone: {
    ar: "لم يُسمِّ هذا المالك وصياً — لن يُسلَّم شيء لأحد.",
    en: "This owner named no executor — nothing will be delivered to anyone.",
  },
  // Only the owner's recovery sheet could stand in; Wassiya holds no key.
  executorNoSheetNote: {
    ar: "وصيّ بلا ورقة لا يفتح شيئاً إلا بورقة استرجاع المالك — لا نملك أي مفتاح.",
    en: "An executor without a sheet can open nothing except with the owner's recovery sheet — we hold no key.",
  },

  priorTitle: {
    ar: "طلبات سابقة من نفس الشخص",
    en: "Earlier claims by this person",
  },
  priorWarning: {
    ar: "اعتُرض على طلب سابق من هذا الشخص. الحجب لمدة ٩٠ يوماً يُطابَق بوسيلة التواصل المكتوبة فقط، فقد لا يمنع طلباً جديداً بعنوان مختلف — تحقّق قبل الموافقة.",
    en: "An earlier claim by this person was vetoed. The 90-day bar is matched on the typed contact string alone, so a new claim under a different address can slip past it — check before approving.",
  },

  // The redesigned review: certificate on one side, decision on the other.
  certificateTitle: { ar: "شهادة الوفاة", en: "Death certificate" },
  certificateOpen: { ar: "افتح في نافذة جديدة", en: "Open in a new tab" },
  certificateUnsupported: {
    ar: "لا يمكن عرض هذا الملف هنا — افتحه في نافذة جديدة.",
    en: "This file can't be shown here — open it in a new tab.",
  },
  decisionTitle: { ar: "القرار", en: "Decision" },
  stateAwaiting: {
    ar: "مدة الاعتراض تنتهي {date}. لا شيء مطلوب حتى ذلك.",
    en: "The objection period ends {date}. Nothing is needed until then.",
  },
  stateReleased: { ar: "أُفرج عنه {date}", en: "Released {date}" },
  stateClosed: { ar: "انتهى هذا الطلب.", en: "This claim has ended." },
  deliveriesSummary: {
    ar: "{ready} من {total} أوصياء تحقّقت هويتهم",
    en: "{ready} of {total} executors have been verified",
  },
  deliveriesNone: {
    ar: "لا وصي لهذا المالك — لا شيء يصل لأحد.",
    en: "This owner has no executor — nothing reaches anyone.",
  },
  deliveriesOpen: {
    ar: "تابع التواصل مع الأوصياء",
    en: "Follow up with the executors",
  },
  tabExecutors: { ar: "الأوصياء", en: "Executors" },
  tabHistory: { ar: "السجل", en: "History" },
  historyTitle: { ar: "ما حدث لهذا الطلب", en: "What has happened" },
  historyEmpty: { ar: "لا سجل بعد", en: "Nothing recorded yet" },

  // ── Actions and their dialogs ────────────────────────────────────────────
  verdictTitle: { ar: "الحكم على تطابق الاسم", en: "Rule on the name match" },
  approve: { ar: "الاسمان لشخص واحد", en: "Same person" },
  reject: { ar: "الاسمان لشخصين مختلفين", en: "Different people" },

  approveDialogTitle: { ar: "تأكيد التطابق؟", en: "Confirm the match?" },
  approveDialogBody: {
    ar: "تبدأ مدة اعتراض مدتها ٣٠ يوماً يستطيع المالك خلالها إيقافه، ثم نتواصل مع أوصيائه.",
    en: "A 30-day window opens in which the owner can stop it; after it, we contact their executors.",
  },
  approveConfirm: { ar: "نعم، الاسمان متطابقان", en: "Yes, they match" },

  // The destructive one. Different title, different body, different verb, and
  // the destructive button variant — a dialog that reads like the safe one has
  // failed at the only job it has.
  rejectDialogTitle: {
    ar: "إغلاق الطلب نهائياً؟",
    en: "Close this claim for good?",
  },
  rejectDialogBody: {
    ar: "سيُغلق الطلب ولا يمكن إعادة فتحه — لا يوجد في المنتج أي مسار يُخرج طلباً من حالة «مغلق». على مقدّم الطلب أن يبدأ طلباً جديداً من البداية.",
    en: "The claim closes and cannot be reopened — nothing anywhere moves a claim out of closed. The claimant would have to start a new claim from scratch.",
  },
  rejectConfirm: { ar: "أغلق الطلب", en: "Close the claim" },

  cancel: { ar: "تراجع", en: "Cancel" },

  // Why an action is unavailable — the same reasons the mutation throws.
  blockedPastReview: {
    ar: "خرج هذا الطلب من مرحلة المراجعة.",
    en: "This claim is past the review stage.",
  },

  toastApproved: {
    ar: "بدأت مدة الاعتراض.",
    en: "The objection period has started.",
  },
  toastRejected: { ar: "أُغلق الطلب.", en: "The claim is closed." },
  toastFailed: {
    ar: "تعذّر تنفيذ الإجراء. لم يتغيّر شيء.",
    en: "That did not go through. Nothing changed.",
  },

  // What approving sets in motion, stated before it is set in motion.
  approveNextTitle: {
    ar: "ماذا يحدث بعد الموافقة",
    en: "What approving does",
  },
  approveNextBody: {
    ar: "تبدأ مهلة اعتراض مدّتها ثلاثون يوماً ويُشعَر صاحب الخزنة. إن لم يعترض، نُنشئ تسليماً لكل وصي ونتواصل معه ليُثبت هويته.",
    en: "A thirty-day objection period starts and the owner is notified. If they do not object, we create a delivery for every executor and contact each one to prove their identity.",
  },
} as const satisfies Dictionary
