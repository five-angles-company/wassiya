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
  colIdentity: { ar: "الهوية", en: "Identity" },
  colCertificate: { ar: "شهادة الوفاة", en: "Certificate" },
  colOwner: { ar: "الاسم المُوثّق للمالك", en: "Owner's verified name" },
  colSubmitted: { ar: "تاريخ التقديم", en: "Submitted" },
  colStatus: { ar: "الحالة", en: "Status" },
  actionCopyContact: {
    ar: "انسخ وسيلة التواصل",
    en: "Copy contact",
  },
  colActions: { ar: "إجراءات", en: "Actions" },
  colHeir: { ar: "الوريث", en: "Heir" },

  // The four state labels moved to `lib/i18n/strings/identity-status.ts` —
  // three screens read them and shared code cannot import a feature's strings.

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

  identityLive: { ar: "حالة الهوية الآن", en: "Identity now" },
  identityStaleWarning: {
    ar: "الحالة المسجّلة وقت التقديم كانت «{stored}» — القرار يُبنى على الحالة الحالية.",
    en: "Recorded at submit as “{stored}” — the decision uses the current value.",
  },

  heirTitle: { ar: "الورثة المستلمون", en: "Receiving heirs" },
  heirHint: {
    ar: "بعد مدة الاعتراض يستلم كل وارث بُنيت له حزمة تسليماً خاصاً به، ويُثبت هويته بنفسه.",
    en: "After the objection period every heir with a built bundle gets their own delivery and proves their own identity.",
  },
  heirAssets: { ar: "{n} أصل", en: "{n} assets" },
  heirNone: {
    ar: "لا يوجد ورثة مسجّلون لهذا المالك — لن يُسلَّم شيء لأحد.",
    en: "This owner has no heirs on record — nothing will be delivered to anyone.",
  },

  priorTitle: {
    ar: "طلبات سابقة من نفس الشخص",
    en: "Earlier claims by this person",
  },
  priorWarning: {
    ar: "اعتُرض على طلب سابق من هذا الشخص. الحجب لمدة ٩٠ يوماً يُطابَق بوسيلة التواصل المكتوبة فقط، فقد لا يمنع طلباً جديداً بعنوان مختلف — تحقّق قبل الموافقة.",
    en: "An earlier claim by this person was vetoed. The 90-day bar is matched on the typed contact string alone, so a new claim under a different address can slip past it — check before approving.",
  },

  historyTitle: { ar: "ما حدث لهذا الطلب", en: "What has happened" },
  historyEmpty: { ar: "لا سجل بعد", en: "Nothing recorded yet" },

  // ── Actions and their dialogs ────────────────────────────────────────────
  verdictTitle: { ar: "الحكم على تطابق الاسم", en: "Rule on the name match" },
  approve: { ar: "الاسمان لشخص واحد", en: "Same person" },
  reject: { ar: "الاسمان لشخصين مختلفين", en: "Different people" },

  approveDialogTitle: { ar: "تأكيد التطابق؟", en: "Confirm the match?" },
  approveDialogBody: {
    ar: "تبدأ مدة اعتراض مدتها ٣٠ يوماً يستطيع المالك خلالها إيقافه، ثم نتواصل مع ورثته.",
    en: "A 30-day window opens in which the owner can stop it; after it, we contact their heirs.",
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

  linkDialogTitle: {
    ar: "ربط الطلب بهذا الوريث؟",
    en: "Link the claim to this heir?",
  },
  linkDialogBody: {
    ar: "يمكن تغيير الربط لاحقاً ما لم يقع الإفراج.",
    en: "This can be changed later, any time before release.",
  },
  cancel: { ar: "تراجع", en: "Cancel" },

  // Why an action is unavailable — the same reasons the mutation throws.
  blockedIdentity: {
    ar: "هوية مقدّم الطلب غير موثّقة بعد. الموافقة الآن ستغلق الطلب نهائياً بدل تمريره — انتظر التوثيق.",
    en: "The claimant is not verified yet. Approving now would close the claim for good instead of passing it on — wait for verification.",
  },
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
    ar: "تبدأ مهلة اعتراض مدّتها ثلاثون يوماً ويُشعَر صاحب الخزنة. إن لم يعترض، نُنشئ تسليماً لكل وارث بُنيت له حزمة ونتواصل معه ليُثبت هويته.",
    en: "A thirty-day objection period starts and the owner is notified. If they do not object, we create a delivery for every heir with a built bundle and contact each one to prove their identity.",
  },
} as const satisfies Dictionary
