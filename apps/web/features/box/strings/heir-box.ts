import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The heir's box, and the step in front of it.
 *
 * ⚠️ Escrow honesty (AGENTS.md): at release Wassiya *does* open what was set
 * aside for this heir, to hand it over. Nothing here may say Wassiya cannot open
 * it or holds no key. What is true, and said: only this heir's items are
 * opened, the contents open on this device, and after a year the key is gone.
 */
export const HEIR_BOX = {
  gateEyebrow: { ar: "جاهز لك", en: "Ready for you" },
  gateTitle: { ar: "ما تُرك لك جاهز", en: "What was left for you is ready" },
  gateBody: {
    ar: "تأكدنا من الوفاة ومن هويتك. عند الفتح، نفتح لك ما خُصّص لك وحدك، ويظهر المحتوى على جهازك هذا.",
    en: "We've confirmed the death and who you are. When you open it, we open only what was set aside for you, and the contents appear on this device.",
  },
  unlock: { ar: "افتح", en: "Open" },
  unlocking: { ar: "جارٍ الفتح…", en: "Opening…" },
  onDevice: { ar: "يُفتح على جهازك", en: "Opens on your device" },
  failed: { ar: "لم يُفتح الآن. حاول مرة أخرى بعد قليل.", en: "It didn't open just now. Please try again shortly." },
  closesOn: {
    ar: "يبقى متاحاً حتى {date}، ثم يُحذف مفتاحه نهائياً ولا يستطيع أحد فتحه — ولا نحن. نزّل ما تحتاجه قبل ذلك.",
    en: "It stays available until {date}. Then its key is deleted for good and nobody can open it — not even us. Download what you need before then.",
  },

  openTitle: { ar: "صندوقك مفتوح", en: "Your box is open" },
  openBody: {
    ar: "هذه نسختك وحدك — لا ترى ما خُصّص لغيرك، ولا يرى غيرك ما خُصّص لك.",
    en: "This is your copy alone — you can't see what was left to anyone else, and no one else can see what was left to you.",
  },
  itemCount: { ar: "{n} عنصراً", en: "{n} items" },

  // An item routed to this heir with no key in their box. Kept on screen, named
  // by its type, so the count here matches the count in the vault.
  noKeyTitle: { ar: "عنصر لم نستطع فتحه", en: "An item we couldn't open" },
  noKeyBody: {
    ar: "خُصّص لك، لكنه لم يُفتح. راسلنا واذكر المرجع المكتوب تحته.",
    en: "It was set aside for you but didn't open. Write to us with the reference shown below it.",
  },

  viaDirect: { ar: "خُصّص لك", en: "Set aside for you" },
  viaAllHeirs: { ar: "لكل الورثة", en: "For all heirs" },

  download: { ar: "نزّل", en: "Download" },
  downloading: { ar: "جارٍ التنزيل…", en: "Downloading…" },
  downloadFailed: { ar: "لم يكتمل التنزيل. حاول مرة أخرى.", en: "The download didn't finish. Please try again." },
  noContent: {
    ar: "لا ملف مرفق — هذا العنصر ملاحظة مكتوبة.",
    en: "No file attached — this item is a written note.",
  },
  instructionsNote: {
    ar: "كتب لك صاحب الخزنة تعليمات مع هذا العنصر.",
    en: "The vault's owner wrote you instructions with this item.",
  },

  // The item's own title is encrypted, so its type is the only name available
  // before the box opens.
  typeCrypto: { ar: "عملات رقمية", en: "Crypto" },
  typeBank: { ar: "حساب بنكي", en: "Bank account" },
  typeDocument: { ar: "مستند", en: "Document" },
  typePhotos: { ar: "صور", en: "Photos" },
  typeDigital: { ar: "حساب إلكتروني", en: "Online account" },
  typeNote: { ar: "ملاحظة", en: "Note" },

  messageTitle: { ar: "رسالة تركها لك", en: "A message left for you" },
  messageFailed: {
    ar: "لم تُفتح الرسالة الآن. حاول مرة أخرى بعد قليل.",
    en: "The message didn't open just now. Please try again shortly.",
  },
} as const satisfies Dictionary
