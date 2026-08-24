/**
 * ٩ — الإعدادات.
 *
 * ⚠️ **Design-blind, like ٦.** The board's `get_file` caps at 256 KiB and every
 * read stops inside section ٥, so this section has never been legible. What it
 * is built from instead: AGENTS.md's section map (9.2 auto-lock, 9.3 audit log,
 * 9.4 subscription/storage, 9.5 legal), the backend's own documented rules, and
 * the `@workspace/ui-native` primitives a previous session built directly
 * against this section — `settings-row` says "all of section ٩",
 * `storage-meter` says "**9.4** subscription", and the README records two
 * pixel-level decisions about 9.4's lapse banner that could only have come from
 * reading it.
 *
 * Behaviour is sourced; arrangement is inferred. Check this copy first when the
 * board is split.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٩.١ — the index. */
export const SETTINGS = {
  title: { ar: "الإعدادات", en: "Settings" },

  groupAccount: { ar: "الحساب", en: "Account" },
  groupSecurity: { ar: "الأمان", en: "Security" },
  groupPlan: { ar: "الاشتراك", en: "Subscription" },
  groupLegal: { ar: "قانوني", en: "Legal" },

  rowLanguage: { ar: "اللغة", en: "Language" },
  rowAutoLock: { ar: "القفل التلقائي", en: "Auto-lock" },
  rowDevices: { ar: "الأجهزة", en: "Devices" },
  rowAudit: { ar: "سجل النشاط", en: "Activity log" },
  rowGuardian: { ar: "الوصي", en: "Guardian" },
  rowPlan: { ar: "الخطة والتخزين", en: "Plan and storage" },
  rowLegal: { ar: "الشروط والخصوصية", en: "Terms and privacy" },

  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  signOutTitle: { ar: "تسجيل الخروج؟", en: "Sign out?" },
  // The one thing a user must understand before signing out: the key stays.
  signOutBody: {
    ar: "يبقى مفتاح الخزنة على هذا الجهاز خلف بصمتك. ستحتاج تسجيل الدخول مرة أخرى للوصول إلى خزنتك.",
    en: "Your vault key stays on this device behind your biometrics. You'll need to sign in again to reach your vault.",
  },
  cancel: { ar: "إلغاء", en: "Cancel" },

  languageArabic: { ar: "العربية", en: "Arabic" },
  languageEnglish: { ar: "English", en: "English" },
  // Direction is native config and cannot follow the locale at runtime.
  languageNote: {
    ar: "تتغيّر لغة النصوص فقط. اتجاه الواجهة يبقى من اليمين إلى اليسار.",
    en: "This changes the wording only. The layout stays right-to-left.",
  },
} satisfies LabelSet<string>

/** ٩.٢ — auto-lock. */
export const AUTO_LOCK = {
  title: { ar: "القفل التلقائي", en: "Auto-lock" },
  intro: {
    ar: "بعد هذه المدة تُقفل خزنتك وتحتاج بصمتك مرة أخرى. تُقفل فوراً عند خروج التطبيق من الشاشة، مهما كان الإعداد.",
    en: "After this long your vault locks and needs your biometrics again. It always locks the moment the app leaves the screen, whatever this is set to.",
  },
  // The honest description of what the timer measures.
  capNote: {
    ar: "تُحسب المدة من لحظة الفتح، لا من آخر لمسة.",
    en: "Measured from when you unlocked, not from your last tap.",
  },
  minute1: { ar: "دقيقة واحدة", en: "1 minute" },
  minute5: { ar: "٥ دقائق", en: "5 minutes" },
  minute15: { ar: "١٥ دقيقة", en: "15 minutes" },
  minute60: { ar: "ساعة", en: "1 hour" },
  perDevice: {
    ar: "هذا الإعداد لهذا الجهاز وحده.",
    en: "This setting applies to this device only.",
  },
} satisfies LabelSet<string>

