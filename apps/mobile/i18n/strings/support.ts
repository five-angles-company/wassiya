/**
 * ٩.٦ — المساعدة والدعم.
 *
 * Support is a written conversation with staff, and the one place in this app
 * where text leaves the device unencrypted. Every composer says so, and says
 * that nobody will ask for the recovery sheet — the sheet is a bearer token, and
 * a support channel is where someone would try to phish for it.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٩.٦ — the help index: questions, then conversations. */
export const HELP = {
  title: { ar: "المساعدة والدعم", en: "Help & support" },
  questions: { ar: "أسئلة شائعة", en: "Common questions" },
  conversations: { ar: "محادثاتك", en: "Your conversations" },
  newConversation: { ar: "راسل فريق وصيّة", en: "Write to the Wassiya team" },
  newConversationDetail: {
    ar: "يردّ عليك شخص، عادةً خلال يوم عمل",
    en: "A person replies, usually within a working day",
  },
  newReply: { ar: "ردّ جديد", en: "New reply" },
  statusOpen: { ar: "بانتظار ردّنا", en: "Waiting for us" },
  statusWaiting: { ar: "وصلك ردّ", en: "We replied" },
  statusResolved: { ar: "مُغلقة", en: "Closed" },
  loadMore: { ar: "المزيد", en: "More" },
} satisfies LabelSet<string>

/** ٩.٦b — a new conversation. */
export const SUPPORT_NEW = {
  title: { ar: "رسالة جديدة", en: "New message" },
  topic: { ar: "عن ماذا؟", en: "About what?" },
  message: { ar: "رسالتك", en: "Your message" },
  placeholder: {
    ar: "اكتب ما تحتاجه، دون أي رموز أو كلمات مرور.",
    en: "Tell us what you need — no codes or passwords.",
  },
  send: { ar: "إرسال", en: "Send" },
  attachLater: {
    ar: "يمكنك إرفاق صور أو ملفات PDF بعد بدء المحادثة.",
    en: "You can attach images or PDFs once the conversation has started.",
  },
} satisfies LabelSet<string>

/** ٩.٦c — one conversation. */
export const SUPPORT_THREAD = {
  us: { ar: "فريق وصيّة", en: "Wassiya team" },
  you: { ar: "أنت", en: "You" },
  placeholder: { ar: "اكتب ردّك…", en: "Write your reply…" },
  send: { ar: "إرسال", en: "Send" },
  attach: { ar: "إرفاق", en: "Attach" },
  attachPhoto: { ar: "صورة", en: "Photo" },
  attachFile: { ar: "ملف PDF", en: "PDF file" },
  loadOlder: { ar: "رسائل أقدم", en: "Older messages" },
  closed: {
    ar: "أُغلقت هذه المحادثة. إن كتبت فيها تُفتح من جديد.",
    en: "This conversation is closed. Writing in it opens it again.",
  },
  filesPurged: {
    ar: "حُذفت مرفقات هذه المحادثة بعد انتهاء مدة الاحتفاظ بها.",
    en: "This conversation's files were deleted when their retention period ended.",
  },
  notFound: { ar: "لم نجد هذه المحادثة.", en: "We could not find this conversation." },
} satisfies LabelSet<string>

/** Shared by both composers and every support error. */
export const SUPPORT_COMMON = {
  topicAccount: { ar: "حسابي", en: "My account" },
  topicKyc: { ar: "التحقق من الهوية", en: "Identity check" },
  topicBilling: { ar: "الاشتراك", en: "Subscription" },
  topicRecovery: { ar: "الاسترداد والأجهزة", en: "Recovery and devices" },
  topicClaim: { ar: "بلاغ وفاة", en: "A death report" },
  topicDelivery: { ar: "تسليم", en: "A delivery" },
  topicOther: { ar: "شيء آخر", en: "Something else" },
  guardrail: {
    ar: "هذه المحادثة ليست مشفّرة كالخزنة، والمرفقات كذلك. لن نطلب منك أبداً وثيقة الاسترداد أو رموزها.",
    en: "This conversation and its files are not encrypted like the vault. We will never ask for your recovery sheet or its code.",
  },
  recoveryWarning: {
    ar: "يبدو أن رسالتك تحتوي رمز وثيقة استرداد. احذفه — لا أحد في وصيّة يحتاجه، ومن يحمله يستطيع فتح خزنتك.",
    en: "Your message looks like it contains a recovery sheet code. Remove it — nobody at Wassiya needs it, and whoever holds it can open your vault.",
  },
  refusedAttachment: {
    ar: "الملف غير مقبول: صور أو PDF حتى ١٠ م.ب، خمسة كحدّ أقصى.",
    en: "That file cannot be sent: images or PDFs up to 10 MB, five at most.",
  },
  refusedTooLong: { ar: "الرسالة طويلة جداً.", en: "The message is too long." },
  rateLimited: {
    ar: "أرسلت كثيراً في وقت قصير. حاول بعد قليل.",
    en: "Too many messages in a short time. Try again shortly.",
  },
  failed: { ar: "تعذّر الإرسال. حاول مرة أخرى.", en: "That could not be sent. Try again." },
} satisfies LabelSet<string>
