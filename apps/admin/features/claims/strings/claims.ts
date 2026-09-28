import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The claims feature's copy. The console uses the product's words — بلاغ وفاة,
 * المُبلِّغ, التسليم — because an operator on a support call must name things
 * the way the reporter's own screens (`apps/web/features/claims`) name them.
 */
export const CLAIMS = {
  queueTitle: { ar: "طابور المراجعة", en: "Review queue" },
  pageTitle: { ar: "بلاغات الوفاة", en: "Death reports" },
  back: { ar: "كل البلاغات", en: "All reports" },

  statusSubmitted: { ar: "بانتظار المراجعة", en: "Awaiting review" },
  statusAwaitingVeto: { ar: "مدة الاعتراض جارية", en: "Veto window running" },
  statusReleased: { ar: "بدأ التسليم", en: "Handover started" },
  statusVetoed: { ar: "أوقفه صاحب الخزنة", en: "Stopped by the owner" },
  statusLocked: { ar: "مرفوض", en: "Rejected" },
  // Not "closed": a rejection is a ruling, this is a report with no vault.
  statusClosed: { ar: "انتهى بلا خزنة", en: "Ended, no vault" },

  colClaimant: { ar: "المُبلِّغ", en: "Reporter" },
  colCertificate: { ar: "شهادة الوفاة", en: "Certificate" },
  colOwner: { ar: "الاسم المُوثّق لصاحب الخزنة", en: "Owner's verified name" },
  colSubmitted: { ar: "تاريخ البلاغ", en: "Filed" },
  colStatus: { ar: "الحالة", en: "Status" },
  actionCopyContact: { ar: "انسخ وسيلة التواصل", en: "Copy contact" },
  colActions: { ar: "إجراءات", en: "Actions" },

  contactLabel: { ar: "وسيلة التواصل", en: "Contact" },
  certificateView: { ar: "فتح الملف", en: "Open file" },
  certificateNone: { ar: "لم تصل", en: "Not received" },
  ownerNameNone: { ar: "—", en: "—" },

  openMenu: { ar: "فتح القائمة", en: "Open menu" },
  actionCopyId: { ar: "نسخ معرّف البلاغ", en: "Copy report id" },
  actionOpen: { ar: "افتح البلاغ", en: "Open report" },

  empty: { ar: "لا بلاغات", en: "No reports" },
  emptyHint: {
    ar: "لا شيء هنا الآن — وهذا هو الوضع الطبيعي، لا خلل.",
    en: "Nothing here right now. That is the normal state, not a fault.",
  },
  filterPlaceholder: {
    ar: "ابحث باسم المُبلِّغ",
    en: "Filter by reporter name",
  },
  columns: { ar: "الأعمدة", en: "Columns" },
  previous: { ar: "السابق", en: "Previous" },
  next: { ar: "التالي", en: "Next" },

  // ── The review screen ────────────────────────────────────────────────────
  reviewTitle: { ar: "بلاغ وفاة", en: "Death report" },
  subjectUnmatched: { ar: "بلا خزنة", en: "no vault" },

  sitUnmatched: {
    ar: "لم يُطابَق بخزنة. اربطه بالخزنة الصحيحة أو أغلقه من «بلاغات بلا خزنة».",
    en: "Matched no vault. Link it to the right one, or close it, from Unmatched reports.",
  },
  sitNoCertificate: {
    ar: "بانتظار شهادة الوفاة من المُبلِّغ.",
    en: "Waiting for the reporter to send the death certificate.",
  },
  sitSubmitted: {
    ar: "بانتظار المراجعة منذ {date}.",
    en: "Awaiting review since {date}.",
  },
  sitAwaiting: {
    ar: "مدة الاعتراض تنتهي {date}.",
    en: "The veto window ends {date}.",
  },
  sitReleased: { ar: "بدأ التسليم {date}.", en: "Handover started {date}." },
  sitVetoed: {
    ar: "أوقفه صاحب الخزنة بتأكيد الحياة {date}.",
    en: "The owner stopped it by confirming they are alive, {date}.",
  },
  sitLocked: { ar: "رُفض {date}.", en: "Rejected {date}." },
  sitLockedAtFiling: {
    ar: "رُفض عند تقديمه: المُبلِّغ ممنوع من البلاغ عن هذه الخزنة حتى {date}.",
    en: "Refused when filed: the reporter is barred from reporting this vault until {date}.",
  },
  sitClosed: {
    ar: "انتهى بلا خزنة {date}.",
    en: "Ended with no vault, {date}.",
  },

  certificateTitle: { ar: "شهادة الوفاة", en: "Death certificate" },
  certificateOpen: { ar: "افتح في نافذة جديدة", en: "Open in a new tab" },
  certificateMissing: {
    ar: "لم تصل الشهادة بعد",
    en: "The certificate hasn't arrived yet",
  },
  certificateUnsupported: {
    ar: "لا يُعرض هذا الملف هنا — افتحه في نافذة جديدة.",
    en: "This file can't be shown here — open it in a new tab.",
  },
  zoomIn: { ar: "تكبير", en: "Zoom in" },
  zoomOut: { ar: "تصغير", en: "Zoom out" },
  zoomFit: { ar: "ملء الإطار", en: "Fit" },
  rotate: { ar: "تدوير", en: "Rotate" },

  none: { ar: "—", en: "—" },
  identityTitle: {
    ar: "الهوية الموثّقة لصاحب الخزنة",
    en: "Owner's verified identity",
  },
  identityVerifiedOn: { ar: "وُثّقت {date}", en: "Verified {date}" },
  identityNone: {
    ar: "لم يوثّق صاحب الخزنة هويته — لا شيء تُطابَق به الشهادة.",
    en: "The owner never verified their identity — there is nothing to check the certificate against.",
  },
  birthDateLabel: { ar: "تاريخ الميلاد", en: "Date of birth" },
  docTypeLabel: { ar: "الوثيقة", en: "Document" },

  // ── The compare table ────────────────────────────────────────────────────
  compareTitle: {
    ar: "قارن الشهادة بصاحب الخزنة",
    en: "Compare the certificate with the owner",
  },
  compareVerifiedOn: {
    ar: "هويته موثّقة عبر Didit · {date}",
    en: "Identity verified with Didit · {date}",
  },
  nameLabel: { ar: "الاسم", en: "Name" },
  idLabel: { ar: "رقم الهوية", en: "ID number" },
  idRowHint: {
    ar: "انقله من الشهادة. لا يظهر رقم صاحب الخزنة لأحد.",
    en: "Copy it from the certificate. Nobody sees the owner's number.",
  },
  matches: { ar: "يطابق", en: "Matches" },
  noMatch: { ar: "لا يطابق", en: "Doesn't match" },
  notOnFile: { ar: "غير مسجّل", en: "Not on file" },

  idCheckPlaceholder: { ar: "الرقم كما في الشهادة", en: "As printed on it" },
  idCheckAction: { ar: "طابِق", en: "Check" },
  idCheckNoNumber: {
    ar: "لا يوجد رقم في الشهادة",
    en: "There's no number on the certificate",
  },
  idCheckMatched: {
    ar: "يطابق وثيقته الموثّقة",
    en: "Matches their verified document",
  },
  idCheckMismatch: {
    ar: "لا يطابق · المحاولات المتبقية: {n}",
    en: "No match · tries left: {n}",
  },
  idCheckExhausted: {
    ar: "لم يطابق بعد {max} محاولات. قد تحمل الشهادة رقم وثيقة أخرى — الحكم بالاسم وتاريخ الميلاد.",
    en: "No match after {max} tries. The certificate may carry another document's number — judge on name and date of birth.",
  },
  idCheckNoNumbers: {
    ar: "لا رقم هوية موثّق لصاحب الخزنة — الحكم بالاسم وتاريخ الميلاد.",
    en: "The owner has no verified ID number — judge on name and date of birth.",
  },
  idCheckNoneChosen: {
    ar: "لا رقم في الشهادة — الحكم بالاسم وتاريخ الميلاد.",
    en: "No number on the certificate — judge on name and date of birth.",
  },
  undo: { ar: "تراجع", en: "Undo" },

  idLineMatched: { ar: "يطابق", en: "Matches" },
  idLineMissed: { ar: "لم يطابق", en: "Didn't match" },
  idLineUnchecked: { ar: "لم يُطابَق", en: "Not checked" },

  summaryLeft: {
    ar: "بقي {n} من {total} للمقارنة.",
    en: "{n} of {total} left to compare.",
  },
  summaryAllMatch: {
    ar: "كل ما في الشهادة يطابق صاحب الخزنة.",
    en: "Everything on the certificate matches the owner.",
  },
  summaryMismatch: {
    ar: "ما في الشهادة لا يطابق صاحب الخزنة — ارفض البلاغ.",
    en: "The certificate doesn't match the owner — reject the report.",
  },

  approve: { ar: "وافق", en: "Approve" },
  reject: { ar: "ارفض", en: "Reject" },
  cancel: { ar: "تراجع", en: "Back" },
  approveBody: {
    ar: "تبدأ مدة اعتراض مدتها ٣٠ يوماً ويُشعَر صاحب الخزنة، ويستطيع إيقافها ببصمته. بعدها نتواصل مع أوصيائه.",
    en: "A 30-day veto window starts and the owner is notified; they can stop it with their fingerprint. After it, we contact their executors.",
  },
  approveConfirm: { ar: "ابدأ مدة الاعتراض", en: "Start the veto window" },
  rejectQuestion: {
    ar: "رفض البلاغ نهائياً؟ لا يُعاد فتحه، ويُبلَّغ المُبلِّغ دون ذكر السبب.",
    en: "Reject the report for good? It can't be reopened, and the reporter is told without a reason.",
  },
  rejectConfirm: { ar: "ارفض البلاغ", en: "Reject the report" },
  reasonNotCertificate: {
    ar: "ليست شهادة وفاة",
    en: "Not a death certificate",
  },
  reasonUnreadable: { ar: "غير مقروءة", en: "Unreadable" },
  reasonNamesDiffer: { ar: "ليست لصاحب الخزنة", en: "Not the vault owner's" },

  awaitingTitle: { ar: "بانتظار المراجعة", en: "Awaiting review" },
  unmatchedTitle: { ar: "لم يُطابَق بخزنة", en: "No vault matched" },

  toastApproved: {
    ar: "بدأت مدة الاعتراض.",
    en: "The veto window has started.",
  },
  toastRejected: { ar: "رُفض البلاغ.", en: "The report is rejected." },
  toastFailed: {
    ar: "تعذّر تنفيذ الإجراء. لم يتغيّر شيء.",
    en: "That did not go through. Nothing changed.",
  },

  detailsOpen: { ar: "تفاصيل البلاغ", en: "Report details" },
  detailsHide: { ar: "إخفاء تفاصيل البلاغ", en: "Hide report details" },

  // ── A decided report ─────────────────────────────────────────────────────
  outcomeAwaitingSub: {
    ar: "تنتهي {date}. لا شيء مطلوب منك حتى ذلك.",
    en: "It ends {date}. Nothing is needed from you until then.",
  },
  outcomeRejected: { ar: "رُفض البلاغ", en: "Report rejected" },
  outcomeRefused: { ar: "رُفض عند تقديمه", en: "Refused when filed" },
  outcomeRefusedSub: {
    ar: "المُبلِّغ ممنوع من البلاغ عن هذه الخزنة حتى {date}.",
    en: "The reporter is barred from reporting this vault until {date}.",
  },
  outcomeVetoedSub: {
    ar: "أكّد أنه حيّ ببصمته · {date}",
    en: "They confirmed they are alive with their fingerprint · {date}",
  },
  outcomeClosedSub: {
    ar: "لم يُطابَق بأي خزنة · {date}",
    en: "It matched no vault · {date}",
  },
  rowRuling: { ar: "القرار", en: "Ruling" },
  rowApprovedBy: { ar: "وافق عليه {name}", en: "Approved by {name}" },
  rowRejectedBy: { ar: "رفضه {name}", en: "Rejected by {name}" },
  rowReason: { ar: "السبب", en: "Reason" },
  rowBarredUntil: { ar: "المُبلِّغ ممنوع حتى", en: "Reporter barred until" },
  rulingSomeone: { ar: "أحد الموظفين", en: "A staff member" },
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

  ownerTitle: { ar: "صاحب الخزنة", en: "Vault owner" },
  matchedByIdNumber: {
    ar: "وُجدت خزنته برقم الهوية",
    en: "Vault found by ID number",
  },
  matchedByEmail: { ar: "وُجدت خزنته بالبريد", en: "Vault found by email" },
  unmatchedOpen: { ar: "بلاغات بلا خزنة", en: "Unmatched reports" },

  reporterTitle: { ar: "المُبلِّغ", en: "Reporter" },
  copied: { ar: "نُسخ", en: "Copied" },
  priorTitle: { ar: "بلاغات سابقة", en: "Earlier reports" },
  priorWarning: {
    ar: "أوقف صاحب الخزنة بلاغاً سابقاً من هذا الشخص — تحقّق قبل الموافقة.",
    en: "The owner stopped an earlier report by this person — check before approving.",
  },

  executorTitle: { ar: "الأوصياء", en: "Executors" },
  executorSheet: { ar: "ورقته مطبوعة", en: "Sheet printed" },
  executorNoSheet: { ar: "لا ورقة", en: "No sheet" },
  executorNone: {
    ar: "لم يُسمِّ صاحب الخزنة وصياً — لن يُسلَّم شيء لأحد.",
    en: "The owner named no executor — nothing will be delivered to anyone.",
  },
  // Only the owner's recovery sheet could stand in; Wassiya holds no key.
  executorNoSheetNote: {
    ar: "وصيّ بلا ورقة لا يفتح شيئاً إلا بوثيقة استرداد صاحب الخزنة.",
    en: "An executor without a sheet opens nothing except with the owner's recovery sheet.",
  },

  historyTitle: { ar: "السجل", en: "History" },
  historyEmpty: { ar: "لا سجل بعد", en: "Nothing recorded yet" },
  eventSubmitted: { ar: "قُدِّم البلاغ", en: "Report filed" },
  eventBlocked: { ar: "رُفض عند تقديمه", en: "Refused when filed" },
  eventCertificate: { ar: "وصلت الشهادة", en: "Certificate received" },
  eventLinked: { ar: "رُبط بالخزنة", en: "Linked to the vault" },
  eventApproved: { ar: "تمت الموافقة", en: "Approved" },
  eventRejected: { ar: "رُفض", en: "Rejected" },
  eventIdMatched: { ar: "طابق رقم الهوية", en: "ID number matched" },
  eventIdMismatch: { ar: "لم يطابق رقم الهوية", en: "ID number didn't match" },
  eventVetoed: { ar: "أوقفه صاحب الخزنة", en: "Stopped by the owner" },
  eventClosed: { ar: "أُغلق", en: "Closed" },
  eventReleased: { ar: "بدأ التسليم", en: "Handover started" },
} as const satisfies Dictionary
