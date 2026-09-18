/**
 * ٩ — الإعدادات.
 *
 * 9.2 auto-lock, 9.3 audit log, 9.4 subscription and storage, 9.5 legal. What
 * each one may claim is fixed by the backend — the lapse rule, the append-only
 * log, the lock policy — and the wording is ours.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٩.١ — the index. */
/**
 * ٩.١b — الملف الشخصي.
 *
 * Two editable fields and three read-only ones, and the split is not arbitrary:
 * the name and the country are the only parts of an owner this app is allowed
 * to change. The email belongs to Clerk and moving it is a verification flow,
 * not a text field; the identity name comes from the ID document Didit read,
 * and it exists precisely so that nothing the owner types can move it.
 */
/**
 * ٩.١c — changing the email.
 *
 * The email is this app's **login identity**: sign-in is
 * `signIn.emailCode.sendCode({ emailAddress })`, so this screen changes how the
 * owner gets into their vault. That is why the warning is on the first step,
 * before the address is typed, rather than in a footnote at the end.
 */
export const EMAIL_CHANGE = {
  title: { ar: "تغيير البريد", en: "Change email" },
  currentLabel: { ar: "البريد الحالي", en: "Current email" },
  newLabel: { ar: "البريد الجديد", en: "New email" },
  newPlaceholder: { ar: "you@example.com", en: "you@example.com" },
  // Two facts, both consequences rather than instructions: this is the login,
  // and the old address stops working. The second is the one people do not
  // expect, so it is stated and not implied.
  notice: {
    ar: "بهذا البريد تدخل إلى خزنتك. بعد التأكيد لن تتمكن من الدخول بالبريد القديم.",
    en: "This is the email you sign in with. Once confirmed, the old address will no longer get you in.",
  },
  invalid: { ar: "أدخل بريداً صحيحاً.", en: "Enter a valid email." },
  same: { ar: "هذا بريدك الحالي.", en: "That is already your email." },
  taken: {
    ar: "هذا البريد مستخدم في حساب آخر.",
    en: "That email is already used by another account.",
  },
  sendCode: { ar: "أرسل الرمز", en: "Send the code" },
  sending: { ar: "جارٍ الإرسال…", en: "Sending…" },

  codeTitle: { ar: "أكّد البريد الجديد", en: "Confirm the new email" },
  codeSubtitle: {
    ar: "أرسلنا رمزاً إلى {email}.",
    en: "We sent a code to {email}.",
  },
  wrongCode: { ar: "رمز غير صحيح.", en: "That code is not right." },
  // The address is created on Clerk before the code is sent, so abandoning the
  // flow would leave an unverified address on the account — and a second
  // attempt at the same address would then fail as a duplicate. Cancelling
  // removes it.
  cancel: { ar: "إلغاء", en: "Cancel" },
  failed: { ar: "تعذّر التغيير. حاول مرة أخرى.", en: "Could not change it. Try again." },
} satisfies LabelSet<string>