/** ٩.٣ — the audit log. */
export const AUDIT = {
  title: { ar: "سجل النشاط", en: "Activity log" },
  intro: {
    ar: "كل ما جرى في خزنتك. السجل للإضافة فقط — لا يمكن تعديله ولا حذفه، ولا حتى من قِبلنا.",
    en: "Everything that happened in your vault. The log is append-only — it cannot be edited or deleted, not even by us.",
  },
  empty: { ar: "لا نشاط بعد", en: "No activity yet" },
  loadMore: { ar: "عرض المزيد", en: "Show more" },

  // Event copy, keyed by the backend's own event names.
  assetCreated: { ar: "أُضيف أصل", en: "Asset added" },
  assetUpdated: { ar: "عُدّل أصل", en: "Asset updated" },
  assetRemoved: { ar: "حُذف أصل", en: "Asset deleted" },
  assetRevealed: { ar: "عُرض محتوى أصل", en: "Asset content revealed" },
  keyringCreated: { ar: "أُنشئ مفتاح الخزنة", en: "Vault key created" },
  keyringRotated: { ar: "دُوّر مفتاح الاسترداد", en: "Recovery key rotated" },
  guardianAttached: { ar: "فُعّل الوصي", en: "Guardian activated" },
  guardianInvited: { ar: "دُعي وصي", en: "Guardian invited" },
  guardianAccepted: { ar: "قبِل الوصي الدعوة", en: "Guardian accepted" },
  guardianRevoked: { ar: "أُلغي الوصي", en: "Guardian removed" },
  heirAdded: { ar: "أُضيف وارث", en: "Heir added" },
  routingChanged: { ar: "تغيّر التوجيه", en: "Routing changed" },
  bundlesRebuilt: { ar: "حُدّثت مفاتيح التسليم", en: "Delivery keys updated" },
  checkinConfirmed: { ar: "أُكّدت الحياة", en: "Life confirmed" },
  claimSubmitted: { ar: "قُدّم طلب وراثة", en: "Inheritance claim filed" },
  claimVetoed: { ar: "أُوقف طلب وراثة", en: "Inheritance claim stopped" },
  deviceRegistered: { ar: "سُجّل جهاز", en: "Device registered" },
  deviceRevoked: { ar: "أُلغي جهاز", en: "Device removed" },
  profileSaved: { ar: "حُدّث الملف الشخصي", en: "Profile updated" },
  generic: { ar: "نشاط في الخزنة", en: "Vault activity" },
} satisfies LabelSet<string>

/** ٩.٤ — plan and storage. */
export const PLAN = {
  title: { ar: "الخطة والتخزين", en: "Plan and storage" },
  planLabel: { ar: "خطتك", en: "Your plan" },
  renewsAt: { ar: "تتجدّد {date}", en: "Renews {date}" },
  freePlan: { ar: "مجانية", en: "Free" },

  storageTitle: { ar: "التخزين", en: "Storage" },
  usedLabel: { ar: "مستخدم", en: "Used" },
  freeLabel: { ar: "متاح", en: "Free" },
  emptyStorage: { ar: "لم ترفع شيئاً بعد", en: "Nothing uploaded yet" },

  // The lapse rule, stated as what still works. AGENTS.md: a lapsed card must
  // never cost anyone their inheritance — only adding is paused.
  lapsedTitle: { ar: "انتهى اشتراكك", en: "Your subscription lapsed" },
  lapsedBody: {
    ar: "خزنتك تبقى مقروءة، وتسليم الورثة يعمل كما هو. المتوقّف هو إضافة أصول جديدة فقط.",
    en: "Your vault stays readable and heir delivery still works. Only adding new assets is paused.",
  },
  manage: { ar: "إدارة الاشتراك", en: "Manage subscription" },
  // Billing is not wired; saying so beats a button that does nothing.
  billingSoon: {
    ar: "إدارة الفوترة تصل قريباً. تواصل معنا في هذه الأثناء.",
    en: "Billing management is coming. Contact us in the meantime.",
  },
} satisfies LabelSet<string>

/** The devices list. */
export const DEVICES = {
  title: { ar: "الأجهزة", en: "Devices" },
  intro: {
    ar: "الأجهزة التي فُتحت منها خزنتك.",
    en: "The devices your vault has been opened from.",
  },
  thisDevice: { ar: "هذا الجهاز", en: "This device" },
  lastUnlock: { ar: "آخر فتح {date}", en: "Last opened {date}" },
  neverUnlocked: { ar: "لم يُفتح بعد", en: "Never opened" },
  revoked: { ar: "مُلغى", en: "Removed" },
  revoke: { ar: "ألغِ الجهاز", en: "Remove device" },
  revokeTitle: { ar: "إلغاء هذا الجهاز؟", en: "Remove this device?" },
  // The honest limit. Revoking does not reach into a lost phone.
  revokeBody: {
    ar: "سيختفي من قائمتك ويُسجَّل ذلك. لا يمحو هذا مفتاح الخزنة من الجهاز نفسه — إن فقدته فعلاً، أعد إصدار وثيقة الاسترداد ونصيب الوصي.",
    en: "It leaves your list and the change is logged. This does not erase the vault key from the device itself — if it is genuinely lost, reissue your recovery sheet and guardian share.",
  },
  revokeConfirm: { ar: "ألغِ", en: "Remove" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  empty: { ar: "لا أجهزة مسجّلة", en: "No registered devices" },
} satisfies LabelSet<string>

/** ٩.٥ — legal. */
export const LEGAL = {
  title: { ar: "الشروط والخصوصية", en: "Terms and privacy" },
  terms: { ar: "شروط الاستخدام", en: "Terms of use" },
  privacy: { ar: "سياسة الخصوصية", en: "Privacy policy" },
  encryption: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
  notLegal: {
    ar: "وصيّة ليست جهة قانونية ولا تقسّم التركات. الأنصبة يحدّدها القانون وفق الفرائض.",
    en: "Wassiya is not a legal authority and does not divide estates. Shares are set by law under the fara'id.",
  },
  version: { ar: "الإصدار {v}", en: "Version {v}" },
} satisfies LabelSet<string>
