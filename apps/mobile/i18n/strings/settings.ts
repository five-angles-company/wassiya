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
    ar: "بهذا البريد تدخل خزنتك، ويتوقف القديم بعد التأكيد.",
    en: "You sign in with this email; the old one stops working once confirmed.",
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
  nameRequired: { ar: "الاسم مطلوب.", en: "A name is required." },

  countryLabel: { ar: "الدولة", en: "Country" },
  /**
   * The consequence, stated before the change rather than discovered after it.
   *
   * useExecutorForm validates every executor's number against *this* country,
   * so a number stored as +213… stops round-tripping the moment the country
   * becomes SA: that executor's form opens with an "invalid number" error
   * against a number that was fine yesterday.
   */
  countryNotice: {
    ar: "تحدّد صيغة أرقام الأوصياء والحسابات البنكية.",
    en: "Sets the format of executor and bank numbers.",
  },
  countryExecutorsWarning: {
    ar: "{n} من أرقام أوصيائك محفوظة بترميز دولة أخرى.",
    en: "{n} of your executors' numbers are stored under a different country.",
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
  // Matches the tab's own label. الرئيسية, الخزنة and الأوصياء each open with the
  // word the bar uses; this one opened with "الإعدادات" and was the only tab
  // whose screen disagreed with the button that got you there.
  title: { ar: "حسابي", en: "Account" },

  groupAccount: { ar: "الحساب", en: "Account" },
  groupSecurity: { ar: "الأمان", en: "Security" },
  groupGeneral: { ar: "عام", en: "General" },
  rowHelp: { ar: "المساعدة والدعم", en: "Help & support" },
  helpNewReply: { ar: "ردّ جديد", en: "New reply" },

  rowLanguage: { ar: "اللغة", en: "Language" },
  rowAutoLock: { ar: "القفل التلقائي", en: "Auto-lock" },
  rowDevices: { ar: "الأجهزة", en: "Devices" },
  // ⚠️ Worded as reissuing, never as viewing or downloading. `S_paper` is
  // never persisted, so the code on the sheet in someone's drawer cannot be
  // shown again by anyone, including us — and the only way to hold a sheet is
  // to mint a new one, which retires the old.
  rowRecoverySheet: { ar: "وثيقة الاسترداد", en: "Recovery document" },
  sheetNeverPrinted: { ar: "لم تُطبع بعد", en: "Not printed yet" },
  sheetVersion: { ar: "الإصدار {v}", en: "Version {v}" },
  sheetUsed: { ar: "استُخدمت — أعد الطباعة", en: "Used — reprint it" },

  sheetTitle: { ar: "وثيقة الاسترداد", en: "Your recovery document" },
  sheetCannotShow: {
    ar: "لا نحتفظ بنسخة من الرمز، فلا يمكن عرضه — هو على وثيقتك المطبوعة فقط.",
    en: "We keep no copy of the code, so it cannot be shown — it is only on your printed sheet.",
  },
  sheetReissueBody: {
    ar: "الوثيقة الجديدة تُبطل القديمة فور حفظها — أتلف القديمة.",
    en: "A new sheet cancels the old one the moment it is saved — destroy the old one.",
  },
  sheetReissueAction: { ar: "اطبع وثيقة جديدة", en: "Print a new document" },

  rowAudit: { ar: "سجل النشاط", en: "Activity log" },
  rowPlan: { ar: "الخطة والتخزين", en: "Plan and storage" },
  rowLegal: { ar: "الشروط والخصوصية", en: "Terms and privacy" },

  signOut: { ar: "تسجيل الخروج", en: "Sign out" },
  signOutTitle: { ar: "تسجيل الخروج؟", en: "Sign out?" },
  // The one thing a user must understand before signing out: the key stays.
  signOutBody: {
    ar: "يبقى مفتاحك على هذا الجهاز خلف بصمتك. ستحتاج تسجيل الدخول مجدداً.",
    en: "Your key stays on this device behind your biometrics. You'll need to sign in again.",
  },
  cancel: { ar: "إلغاء", en: "Cancel" },

  // Account deletion. "٧ أيام" mirrors `DELETION_GRACE_DAYS` in
  // `convex/account.ts`; change both together.
  rowDeleteAccount: { ar: "حذف الحساب", en: "Delete account" },
  deleteScheduled: { ar: "يُحذف في {date}", en: "Deleted on {date}" },
  deleteTitle: { ar: "حذف حسابك وخزنتك؟", en: "Delete your account and vault?" },
  deleteBody: {
    ar: "نحذف كل ما في خزنتك بعد ٧ أيام، ولن يستلم أوصياؤك شيئاً.",
    en: "We delete everything in your vault in 7 days, and your executors receive nothing.",
  },
  deleteFinal: {
    ar: "لا يستطيع أحد — ولا نحن — استعادتها بعد ذلك. يمكنك الإلغاء من هنا حتى ذلك اليوم.",
    en: "Nobody — us included — can restore it afterwards. You can cancel here until then.",
  },
  deleteConfirm: { ar: "احذف بعد ٧ أيام", en: "Delete in 7 days" },
  deletePrompt: {
    ar: "أكّد ببصمتك لحذف حسابك",
    en: "Confirm with your fingerprint to delete your account",
  },
  deleteNotConfirmed: {
    ar: "لم تُؤكَّد البصمة، فلم يُطلب الحذف.",
    en: "Fingerprint not confirmed, so nothing was requested.",
  },
  deleteReportOpen: {
    ar: "يوجد بلاغ وفاة مفتوح عنك. أكّد الحياة من الرئيسية أولاً.",
    en: "A death report about you is open. Confirm you're alive on Home first.",
  },
  deleteVaultClosed: {
    ar: "أُغلقت هذه الخزنة بعد بلاغ وفاة، فلا تُحذف من هنا.",
    en: "This vault was closed after a death report and cannot be deleted here.",
  },
  deleteFailed: {
    ar: "تعذّر طلب الحذف. حاول مرة أخرى.",
    en: "Could not request the deletion. Try again.",
  },
  keepTitle: { ar: "إلغاء حذف حسابك؟", en: "Cancel the deletion?" },
  keepBody: { ar: "تبقى خزنتك كما هي.", en: "Your vault stays as it is." },
  keepConfirm: { ar: "أبقِ حسابي", en: "Keep my account" },
  keepFailed: {
    ar: "تعذّر الإلغاء. حاول مرة أخرى.",
    en: "Could not cancel. Try again.",
  },

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
  whileOpen: { ar: "ما دام التطبيق مفتوحاً", en: "While the app is open" },
  // Under the choices, read while choosing. The trade belongs on the screen:
  // this setting decides whether a found phone opens the vault, and an owner
  // who was never told cannot have chosen it.
  note: {
    ar: "مع «ما دام التطبيق مفتوحاً» يقرأ خزنتك من يمسك هاتفك مفتوحاً. المُدد تُحسب من لحظة الفتح.",
    en: "With “while the app is open”, anyone holding your unlocked phone can read your vault. Durations count from unlocking.",
  },
  minute1: { ar: "دقيقة واحدة", en: "1 minute" },
  minute5: { ar: "٥ دقائق", en: "5 minutes" },
  minute15: { ar: "١٥ دقيقة", en: "15 minutes" },
  minute60: { ar: "ساعة", en: "1 hour" },
} satisfies LabelSet<string>

