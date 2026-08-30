import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.٦ — the heir's box, and the gate in front of it.
 *
 * The whole screen exists to make one fact feel like custody rather than an
 * obstacle: **the guardian holding half the key is the reason nobody — this
 * company included — can open the box alone.** The board's closing line is the
 * design in six words: *"اثنان لا واحد"*, two and never one.
 *
 * So the copy names the guardian. "Ask the guardian" is a chore; "ask Khaled,
 * Fatima's guardian, who has it written on a sheet" is a phone call to a person
 * the reader probably knows.
 */
export const HEIR_BOX = {
  metaTitle: { ar: "صندوقك · وصيّة", en: "Your box · Wassiya" },
  boxOf: { ar: "صندوق {name}", en: "{name}'s box" },

  gateTitle: {
    ar: "يحتاج فتح الصندوق نصفين",
    en: "Opening the box takes two halves",
  },
  gateBody: {
    ar: "لا نستطيع فتح صندوقك وحدنا — وهذا مقصود. نحفظ نصف المفتاح ولم نُطلقه إلا الآن بعد اكتمال البلاغ، والنصف الآخر عند الوصي.",
    en: "We can't open your box alone — by design. We hold one half of the key and only released it now that the report is complete; the other half is with the guardian.",
  },
  shareLabel: { ar: "أدخل نصف المفتاح من الوصي", en: "Enter the key half from the guardian" },
  sharePlaceholder: { ar: "WSYH2-····-····", en: "WSYH2-····-····" },
  unlock: { ar: "افتح الصندوق", en: "Open the box" },
  unlocking: { ar: "جارٍ الفتح…", en: "Opening…" },
  onDevice: {
    ar: "يُفتح على جهازك — لا يمرّ بخدمتنا",
    en: "Decrypted on your device, never on our service",
  },

  badShare: {
    ar: "لم يفتح هذا النصف الصندوق. تأكّد أنك نسخته كاملاً كما أعطاك إياه الوصي.",
    en: "That half didn't open the box. Check you copied all of it, exactly as the guardian gave it to you.",
  },
  failed: {
    ar: "تعذّر فتح الصندوق الآن. حاول مرة أخرى بعد قليل.",
    en: "We couldn't open the box just now. Try again shortly.",
  },

  askTitle: { ar: "لا تعرف كيف تطلبه؟", en: "Not sure how to ask for it?" },
  askBody: {
    ar: "أبلغنا الوصي بأن صندوقك جاهز، وطلبنا منه تسليم نصفه. اتصل به أو أرسل له رسالة — النصف مكتوب على ورقة معه، ويستطيع إرساله من لوحته.",
    en: "We've told the guardian your box is ready and asked them to hand over their half. Call or message them — the half is on a printed sheet they keep, and they can send it from their own dashboard.",
  },
  nudge: { ar: "ذكّر الوصي مرة أخرى", en: "Nudge the guardian again" },
  cannotReach: { ar: "لا أستطيع الوصول إليه", en: "I can't reach them" },

  // The ink panel: the mechanism, drawn.
  howTitle: { ar: "how your box opens", en: "how your box opens" },
  ourHalf: { ar: "نصفنا", en: "Our half" },
  ourHalfMeta: {
    ar: "أُطلق بعد اكتمال البلاغ",
    en: "released once the report completed",
  },
  guardianHalf: { ar: "نصف الوصي", en: "Guardian's half" },
  guardianHalfMeta: { ar: "على ورقة عنده", en: "on a sheet they keep" },
  opensHere: {
    ar: "يُفتح صندوقك على جهازك",
    en: "Your box opens on your device",
  },
  opensHereMeta: {
    ar: "لا يمرّ محتواه بخدمتنا في أي لحظة",
    en: "Its contents never pass through our service",
  },
  twoNotOne: {
    ar: "لهذا لا نستطيع فتح صندوقك بأمر منّا وحدنا، ولا يستطيع الوصي فتحه وحده. اثنان لا واحد.",
    en: "This is why we cannot open your box on our own say-so, and the guardian cannot open it on theirs. Two, never one.",
  },

  // Opened.
  openTitle: { ar: "صندوقك مفتوح", en: "Your box is open" },
  openBody: {
    ar: "فُكّ التشفير على جهازك. هذه نسختك وحدك — لا ترى ما خُصّص لغيرك، ولا يرى غيرك ما خُصّص لك.",
    en: "Decrypted on your device. This is your copy alone — you can't see what was left to anyone else, and no one else can see what was left to you.",
  },
  keyCount: { ar: "{n} عنصراً بانتظارك", en: "{n} items waiting for you" },
  expiry: {
    ar: "يبقى هذا الصندوق متاحاً ٩٠ يوماً من تاريخ التسليم.",
    en: "This box stays available for 90 days from release.",
  },

  notReleased: {
    ar: "لم يُسلَّم هذا الصندوق بعد.",
    en: "This box hasn't been released yet.",
  },
  checkStatus: { ar: "تابع حالة البلاغ", en: "Follow the report" },
  signInFirst: {
    ar: "سجّل الدخول بالحساب الذي قدّمت به البلاغ.",
    en: "Sign in with the account you filed the report with.",
  },
  signIn: { ar: "تسجيل الدخول", en: "Sign in" },
} as const satisfies Dictionary