export const PROFILE = {
  title: { ar: "الملف الشخصي", en: "Profile" },
  nameLabel: { ar: "الاسم الكامل", en: "Full name" },
  // The same advice ٢.٢ gives at signup. The app never sends this name
  // anywhere — Didit reads the name off the document itself — but the advice is
  // still true, and the one screen that lets you change it must not be the one
  // screen that stops saying so.
  nameNotice: {
    ar: "اسمك يجب أن يطابق هويتك الرسمية — عليه يعتمد التحقق من الوفاة لاحقاً.",
    en: "Your name must match your official ID — the later death-verification match depends on it.",
  },
  nameRequired: { ar: "الاسم مطلوب.", en: "A name is required." },

  countryLabel: { ar: "الدولة", en: "Country" },
  /**
   * The consequence, stated before the change rather than discovered after it.
   *
   * useHeirForm validates every heir's number against *this* country, so a
   * number stored as +213… stops round-tripping the moment the country becomes
   * SA: that heir's form opens with Save already lit and an "invalid number"
   * error against a number that was fine yesterday.
   */
  countryNotice: {
    ar: "تُستخدم لتنسيق أرقام ورثتك وحساباتك البنكية. تغييرها قد يُظهر أرقاماً محفوظة كغير صالحة.",
    en: "Used to format your heirs' numbers and bank accounts. Changing it can make stored numbers read as invalid.",
  },
  countryHeirsWarning: {
    ar: "{n} من أرقام ورثتك محفوظة بترميز دولة أخرى.",
    en: "{n} of your heirs' numbers are stored under a different country.",
  },

  emailLabel: { ar: "البريد الإلكتروني", en: "Email" },
  identityLabel: { ar: "الهوية", en: "Identity" },
  // The section is "الهوية"; the row inside it needs its own word or the
  // heading and the row would both read "الهوية".
  identityStatusLabel: { ar: "الحالة", en: "Status" },
  identityVerified: { ar: "موثّقة", en: "Verified" },
  identityUnverified: { ar: "غير موثّقة", en: "Not verified" },
  identityNameLabel: { ar: "الاسم في هويتك", en: "Name on your ID" },

  save: { ar: "حفظ", en: "Save" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },
  saveFailed: { ar: "تعذّر الحفظ. حاول مرة أخرى.", en: "Could not save. Try again." },
} satisfies LabelSet<string>

