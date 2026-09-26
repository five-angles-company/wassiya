import type { Dictionary } from "@/lib/i18n/locale"

export const SUPPORT = {
  helpTitle: { ar: "المساعدة", en: "Help" },
  helpIntro: {
    ar: "إجابات لأكثر ما يُسأل عنه. إن لم تجد ما تبحث عنه، راسلنا — يردّ عليك شخص من فريقنا.",
    en: "Answers to what people ask most. If yours is not here, write to us — a person on our team replies.",
  },
  questions: { ar: "أسئلة شائعة", en: "Common questions" },
  contactTitle: { ar: "راسلنا", en: "Write to us" },
  contactBody: {
    ar: "محادثة مكتوبة مع فريق وصيّة. نردّ عادةً خلال يوم عمل، ونُعلمك بالبريد عند الردّ.",
    en: "A written conversation with the Wassiya team. We usually reply within a working day and email you when we do.",
  },
  startChat: { ar: "ابدأ محادثة", en: "Start a conversation" },

  chatTitle: { ar: "محادثاتك معنا", en: "Your conversations with us" },
  chatIntro: {
    ar: "اكتب لنا ما تحتاجه، ويردّ عليك شخص من فريقنا.",
    en: "Tell us what you need, and a person on our team will reply.",
  },
  threadsTitle: { ar: "محادثاتك", en: "Your conversations" },
  newChat: { ar: "محادثة جديدة", en: "New conversation" },
  loadMore: { ar: "المزيد", en: "More" },
  loadOlder: { ar: "رسائل أقدم", en: "Older messages" },

  name: { ar: "اسمك", en: "Your name" },
  email: { ar: "بريدك الإلكتروني", en: "Your email" },
  emailHint: {
    ar: "نراسلك عليه عند الردّ. لا نستخدمه للتحقق من أي حساب.",
    en: "We email you here when we reply. It is not used to look up any account.",
  },
  topic: { ar: "الموضوع", en: "Topic" },
  message: { ar: "رسالتك", en: "Your message" },
  messagePlaceholder: {
    ar: "اكتب ما تحتاجه، دون أي رموز أو كلمات مرور.",
    en: "Tell us what you need — no codes or passwords.",
  },
  send: { ar: "إرسال", en: "Send" },
  sending: { ar: "يُرسَل…", en: "Sending…" },
  attach: { ar: "أرفق صورة أو PDF", en: "Attach an image or PDF" },
  removeFile: { ar: "إزالة الملف", en: "Remove file" },
  attachLater: {
    ar: "يمكنك إرفاق صور أو ملفات PDF بعد بدء المحادثة.",
    en: "You can attach images or PDFs once the conversation has started.",
  },
  signInHint: {
    ar: "لديك حساب؟ سجّل الدخول ليرتبط سؤالك ببلاغك أو تسليمك.",
    en: "Have an account? Sign in so your question is linked to your report or delivery.",
  },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },

  topicAccount: { ar: "حسابي", en: "My account" },
  topicKyc: { ar: "التحقق من الهوية", en: "Identity check" },
  topicBilling: { ar: "الاشتراك", en: "Billing" },
  topicRecovery: { ar: "الاسترداد", en: "Recovery" },
  topicClaim: { ar: "بلاغ وفاة", en: "A death report" },
  topicDelivery: { ar: "تسليم بصفتي وصيّاً", en: "A handover, as executor" },
  topicOther: { ar: "شيء آخر", en: "Something else" },

  statusOpen: { ar: "بانتظار ردّنا", en: "Waiting for us" },
  statusWaiting: { ar: "وصلك ردّ", en: "We replied" },
  statusResolved: { ar: "مُغلقة", en: "Closed" },
  newReply: { ar: "ردّ جديد", en: "New reply" },

  us: { ar: "فريق وصيّة", en: "Wassiya team" },
  you: { ar: "أنت", en: "You" },
  replyPlaceholder: { ar: "اكتب ردّك…", en: "Write your reply…" },
  closedNote: {
    ar: "أُغلقت هذه المحادثة. إن كتبت فيها تُفتح من جديد.",
    en: "This conversation is closed. Writing in it opens it again.",
  },
  filesPurged: {
    ar: "حُذفت مرفقات هذه المحادثة بعد انتهاء مدة الاحتفاظ بها.",
    en: "This conversation's files were deleted when their retention period ended.",
  },
  backToList: { ar: "كل المحادثات", en: "All conversations" },
  notFound: {
    ar: "لم نجد هذه المحادثة في هذا المتصفّح. إن وصلك رابط بالبريد، افتحه من جديد.",
    en: "We could not find this conversation in this browser. If you got a link by email, open it again.",
  },
  resuming: { ar: "نفتح المحادثة…", en: "Opening the conversation…" },
  resumeSignedIn: {
    ar: "هذا الرابط لمحادثة بدأت دون حساب. سجّل الخروج لفتحها في هذا المتصفّح.",
    en: "This link is for a conversation started without an account. Sign out to open it in this browser.",
  },
  resumeFailed: {
    ar: "انتهت صلاحية هذا الرابط. كل رابط يعمل مرة واحدة — سيصلك رابط جديد مع الردّ التالي.",
    en: "This link has expired. Each link works once — a new one comes with the next reply.",
  },

  // The line under every composer. Chat is not end-to-end encrypted, and the
  // sheets are bearer tokens — the executor's and the owner's recovery sheet.
  guardrail: {
    ar: "هذه المحادثة لا تحظى بحماية الخزنة — يقرؤها فريقنا. لن نطلب منك أبداً ورقة الوصي أو ورقة الاسترداد أو رموزهما أو كلمات مرورك.",
    en: "This chat isn't protected like a vault — our team reads it. We'll never ask for an executor sheet, a recovery sheet, their codes or your passwords.",
  },
  recoveryWarning: {
    ar: "يبدو أن رسالتك فيها رمز ورقة وصيّ أو ورقة استرداد. احذفه — لا أحد في وصيّة يحتاجه، ومن يملكه يستطيع فتح ما تحميه الورقة.",
    en: "Your message seems to contain the code from an executor or recovery sheet. Remove it — nobody at Wassiya needs it, and whoever has it can open what the sheet protects.",
  },
  refusedGuest: {
    ar: "تحقّق من الاسم والبريد الإلكتروني.",
    en: "Check your name and email address.",
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
  failed: { ar: "لم تُرسل. حاول مرة أخرى.", en: "That wasn't sent. Please try again." },
} as const satisfies Dictionary
