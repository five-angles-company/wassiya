import type { Dictionary } from "@/lib/i18n/locale"

/**
 * Deliveries — one per executor once a report is released. Staff do two jobs
 * here: make sure every executor is reached, and decide an identity the ID
 * number could not.
 */
export const DELIVERIES = {
  pageTitle: { ar: "التسليمات", en: "Deliveries" },
  searchPlaceholder: {
    ar: "ابحث بالوصي أو صاحب الخزنة…",
    en: "Search by executor or owner…",
  },
  empty: { ar: "لا تسليمات بعد", en: "No deliveries yet" },
  emptyHint: {
    ar: "يُنشأ تسليم لكل وصي بعد انتهاء مدة الاعتراض على بلاغ.",
    en: "A delivery is created for each executor once a report's objection period ends.",
  },
  filteredToClaim: { ar: "مُصفّى على بلاغ واحد", en: "Filtered to one report" },
  clearClaim: { ar: "عرض الكل", en: "Show all" },

  colExecutor: { ar: "الوصي", en: "Executor" },
  colOwner: { ar: "من خزنة", en: "From" },
  colStatus: { ar: "الحالة", en: "Status" },
  colContact: { ar: "آخر تواصل", en: "Last contact" },
  colExpires: { ar: "يُغلق", en: "Closes" },
  neverContacted: { ar: "لم يُتواصل بعد", en: "Not contacted yet" },

  statusAwaiting: { ar: "بانتظار الوصي", en: "Awaiting executor" },
  statusIdentity: { ar: "مطابقة الهوية", en: "Identity check" },
  statusReady: { ar: "جاهز", en: "Ready" },
  statusRejected: { ar: "مرفوض", en: "Rejected" },
  statusExpired: { ar: "منتهٍ", en: "Expired" },
  needsDecision: { ar: "يحتاج قراراً", en: "Needs a decision" },

  // The one line at the top of the sheet that says what to do now.
  nextSend: {
    ar: "أرسل الرابط إلى الوصي.",
    en: "Send the executor their link.",
  },
  nextWaitOpen: {
    ar: "أُرسل الرابط — ننتظر أن يفتحه الوصي. إن لم يصل، جرّب قناة أخرى.",
    en: "The link was sent — waiting for the executor to open it. If it didn't reach them, try another route.",
  },
  nextWaitVerify: {
    ar: "فتح الوصي الرابط وربطه بحسابه، ويُكمل التحقّق من هويته.",
    en: "The executor opened the link and is completing identity verification.",
  },
  nextDecide: {
    ar: "تحقّقت هويته ولم يحسمها رقم الهوية — قارن وقرّر.",
    en: "Their identity is verified but the ID number could not decide — compare and decide.",
  },
  nextReady: {
    ar: "تحقّقت هوية الوصي، ويفتح ما سُلِّم بورقته.",
    en: "The executor is verified and opens the handover with their sheet.",
  },
  nextRejected: {
    ar: "رُفضت المطابقة. أعد إصدار الرابط إن وجدت الوصي الصحيح.",
    en: "The match was rejected. Reissue the link if you find the right executor.",
  },
  nextExpired: {
    ar: "انتهت السنة وأُغلق هذا التسليم. تُحذف الخزنة حين يُغلق آخر تسليم لها.",
    en: "The year is over and this delivery is closed. The vault is deleted once its last delivery closes.",
  },

  // Section eyebrows and small print.
  openReport: { ar: "افتح البلاغ", en: "Open report" },
  closesOn: { ar: "يُغلق {date}", en: "Closes {date}" },
  matchYes: { ar: "مطابق", en: "match" },
  matchNo: { ar: "مختلف", en: "differs" },
  matchUnknown: { ar: "لا مقارنة", en: "no comparison" },
  logToggle: { ar: "سجّل محاولة تواصل", en: "Log a contact attempt" },
  logClose: { ar: "إخفاء", en: "Hide" },

  // Identity.
  identityTitle: { ar: "الهوية", en: "Identity" },
  registered: { ar: "ما سجّله صاحب الخزنة", en: "Registered by the owner" },
  verified: { ar: "ما تحقّق منه Didit", en: "Verified by Didit" },
  name: { ar: "الاسم", en: "Name" },
  idNumber: { ar: "رقم الهوية", en: "ID number" },
  idRegistered: { ar: "مسجّل", en: "Registered" },
  idMatches: { ar: "يطابق", en: "Matches" },
  idNoMatch: { ar: "لا يطابق", en: "Does not match" },
  notBound: { ar: "لم يفتح أحد الرابط بعد.", en: "Nobody has opened the link yet." },
  notVerifiedYet: { ar: "لم يُكمل التحقّق بعد.", en: "Has not finished verification yet." },
  matchedById: { ar: "طابق رقم الهوية تلقائياً", en: "Matched automatically by ID number" },
  approvedByStaff: { ar: "وافق عليه فريقنا", en: "Approved by staff" },
  approve: { ar: "الشخص نفسه — افتح", en: "Same person — open it" },
  reject: { ar: "ليس الشخص نفسه", en: "Not the same person" },
  approveTitle: { ar: "فتح التسليم لهذا الشخص؟", en: "Open this delivery to this person?" },
  approveBody: {
    ar: "سيستطيع فتح ما سُلِّم بورقة الوصي فوراً. لا يمكن التراجع.",
    en: "They will be able to open the handover with the executor sheet immediately. This cannot be undone.",
  },
  rejectTitle: { ar: "رفض هذه المطابقة؟", en: "Reject this match?" },
  rejectBody: {
    ar: "يُغلق التسليم لهذا الشخص. يمكنك بعدها إعادة إصدار الرابط للوصي الصحيح.",
    en: "The delivery closes to this person. You can then reissue the link to the right executor.",
  },

  // Contact.
  contactTitle: { ar: "التواصل", en: "Contact" },
  phone: { ar: "الجوال", en: "Phone" },
  email: { ar: "البريد", en: "Email" },
  none: { ar: "—", en: "—" },
  updatedByStaff: { ar: "حدّثه فريقنا", en: "Updated by staff" },
  editContact: { ar: "تعديل", en: "Edit" },
  saveContact: { ar: "حفظ", en: "Save" },
  cancel: { ar: "تراجع", en: "Cancel" },
  phoneHint: { ar: "بالصيغة الدولية: ‎+966551234567", en: "International form: +966551234567" },
  link: { ar: "الرابط", en: "Link" },
  noAppUrl: {
    ar: "APP_URL غير مضبوط على النشر، فلا رابط لعرضه.",
    en: "APP_URL is not set on the deployment, so there is no link to show.",
  },
  copy: { ar: "نسخ الرابط", en: "Copy link" },
  copied: { ar: "نُسخ الرابط.", en: "Link copied." },
  sendEmail: { ar: "أرسل بريداً", en: "Send email" },
  sendSms: { ar: "أرسل رسالة", en: "Send SMS" },
  sent: { ar: "أُرسل.", en: "Sent." },
  reissue: { ar: "أعد إصدار الرابط", en: "Reissue link" },
  reissueTitle: { ar: "إصدار رابط جديد؟", en: "Issue a new link?" },
  reissueBody: {
    ar: "يتوقّف الرابط الحالي فوراً، ويُفكّ أي ربط لم يكتمل، ويُرسل الرابط الجديد إلى وسائل التواصل الحالية.",
    en: "The current link stops working at once, any unfinished binding is released, and the new link goes to the current contacts.",
  },
  reissued: { ar: "صدر رابط جديد.", en: "A new link was issued." },

  // Logging an attempt.
  logTitle: { ar: "سجّل محاولة تواصل", en: "Log a contact attempt" },
  channel: { ar: "القناة", en: "Channel" },
  outcome: { ar: "النتيجة", en: "Outcome" },
  note: { ar: "ملاحظة", en: "Note" },
  notePlaceholder: {
    ar: "مثلاً: اتصلت بشقيقه وأكّد رقمه الجديد",
    en: "e.g. Called his brother, who confirmed the new number",
  },
  logSave: { ar: "سجّل", en: "Log it" },
  logged: { ar: "سُجّلت المحاولة.", en: "Attempt logged." },

  channelSms: { ar: "رسالة نصية", en: "SMS" },
  channelEmail: { ar: "بريد", en: "Email" },
  channelCall: { ar: "اتصال", en: "Call" },
  channelWhatsapp: { ar: "واتساب", en: "WhatsApp" },
  channelVisit: { ar: "زيارة", en: "Visit" },
  channelOther: { ar: "أخرى", en: "Other" },

  outcomeSent: { ar: "أُرسل", en: "Sent" },
  outcomeFailed: { ar: "فشل", en: "Failed" },
  outcomeReached: { ar: "تم الوصول", en: "Reached" },
  outcomeNoAnswer: { ar: "لا رد", en: "No answer" },
  outcomeWrongPerson: { ar: "شخص آخر", en: "Wrong person" },
  outcomeOther: { ar: "أخرى", en: "Other" },

  timelineTitle: { ar: "سجل التواصل", en: "Contact timeline" },
  timelineEmpty: { ar: "لا محاولات بعد.", en: "No attempts yet." },
  automatic: { ar: "تلقائي", en: "Automatic" },

  loading: { ar: "يفتح…", en: "Opening…" },
  failed: {
    ar: "تعذّر تنفيذ الإجراء. لم يتغيّر شيء.",
    en: "That did not go through. Nothing changed.",
  },
} as const satisfies Dictionary
