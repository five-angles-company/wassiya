import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٧.٦ — the heir's box, after release.
 *
 * `scope` states the ceiling before anything is shown, and `farAid` states the
 * one the product will not cross: Wassiya hands over *access*, and the division
 * of value is the law's business, not the app's. Neither line is decoration —
 * they are the product rule "routing, not shares" written where the heir reads
 * it.
 */
export const HEIR_BOX = {
  metaTitle: { ar: "صندوق الوارث · وصيّة", en: "Heir's box · Wassiya" },
  boxOf: { ar: "صندوقك · {name}", en: "Your box · {name}" },
  releasedAt: { ar: "أُفرج {date}", en: "Released {date}" },
  heading: { ar: "ما تركه لك {owner}", en: "What {owner} left you" },
  scope: {
    ar: "هذه نسختك وحدك — لا ترى ما خُصّص لغيرك، ولا يرى غيرك ما خُصّص لك.",
    en: "This is your copy alone — you cannot see what was left to anyone else, and no one else can see what was left to you.",
  },

  // The key ceremony. The board draws the opened box; the security model
  // requires this step to reach it.
  lockedTitle: { ar: "أدخل نصيب الوصي", en: "Enter the guardian's share" },
  lockedBody: {
    ar: "نحتفظ بنصف مفتاح صندوقك فقط. النصف الآخر لدى الوصي — اطلبه منه وأدخله هنا. لا نستطيع فتح الصندوق بدونه، ولا نحتفظ بنسخة منه.",
    en: "We hold only half of your box's key. The guardian holds the other half — ask them for it and enter it here. We cannot open the box without it, and we keep no copy of it.",
  },
  shareLabel: { ar: "نصيب الوصي", en: "The guardian's share" },
  sharePlaceholder: {
    ar: "الصق النصيب الذي أعطاك إياه الوصي",
    en: "Paste the share the guardian gave you",
  },
  unlock: { ar: "افتح الصندوق", en: "Open the box" },
  unlocking: { ar: "جارٍ الفتح…", en: "Opening…" },
  badShare: {
    ar: "لم ينجح هذا النصيب في فتح الصندوق. تأكد أنك نسخته كاملاً من الوصي.",
    en: "That share did not open the box. Check that you copied all of it from the guardian.",
  },

  messageTitle: { ar: "رسالة لك وحدك", en: "A message for you alone" },
  assetsTitle: {
    ar: "أصول خُصّصت لك — {n}",
    en: "Assets left to you — {n}",
  },
  downloadAll: { ar: "تحميل كل شيء", en: "Download everything" },
  colAsset: { ar: "الأصل", en: "Asset" },
  colType: { ar: "النوع", en: "Type" },
  colHandover: { ar: "الاستلام", en: "Handover" },
  colState: { ar: "الحالة", en: "State" },
  stateOpen: { ar: "مفتوح", en: "Open" },
  stateSteps: { ar: "يحتاج خطوات", en: "Needs steps" },
  download: { ar: "تحميل", en: "Download" },
  howTo: { ar: "كيف أستردها؟", en: "How do I recover it?" },

  farAid: {
    ar: "تقسيم القيمة بينكم يتم وفق الفرائض وبإجراءات الإرث المعتادة — وصيّة سلّمتك الوصول فقط.",
    en: "Dividing the value between you follows the law of inheritance and the usual estate procedures — Wassiya has handed you access, nothing more.",
  },
  expiry: {
    ar: "يبقى هذا الصندوق متاحاً ٩٠ يوماً، فحمّل ما يهمّك.",
    en: "This box stays available for 90 days, so download what matters to you.",
  },

  notReleased: {
    ar: "لم يُفرج عن هذا الصندوق بعد.",
    en: "This box has not been released yet.",
  },
  checkStatus: { ar: "تابع حالة الطلب", en: "Follow the claim status" },
} as const satisfies Dictionary
