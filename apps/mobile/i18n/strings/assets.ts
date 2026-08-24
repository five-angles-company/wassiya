/**
 * ٤.١ — the assets list, and ٤.١b its empty state.
 *
 * Counted nouns are stored as the five flat `…Zero/One/Two/Few/Many` keys
 * rather than a nested object, because `useStrings` resolves a screen's table
 * one `{ar,en}` pair at a time. `i18n/plural.ts` reassembles them; see the note
 * there for why Arabic needs five and English three.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

export const ASSETS = {
  title: { ar: "أصولك", en: "Your assets" },

  // "٤٣ أصلاً" on the board — the 11+ form, which is where the naive
  // one/other split visibly breaks.
  countZero: { ar: "لا أصول", en: "No assets" },
  countOne: { ar: "أصل واحد", en: "1 asset" },
  countTwo: { ar: "أصلان", en: "2 assets" },
  countFew: { ar: "{n} أصول", en: "{n} assets" },
  countMany: { ar: "{n} أصلاً", en: "{n} assets" },

  searchPlaceholder: { ar: "ابحث في الأصول", en: "Search your assets" },

  // The filter chips name *categories*, so they are plural — where 4.2's tiles
  // name one thing you are about to create and stay singular.
  filterAll: { ar: "الكل", en: "All" },
  filterCrypto: { ar: "عملات رقمية", en: "Crypto" },
  filterBank: { ar: "بنوك", en: "Banks" },
  filterDocument: { ar: "مستندات", en: "Docs" },
  filterPhotos: { ar: "صور", en: "Photos" },
  filterDigital: { ar: "حسابات رقمية", en: "Accounts" },
  filterNote: { ar: "ملاحظات", en: "Notes" },

  // The one badge a row carries. "بلا مستلم" is the warning state: an asset
  // that reaches nobody is the outcome this product exists to prevent.
  recipientsZero: { ar: "بلا مستلم", en: "no recipient" },
  recipientsOne: { ar: "مستلم", en: "1 recipient" },
  recipientsTwo: { ar: "مستلمان", en: "2 recipients" },
  recipientsFew: { ar: "{n} مستلمين", en: "{n} recipients" },
  recipientsMany: { ar: "{n} مستلماً", en: "{n} recipients" },

  add: { ar: "أضف أصلاً", en: "Add an asset" },

  emptyTitle: {
    ar: "خزنتك فارغة — وهذا طبيعي",
    en: "Your vault is empty — that's normal",
  },
  emptyBody: {
    ar: "ابدأ بأصل واحد يهمّك. أكثر ما يبدأ به الناس: عقد ملكية أو محفظة رقمية.",
    en: "Start with one thing that matters. Most people begin with a title deed or a crypto wallet.",
  },
  emptyAction: { ar: "أضف أول أصل", en: "Add your first asset" },
  emptyBrowse: {
    ar: "أو استعرض الأنواع المتاحة",
    en: "Or browse the available types",
  },

  // Searching with no match. A different sentence from an empty vault: one is
  // a normal first day, the other means the thing you looked for isn't here.
  noResultsTitle: { ar: "لا يوجد ما يطابق بحثك", en: "Nothing matches" },
  noResultsBody: {
    ar: "جرّب كلمة أخرى، أو أزل عامل التصفية.",
    en: "Try another word, or clear the filter.",
  },
  clearFilters: { ar: "أظهر كل الأصول", en: "Show all assets" },

  // The locked state. The vault holds the key that decrypts every name on this
  // screen, so there is genuinely nothing to show until the user asks.
  lockedTitle: { ar: "خزنتك مقفلة", en: "Your vault is locked" },
  lockedBody: {
    ar: "أسماء أصولك مشفّرة بمفتاحك. افتح الخزنة ببصمتك لعرضها.",
    en: "Your asset names are encrypted with your key. Unlock with your fingerprint to see them.",
  },
  unlock: { ar: "افتح الخزنة", en: "Unlock" },
  unlocking: { ar: "جارٍ الفتح…", en: "Unlocking…" },

  // A row whose label will not open. Not a crash: the list still renders, and
  // the one broken row says so instead of the whole screen failing.
  undecryptable: { ar: "تعذّر فك التشفير", en: "Could not decrypt" },

  // 4.2 is a bottom sheet and lands in the next stage; the button is real, so
  // it has to say something true rather than do nothing.
  addSoonTitle: { ar: "إضافة الأصول قريباً", en: "Adding assets is coming next" },
  addSoonBody: {
    ar: "نماذج الأنواع الستة تُبنى الآن. خزنتك جاهزة، ومفتاحك في مكانه.",
    en: "The six type wizards are being built now. Your vault is ready and your key is in place.",
  },
  addSoonDismiss: { ar: "حسناً", en: "Got it" },
} satisfies LabelSet<string>
