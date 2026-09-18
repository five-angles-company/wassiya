import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.٦ — the heir's box, and the gate in front of it.
 *
 * The whole screen exists to make one fact feel like custody rather than an
 * obstacle: **the guardian holding half the key is the reason nobody — this
 * company included — can open the box alone.** The closing line is the
 * design in three words: *"اثنان لا واحد"*, two and never one.
 *
 * After the gate the copy stops explaining and starts delivering. Everything
 * below `openTitle` is about *things* — named, sized, downloadable — because
 * the moment the halves meet is the moment the product stops being a promise.
 */
export const HEIR_BOX = {
  // ---- the index ---------------------------------------------------------
  openBox: { ar: "افتح الصندوق", en: "Open the box" },

  // ---- the gate ----------------------------------------------------------
  gateTitle: {
    ar: "يحتاج فتح الصندوق نصفين",
    en: "Opening the box takes two halves",
  },
  gateBody: {
    ar: "لا نستطيع فتح صندوقك وحدنا — وهذا مقصود. نحفظ نصف المفتاح ولم نُطلقه إلا الآن بعد اكتمال البلاغ، والنصف الآخر عند الوصي.",
    en: "We can't open your box alone — by design. We hold one half of the key and only released it now that the report is complete; the other half is with the guardian.",
  },
  shareLabel: {
    ar: "أدخل نصف المفتاح من الوصي",
    en: "Enter the key half from the guardian",
  },
  sharePlaceholder: { ar: "····", en: "····" },
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
  notReleased: {
    ar: "لم يُسلَّم هذا الصندوق بعد.",
    en: "This box hasn't been released yet.",
  },

  askTitle: { ar: "لا تعرف كيف تطلبه؟", en: "Not sure how to ask for it?" },
  askBody: {
    ar: "أبلغنا الوصي بأن صندوقك جاهز، وطلبنا منه تسليم نصفه. اتصل به أو أرسل له رسالة — النصف مكتوب على ورقة معه، ويستطيع نسخه من صفحته.",
    en: "We've told the guardian your box is ready and asked them to hand over their half. Call or message them — the half is on a printed sheet they keep, and they can copy it from their own page.",
  },

  // The mechanism, drawn. This is the one place in the product where exposing
  // how the cryptography works builds trust instead of confusing — because the
  // reader is standing in front of the exact gate it explains.
  howTitle: { ar: "كيف يُفتح صندوقك", en: "How your box opens" },
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

  // ---- opened ------------------------------------------------------------
  openTitle: { ar: "صندوقك مفتوح", en: "Your box is open" },
  openBody: {
    ar: "فُكّ التشفير على جهازك. هذه نسختك وحدك — لا ترى ما خُصّص لغيرك، ولا يرى غيرك ما خُصّص لك.",
    en: "Decrypted on your device. This is your copy alone — you can't see what was left to anyone else, and no one else can see what was left to you.",
  },
  itemCount: { ar: "{n} عنصراً", en: "{n} items" },
  expiry: {
    ar: "يبقى هذا الصندوق متاحاً ٩٠ يوماً من تاريخ التسليم.",
    en: "This box stays available for 90 days from release.",
  },

  // A routed asset the bundle carries no key for. Not an error the reader can
  // act on, and not something to hide either: the row stays, named by its type,
  // so the count on the page matches the count in the vault.
  noKeyTitle: { ar: "عنصر بلا مفتاح", en: "An item with no key" },
  noKeyBody: {
    ar: "وُجّه إليك، لكن مفتاحه ليس في هذه الحزمة. راسلنا بالمرجع أعلاه.",
    en: "It was routed to you, but its key is not in this bundle. Contact us with the reference above.",
  },

  viaDirect: { ar: "خُصّص لك", en: "Routed to you" },
  viaAllHeirs: { ar: "لجميع الورثة", en: "To all heirs" },

  download: { ar: "حمّل", en: "Download" },
  downloading: { ar: "جارٍ التنزيل…", en: "Downloading…" },
  downloadFailed: {
    ar: "تعذّر التنزيل. حاول مرة أخرى.",
    en: "The download failed. Try again.",
  },
  noContent: {
    ar: "لا ملف مرفق — هذا العنصر ملاحظة داخل الخزنة.",
    en: "No file attached — this item is a note held inside the vault.",
  },
  instructionsNote: {
    ar: "مع هذا العنصر تعليمات كتبها لك صاحب الخزنة.",
    en: "This item came with instructions the vault's owner wrote for you.",
  },

  // Asset types. The label itself is encrypted, so the type is the only thing
  // that can be rendered before the DEK arrives.
  typeCrypto: { ar: "عملات رقمية", en: "Crypto" },
  typeBank: { ar: "حساب بنكي", en: "Bank account" },
  typeDocument: { ar: "مستند", en: "Document" },
  typePhotos: { ar: "صور", en: "Photos" },
  typeDigital: { ar: "حساب رقمي", en: "Digital account" },
  typeNote: { ar: "ملاحظة", en: "Note" },

  messageTitle: { ar: "رسالة تركها لك", en: "A message left for you" },
  messageBody: {
    ar: "سجّل صاحب الخزنة رسالة شخصية موجّهة إليك. مفتاحها في هذه الحزمة.",
    en: "The vault's owner recorded a personal message addressed to you. Its key is in this bundle.",
  },
} as const satisfies Dictionary
