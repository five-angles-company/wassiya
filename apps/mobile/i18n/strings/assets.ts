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
  // Matches the tab. The screen was "أصولك" while the tab said "الخزنة".
  title: { ar: "الخزنة", en: "Vault" },

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
  // Destination groups. A heading says where its bucket *goes*, so rows inside
  // don't repeat it — only "بلا وجهة" carries a per-row badge, because there
  // the count is the whole point.
  // The header line. Not a count — whether anything reaches nobody.
  headerAllRouted: { ar: "كل شيء له وجهة", en: "Everything has a destination" },
  headerUnrouted: { ar: "{n} بلا وجهة", en: "{n} with no destination" },

  groupNone: { ar: "بلا وجهة", en: "No destination" },
  groupAll: { ar: "إلى جميع الورثة", en: "To all heirs" },
  groupExplicit: { ar: "موجَّهة", en: "Routed" },

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

} satisfies LabelSet<string>

/**
 * ٤.٢ — "ما الذي تريد حفظه؟", the type picker.
 *
 * A bottom sheet rather than a route, per the board: back dismisses it without
 * losing the list's scroll position. Its own dictionary because it is its own
 * screen in the board's numbering, even though it has no URL.
 *
 * Type names here are **singular** — you are about to create one thing. The
 * filter chips in `ASSETS` name categories and stay plural. Same six types,
 * deliberately different words.
 */
export const ADD_ASSET = {
  title: { ar: "ما الذي تريد حفظه؟", en: "What do you want to keep safe?" },
  description: {
    ar: "كل نوع له نموذج مختلف — نطلب فقط ما يحتاجه الوارث فعلاً.",
    en: "Each type has its own form — we only ask for what an heir will actually need.",
  },

  crypto: { ar: "عملات رقمية", en: "Crypto" },
  cryptoHint: { ar: "محافظ ومنصات", en: "Wallets and exchanges" },
  bank: { ar: "حساب بنكي", en: "Bank account" },
  bankHint: { ar: "آيبان وتعليمات", en: "IBAN and instructions" },
  document: { ar: "مستند", en: "Document" },
  documentHint: { ar: "عقود وشهادات", en: "Contracts and certificates" },
  photos: { ar: "صور", en: "Photos" },
  photosHint: { ar: "ألبومات مشفّرة", en: "Encrypted albums" },
  digital: { ar: "حساب رقمي", en: "Digital account" },
  digitalHint: { ar: "بريد، نطاقات، اشتراكات", en: "Email, domains, subscriptions" },
  note: { ar: "ملاحظة", en: "Note" },
  noteHint: { ar: "وصايا وأماكن أشياء", en: "Wishes and where things are" },

  // 4.3–4.8 are the six wizards behind these tiles and are not built. Naming
  // the chosen type is what keeps this from reading as a broken tile.
  soonTitle: { ar: "هذا النموذج قيد الإنشاء", en: "This form is being built" },
  soonBody: {
    ar: "نموذج «{type}» يصل في المرحلة التالية. خزنتك جاهزة ومفتاحك في مكانه.",
    en: "The “{type}” form arrives in the next stage. Your vault is ready and your key is in place.",
  },
  soonDismiss: { ar: "حسناً", en: "Got it" },
} satisfies LabelSet<string>

/**
 * ٤.٩ — the asset detail.
 *
 * Two-tier by design: the identity row decrypts when the screen opens, and the
 * secret needs a fresh biometric that hides itself after ten seconds. The
 * "آخر إظهار" stamp is the visible end of the audit trail every reveal writes.
 */
