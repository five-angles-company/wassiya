import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.٦ — the heir's box, and the gate in front of it.
 *
 * The gate asks for nothing: identity was proved before the delivery became
 * ready, so opening is one action. What it states instead is the one fact a
 * reader should know before the contents appear — they decrypt on this device
 * and nowhere else, and the delivery closes on a date.
 */
export const HEIR_BOX = {
  // ---- the index ---------------------------------------------------------
  openBox: { ar: "افتح الصندوق", en: "Open the box" },

  // ---- the gate ----------------------------------------------------------
  gateTitle: {
    ar: "ما تركه لك جاهز",
    en: "What was left to you is ready",
  },
  gateBody: {
    ar: "تحقّقنا من هويتك ومن الوفاة. عند الفتح يُفكّ التشفير على جهازك هذا فقط — لا يمرّ المحتوى بخدمتنا مفتوحاً في أي لحظة.",
    en: "We have verified your identity and the death. When you open it, it decrypts on this device only — the contents never pass through our service in the clear.",
  },
  unlock: { ar: "افتح", en: "Open" },
  unlocking: { ar: "جارٍ الفتح…", en: "Opening…" },
  onDevice: {
    ar: "يُفتح على جهازك — لا يمرّ بخدمتنا",
    en: "Decrypted on your device, never on our service",
  },
  failed: {
    ar: "تعذّر الفتح الآن. حاول مرة أخرى بعد قليل.",
    en: "We couldn't open it just now. Try again shortly.",
  },
  closesOn: {
    ar: "يبقى متاحاً حتى {date}، ثم يُتلف مفتاحه نهائياً ولا يستطيع أحد فتحه — ولا نحن. نزّل ما تحتاجه قبل ذلك.",
    en: "It stays available until {date}; then its key is destroyed for good and nobody can open it, us included. Download what you need before then.",
  },

  // ---- opened ------------------------------------------------------------
  openTitle: { ar: "صندوقك مفتوح", en: "Your box is open" },
  openBody: {
    ar: "فُكّ التشفير على جهازك. هذه نسختك وحدك — لا ترى ما خُصّص لغيرك، ولا يرى غيرك ما خُصّص لك.",
    en: "Decrypted on your device. This is your copy alone — you can't see what was left to anyone else, and no one else can see what was left to you.",
  },
  itemCount: { ar: "{n} عنصراً", en: "{n} items" },

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
  messageFailed: {
    ar: "تعذّر فتح الرسالة. حاول مرة أخرى بعد قليل.",
    en: "We couldn't open the message. Try again shortly.",
  },
} as const satisfies Dictionary
