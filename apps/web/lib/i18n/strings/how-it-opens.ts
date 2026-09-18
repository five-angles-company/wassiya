import type { Dictionary } from "@/lib/i18n/locale"

/**
 * The two-halves diagram's own labels.
 *
 * Shared rather than living in `features/box`, because two features draw this
 * diagram: the case page shows it at the release step, where an heir first
 * learns a second half exists, and the gate shows it again at the moment they
 * use one. The words have to be identical in both — a reader who meets the same
 * explanation twice in different terms learns it was never quite the mechanism.
 *
 * `twoNotOne` is the product's central claim, stated where it can be
 * demonstrated rather than asserted. It is the one line here that is an
 * argument rather than a label.
 */
export const HOW_IT_OPENS = {
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
} as const satisfies Dictionary