export const SETTINGS = {
  // Matches the tab's own label. الرئيسية, الخزنة and الورثة each open with the
  // word the bar uses; this one opened with "الإعدادات" and was the only tab
  // whose screen disagreed with the button that got you there.
  title: { ar: "حسابي", en: "Account" },

  groupAccount: { ar: "الحساب", en: "Account" },
  groupSecurity: { ar: "الأمان", en: "Security" },
  groupPlan: { ar: "الاشتراك", en: "Subscription" },
  groupLegal: { ar: "قانوني", en: "Legal" },

  rowLanguage: { ar: "اللغة", en: "Language" },
  rowAutoLock: { ar: "القفل التلقائي", en: "Auto-lock" },
  rowDevices: { ar: "الأجهزة", en: "Devices" },
  // ⚠️ Worded as reissuing, never as viewing or downloading. `S_paper` is
  // never persisted, so the code on the sheet in someone's drawer cannot be
  // shown again by anyone, including us — and the only way to hold a sheet is
  // to mint a new one, which retires the old.
  rowRecoverySheet: { ar: "وثيقة الاسترداد", en: "Recovery document" },
  sheetNeverPrinted: { ar: "لم تُطبع بعد", en: "Not printed yet" },
  sheetVersion: { ar: "نسخة {v}", en: "Version {v}" },
  sheetUsed: { ar: "استُخدمت — أعد الطباعة", en: "Used — reprint it" },

  sheetTitle: { ar: "وثيقة الاسترداد", en: "Your recovery document" },
  sheetCannotShow: {
    ar: "لا يمكننا عرض رمز وثيقتك الحالية — لا نحتفظ بنسخة منه، وهذا هو سبب أمان خزنتك. الرمز موجود على الورقة التي طبعتها، وهناك فقط.",
    en: "We cannot show you the code on your current document. We keep no copy of it — that is precisely why your vault is safe. It exists on the sheet you printed, and nowhere else.",
  },
  sheetReissueTitle: { ar: "طباعة وثيقة جديدة", en: "Print a new document" },
  sheetReissueBody: {
    ar: "تُنشئ رمزاً جديداً بالكامل. تتوقف الورقة القديمة عن العمل فور حفظ الجديدة — أتلفها بعد الطباعة.",
    en: "This creates an entirely new code. The old sheet stops working the moment the new one is saved — destroy it once you have printed the replacement.",
  },
  sheetReissueAction: { ar: "اطبع وثيقة جديدة", en: "Print a new document" },
  sheetPrintedOn: { ar: "طُبعت في", en: "Printed on" },
  sheetCurrentVersion: { ar: "النسخة الحالية", en: "Current version" },

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
    ar: "متى تُقفل خزنتك وتحتاج بصمتك مرة أخرى.",
    en: "When your vault locks and needs your biometrics again.",
  },
  whileOpen: { ar: "ما دام التطبيق مفتوحاً", en: "While the app is open" },
  // Shown only under "while open". The trade belongs on the screen, not in a
  // comment: this setting is the one that decides whether a found phone opens
  // the vault, and an owner who was never told cannot have chosen it.
  whileOpenNote: {
    ar: "تبقى الخزنة مفتوحة عند التنقّل بين التطبيقات، ولا تُقفل إلا بإغلاق التطبيق تماماً. مَن يمسك هاتفك وهو مفتوح يستطيع فتح وصية وقراءة خزنتك — وتبقى عبارة الاسترداد وحدها خلف بصمتك.",
    en: "The vault stays open while you switch apps, and closes only when the app is fully closed. Anyone holding your unlocked phone can reopen Wassiya and read it — only a seed phrase still needs your fingerprint.",
  },
  // Shown only under a duration: the honest description of what it measures.
  capNote: {
    ar: "تُحسب المدة من لحظة الفتح، لا من آخر لمسة. وتُقفل الخزنة فوراً عند خروج التطبيق من الشاشة.",
    en: "Measured from when you unlocked, not from your last tap. The vault also locks the moment the app leaves the screen.",
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
  // ٨ — the recovery ceremony. These are the lines an owner scans for when
  // they suspect someone else moved: a spent sheet and a guardian approval are
  // the two halves of a recovery, and seeing them side by side is the whole
  // point of keeping this log.
  paperPrinted: { ar: "طُبعت وثيقة استرداد", en: "Recovery sheet printed" },
  paperUsed: { ar: "استُخدمت وثيقة الاسترداد", en: "Recovery sheet used" },
  recoveryApproved: {
    ar: "وافق وصيّك على استعادة",
    en: "Your guardian approved a recovery",
  },

  // The claim path. `released` is the most consequential row this log can ever
  // carry, and it was rendering as "Vault activity".
  claimHeirLinked: { ar: "رُبط طلب بوارث", en: "Claim linked to an heir" },
  claimCertificate: { ar: "أُرفقت شهادة وفاة", en: "Death certificate attached" },
  claimNameMatch: { ar: "طوبق الاسم القانوني", en: "Legal name checked" },
  claimGuardianConfirmed: {
    ar: "أكّد الوصي الوفاة",
    en: "Guardian confirmed the death",
  },
  claimReleased: { ar: "سُلّمت الخزنة للورثة", en: "Vault released to heirs" },
  serverShareReleased: {
    ar: "أُفرج عن نصيب الخادم",
    en: "Server share released",
  },
  guardianHandedOver: {
    ar: "سلّم الوصي نصيبه للوارث",
    en: "Guardian handed their share to the heir",
  },

  // Dead-man's-switch bookkeeping.
  checkinConfigured: { ar: "ضُبط نبض الحياة", en: "Life check-in set up" },
  checkinSnoozed: { ar: "أُجّل نبض الحياة", en: "Life check-in postponed" },
  checkinEscalated: { ar: "تصاعد تنبيه الحياة", en: "Life check-in escalated" },

  heirUpdated: { ar: "عُدّل وارث", en: "Heir updated" },
  heirRemoved: { ar: "حُذف وارث", en: "Heir removed" },
  heirMessageSet: { ar: "حُفظت رسالة لوارث", en: "Message for an heir saved" },

  identityStarted: { ar: "بدأ التحقق من الهوية", en: "Identity check started" },
  identityResult: { ar: "وصلت نتيجة التحقق", en: "Identity check result" },

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
    ar: "سيختفي من قائمتك ويُسجَّل ذلك. لا يمحو هذا مفتاح الخزنة من الجهاز نفسه — إن فقدته فعلاً، أعد إصدار وثيقة الاسترداد.",
    en: "It leaves your list and the change is logged. This does not erase the vault key from the device itself — if it is genuinely lost, reissue your recovery sheet.",
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
