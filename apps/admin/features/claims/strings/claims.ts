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
  statusGuardianReview: { ar: "بانتظار تأكيد الوصي", en: "With the guardian" },
  statusAwaitingVeto: { ar: "مدة الاعتراض جارية", en: "Veto window running" },
  statusReleased: { ar: "تم الإفراج", en: "Released" },
  statusVetoed: { ar: "أُغلق الطلب", en: "Owner objected" },
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

  identityVerified: { ar: "موثّقة", en: "Verified" },
  identityPending: { ar: "قيد التحقق", en: "Pending" },
  identityUnverified: { ar: "غير موثّقة", en: "Unverified" },
  identityRejected: { ar: "مرفوضة", en: "Rejected" },

  certificateView: { ar: "فتح الملف", en: "Open file" },
  certificateNone: { ar: "لم تصل", en: "Not received" },
  ownerNameNone: { ar: "—", en: "—" },
  heirLinked: { ar: "مربوط", en: "Linked" },
  heirNotLinked: { ar: "غير مربوط", en: "Not linked" },

  openMenu: { ar: "فتح القائمة", en: "Open menu" },
  actionCopyId: { ar: "نسخ معرّف الطلب", en: "Copy claim id" },
  actionOpen: { ar: "افتح الطلب", en: "Open claim" },

  empty: { ar: "لا طلبات في هذه الحالة", en: "No claims in this state" },
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

  heirTitle: { ar: "الوريث المستلم", en: "Receiving heir" },
  heirHint: {
    ar: "لا يُفرج عن شيء قبل ربط الطلب بسجل وريث.",
    en: "Nothing can be released until the claim is linked to an heir record.",
  },
  heirPlaceholder: { ar: "اختر الوريث", en: "Choose the heir" },
  heirAssets: { ar: "{n} أصل", en: "{n} assets" },
  heirNone: {
    ar: "لا يوجد ورثة مسجّلون لهذا المالك — لا شيء يمكن ربط الطلب به.",
    en: "This owner has no heirs on record, so there is nothing to link the claim to.",
  },
  linkHeir: { ar: "اربط الوريث", en: "Link heir" },

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
    ar: "سينتقل الطلب إلى الوصي لتأكيده، ثم تبدأ مدة اعتراض مدتها ٣٠ يوماً يستطيع المالك خلالها إيقافه.",
    en: "The claim moves to the guardian for confirmation, then a 30-day window opens in which the owner can stop it.",
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
  linkConfirm: { ar: "اربط", en: "Link" },
  cancel: { ar: "تراجع", en: "Cancel" },

  // Why an action is unavailable — the same three reasons the mutation throws.
  blockedNoHeir: {
    ar: "اربط وريثاً أولاً: لا يستطيع الوصي تأكيد طلب بلا سجل وريث.",
    en: "Link an heir first: the guardian cannot confirm a claim with no heir record.",
  },
  blockedIdentity: {
    ar: "هوية مقدّم الطلب غير موثّقة بعد. الموافقة الآن ستغلق الطلب نهائياً بدل تمريره — انتظر التوثيق.",
    en: "The claimant is not verified yet. Approving now would close the claim for good instead of passing it on — wait for verification.",
  },
  blockedPastReview: {
    ar: "خرج هذا الطلب من مرحلة المراجعة.",
    en: "This claim is past the review stage.",
  },

  toastApproved: {
    ar: "انتقل الطلب إلى الوصي.",
    en: "The claim moved to the guardian.",
  },
  toastRejected: { ar: "أُغلق الطلب.", en: "The claim is closed." },
  toastLinked: { ar: "رُبط الوريث.", en: "Heir linked." },
  toastFailed: {
    ar: "تعذّر تنفيذ الإجراء. لم يتغيّر شيء.",
    en: "That did not go through. Nothing changed.",
  },

  // The dead end, stated on the screen rather than discovered later.
  guardianGapTitle: {
    ar: "لا شاشة للوصي بعد",
    en: "The guardian step has no screen yet",
  },
  guardianGapBody: {
    ar: "الموافقة تنقل الطلب إلى الوصي، لكن لا توجد بعد شاشة يؤكّد منها، ولا يُرسَل إليه إشعار. سيبقى الطلب في هذه الحالة حتى تُبنى تلك الشاشة.",
    en: "Approving moves the claim to the guardian, but no screen exists for them to confirm from and no notification is sent. The claim will sit in that state until that screen is built.",
  },
} as const satisfies Dictionary