/** ٩.٣ — the audit log. */
export const AUDIT = {
  title: { ar: "سجل النشاط", en: "Activity log" },
  intro: {
    ar: "لا يُعدَّل ولا يُحذف، ولا حتى من قِبلنا.",
    en: "It cannot be edited or deleted, not even by us.",
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
  releaseKeySet: { ar: "أُنشئ مفتاح التسليم", en: "Handover key created" },
  handoverChanged: { ar: "تغيّر تسليم أصل", en: "An asset's handover changed" },
  executorAdded: { ar: "أُضيف وصيّ", en: "Executor added" },
  executorUpdated: { ar: "عُدّل وصيّ", en: "Executor updated" },
  executorRemoved: { ar: "حُذف وصيّ", en: "Executor removed" },
  // A new bearer sheet. If the owner did not print it, this is the row that
  // says so.
  executorSheetPrinted: { ar: "طُبعت ورقة وصيّ", en: "Executor sheet printed" },
  executorsChecked: { ar: "أُكّدت بيانات الأوصياء", en: "Executors confirmed" },
  checkinConfirmed: { ar: "أُكّدت الحياة", en: "Life confirmed" },
  claimSubmitted: { ar: "قُدّم بلاغ وفاة", en: "Death report filed" },
  claimVetoed: { ar: "أُوقف بلاغ وفاة", en: "Death report stopped" },
  deviceRegistered: { ar: "سُجّل جهاز", en: "Device registered" },
  deviceRevoked: { ar: "أُلغي جهاز", en: "Device removed" },
  profileSaved: { ar: "حُدّث الملف الشخصي", en: "Profile updated" },
  // ٨ — the recovery sheet. A spent sheet is the line an owner scans for when
  // they suspect someone else moved.
  paperPrinted: { ar: "طُبعت وثيقة استرداد", en: "Recovery sheet printed" },
  paperUsed: { ar: "استُخدمت وثيقة الاسترداد", en: "Recovery sheet used" },

  // The claim path. `released` is the most consequential row this log can ever
  // carry, and it was rendering as "Vault activity".
  claimCertificate: { ar: "أُرفقت شهادة وفاة", en: "Death certificate attached" },
  claimNameMatch: { ar: "طوبق الاسم القانوني", en: "Legal name checked" },
  claimReleased: { ar: "سُلّمت الخزنة للأوصياء", en: "Vault handed over to the executors" },
  deliveryOpened: { ar: "فتح وصيّ ما سُلّم", en: "An executor opened the handover" },

  // Dead-man's-switch bookkeeping.
  checkinConfigured: { ar: "ضُبط تأكيد الحياة", en: "Life check-in set up" },
  checkinSnoozed: { ar: "أُجّل تأكيد الحياة", en: "Life check-in postponed" },
  checkinEscalated: { ar: "تأخّر تأكيد الحياة", en: "Life check-in overdue" },

  identityStarted: { ar: "بدأ التحقق من الهوية", en: "Identity check started" },
  identityResult: { ar: "وصلت نتيجة التحقق", en: "Identity check result" },

  planSet: { ar: "تغيّرت خطتك", en: "Your plan changed" },
  generic: { ar: "نشاط في الخزنة", en: "Vault activity" },
} satisfies LabelSet<string>

/** ٩.٤ — plan and storage. */
export const PLAN = {
  title: { ar: "الخطة والتخزين", en: "Plan and storage" },
  planLabel: { ar: "خطتك", en: "Your plan" },
  renewsAt: { ar: "تتجدّد {date}", en: "Renews {date}" },
  freePlan: { ar: "مجانية", en: "Free" },
  annualPlan: { ar: "سنوية", en: "Annual" },

  // The two limits a meter cannot draw. Counts come from the server beside the
  // limits themselves — ٩.٤ is where a number invented on the client would be
  // discovered last.
  usageTitle: { ar: "ما في خزنتك", en: "What is in your vault" },
  assetsLabel: { ar: "الأصول", en: "Assets" },
  executorsLabel: { ar: "الأوصياء", en: "Executors" },
  ofLimit: { ar: "{used} من {limit}", en: "{used} of {limit}" },
  upgrade: { ar: "وسّع خطتك", en: "See the annual plan" },

  /** The meter formats in GB by default; a 500 MB allowance needs its own. */
  unitMb: { ar: "م.ب", en: "MB" },

  // The lapse rule, stated as what still works. AGENTS.md: a lapsed card must
  // never cost anyone their inheritance — the vault is frozen, never lost.
  lapsedTitle: { ar: "انتهى اشتراكك", en: "Your subscription lapsed" },
  lapsedBody: {
    ar: "خزنتك محفوظة كما هي، والتسليم لأوصيائك قائم. جدّد لتضيف وتعدّل.",
    en: "Your vault is kept as it is, and delivery to your executors still works. Renew to add and edit.",
  },
  manage: { ar: "إدارة الاشتراك", en: "Manage subscription" },
  // Billing is not wired: the row says so and opens a message to us.
  soon: { ar: "قريباً — راسلنا", en: "Soon — message us" },
} satisfies LabelSet<string>

/** The devices list. */
export const DEVICES = {
  title: { ar: "الأجهزة", en: "Devices" },
  lastUnlock: { ar: "آخر فتح {date}", en: "Last opened {date}" },
  neverUnlocked: { ar: "لم يُفتح بعد", en: "Never opened" },
  revoked: { ar: "مُلغى", en: "Removed" },
  revoke: { ar: "ألغِ الجهاز", en: "Remove device" },
  revokeTitle: { ar: "إلغاء هذا الجهاز؟", en: "Remove this device?" },
  // The honest limit. Revoking does not reach into a lost phone.
  revokeBody: {
    ar: "يُزال من القائمة فقط، ولا يمحو المفتاح من الجهاز. إن فقدته، اطبع وثيقة استرداد جديدة.",
    en: "It only leaves the list; the key stays on the device. If it is lost, print a new recovery sheet.",
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