export const ASSET_DETAIL = {
  // Row labels for the asset's grouped list.
  toLabel: { ar: "إلى", en: "To" },
  lastOpenedLabel: { ar: "آخر فتح", en: "Last opened" },
  filesRowLabel: { ar: "الملفات", en: "Files" },
  // The live countdown, replacing a static "يختفي بعد ١٠ ثوانٍ" — a timer the
  // owner can watch is one they do not walk away from.
  countdown: { ar: "يختفي بعد {n} ثوانٍ", en: "Hides in {n}s" },

  secretLabel: { ar: "المحتوى المحمي", en: "Protected content" },
  revealPrompt: { ar: "المس البصمة للإظهار", en: "Touch to reveal" },
  // The OS sheet's own message — it says what is about to be shown.
  biometricPrompt: {
    ar: "أثبت هويتك لإظهار محتوى هذا الأصل",
    en: "Confirm it's you to reveal this asset",
  },
  revealTerms: {
    ar: "{n} ثوانٍ · محجوبة عن لقطات الشاشة",
    en: "{n} seconds · hidden from screenshots",
  },
  lastRevealed: { ar: "آخر إظهار {date}", en: "Last revealed {date}" },
  neverRevealed: { ar: "لم يُعرض بعد", en: "Never revealed" },
  hide: { ar: "إخفاء", en: "Hide" },
  revealing: { ar: "لحظة…", en: "One moment…" },
  revealDenied: {
    ar: "لم يتم التحقق. لم يُعرض شيء ولم يُفك تشفير شيء.",
    en: "Not verified. Nothing was shown and nothing was decrypted.",
  },
  revealFailed: {
    ar: "تعذّر فتح المحتوى. إن تكرّر ذلك فقد يكون الملف تالفاً.",
    en: "Could not open the content. If this repeats, the file may be damaged.",
  },

  // File-backed types have no phrase to peek at; opening them needs a viewer
  // that does not exist yet, so the row says what is stored rather than
  // offering a button that cannot deliver.
  filesCount: { ar: "{n} ملف · {size}", en: "{n} files · {size}" },
  viewerSoon: {
    ar: "عرض الملفات داخل التطبيق يصل في مرحلة لاحقة",
    en: "In-app file viewing arrives in a later stage",
  },

  // Field labels for a revealed secret. Before these existed the screen
  // printed the stored JSON, key names and all.
  // The two section headings. "من يستلمه بعدك" is the sentence that makes this
  // an inheritance vault rather than a password manager.
  handoverLabel: { ar: "من يستلمه بعدك", en: "Who receives it after you" },
  contentLabel: { ar: "المحتوى المحمي", en: "Protected content" },

  fieldService: { ar: "الخدمة", en: "Service" },
  fieldUsername: { ar: "اسم المستخدم", en: "Username" },
  fieldPassword: { ar: "كلمة المرور", en: "Password" },
  fieldTwoFactor: { ar: "التحقق بخطوتين", en: "Two-factor" },
  fieldRecoveryCodes: { ar: "رموز الاسترداد", en: "Recovery codes" },
  fieldDisposition: { ar: "ما يُفعل بالحساب", en: "What to do with it" },
  fieldBank: { ar: "المصرف", en: "Bank" },
  fieldIban: { ar: "الآيبان", en: "IBAN" },
  fieldAccountType: { ar: "نوع الحساب", en: "Account type" },
  fieldBranch: { ar: "الفرع", en: "Branch" },
  fieldCurrency: { ar: "العملة", en: "Currency" },
  fieldInstructions: { ar: "تعليمات", en: "Instructions" },
  fieldNetwork: { ar: "الشبكة", en: "Network" },
  fieldAccount: { ar: "الحساب", en: "Account" },
  fieldBody: { ar: "النص", en: "Text" },

  recipientsLabel: { ar: "من يستلمه؟", en: "Who receives it?" },
  recipientsNone: { ar: "بلا مستلم", en: "No recipient" },
  recipientsNoneBody: {
    ar: "لن يصل هذا الأصل إلى أحد. اختر من يستلمه.",
    en: "This asset reaches nobody. Choose who receives it.",
  },
  recipientsEdit: { ar: "من يستلمه؟", en: "Who receives it?" },

  deleteLabel: { ar: "حذف الأصل", en: "Delete asset" },
  deleteTitle: { ar: "حذف هذا الأصل؟", en: "Delete this asset?" },
  deleteBodyUnrouted: {
    ar: "سيُحذف المحتوى المشفّر نهائياً. لا يمكن التراجع.",
    en: "The encrypted content is destroyed permanently. This cannot be undone.",
  },
  // Names the people who lose access, per the board — the point of the confirm
  // is that deletion is a decision about *recipients*, not about storage.
  deleteBodyRouted: {
    ar: "سيفقد {names} إمكانية الوصول إليه، ويُحذف المحتوى نهائياً. لا يمكن التراجع.",
    en: "{names} will lose access and the content is destroyed permanently. This cannot be undone.",
  },
  deleteConfirm: { ar: "احذف", en: "Delete" },
  deleteCancel: { ar: "إلغاء", en: "Cancel" },
  deleteFailed: { ar: "تعذّر الحذف. لم يتغيّر شيء.", en: "Could not delete. Nothing changed." },
} satisfies LabelSet<string>
