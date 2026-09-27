/**
 * ٤.٣–٤.٨ — the six add-asset wizards.
 *
 * One dictionary per type plus the chrome they share, keyed by their own
 * routes (`/assets/new/crypto`, `/assets/new/bank`, …). Each type asks one
 * question per step (`q…`, with an optional hint `h…`), and names the cards
 * its asset page shows (`section…`).
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** Chrome shared by all six. */
export const ASSET_NEW = {
  back: { ar: "رجوع", en: "Back" },
  stepSeparator: { ar: "من", en: "of" },
  next: { ar: "التالي", en: "Next" },
  saveAsset: { ar: "احفظ في الخزنة", en: "Save to your vault" },
  saveEdit: { ar: "احفظ التعديل", en: "Save changes" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },
  optional: { ar: "اختياري", en: "Optional" },
  leaveTitle: { ar: "تترك دون حفظ؟", en: "Leave without saving?" },
  leaveBody: { ar: "ما أدخلته لن يُحفظ.", en: "What you entered will not be saved." },
  leaveConfirm: { ar: "اترك", en: "Leave" },
  stay: { ar: "ابقَ", en: "Stay" },
  notRecorded: { ar: "لم يُحدَّد بعد", en: "Not recorded yet" },
  // The promise 4.3 prints under its secret field, and the reason every one of
  // these screens can ask for what it asks for.
  encryptNote: {
    ar: "يُشفّر على جهازك قبل الحفظ. لا نرى ما كتبته، ولن يظهر في أي سجل أو نسخة احتياطية.",
    en: "Encrypted on your device before saving. We never see it, and it appears in no log or backup.",
  },
  saveFailed: {
    ar: "تعذّر الحفظ. لم يُضف شيء إلى خزنتك.",
    en: "Could not save. Nothing was added to your vault.",
  },
  vaultLocked: {
    ar: "خزنتك أُقفلت. افتحها وحاول مرة أخرى.",
    en: "Your vault locked. Unlock it and try again.",
  },
  // The one gate a lapsed subscription closes. Worded to say what still works,
  // because the rule is that a lapsed card never costs anyone their
  // inheritance — only adding is paused.
  quotaExceeded: {
    ar: "إضافة الأصول متوقّفة حتى تجديد الاشتراك. خزنتك وكل ما فيها يبقى كما هو، والتسليم لأوصيائك يعمل.",
    en: "Adding assets is paused until your subscription renews. Your vault and everything in it is untouched, and delivery to your executors still works.",
  },
} satisfies LabelSet<string>

/** ٤.٣ — the hard screen. */
export const NEW_CRYPTO = {
  title: { ar: "محفظة رقمية", en: "Crypto wallet" },
  nameLabel: { ar: "اسم المحفظة", en: "Wallet name" },
  namePlaceholder: { ar: "محفظة Ledger الرئيسية", en: "Main Ledger wallet" },
  networkLabel: { ar: "الشبكة", en: "Network" },
  kindLabel: { ar: "النوع", en: "Type" },
  kindHardware: { ar: "جهاز", en: "Hardware" },
  kindSoftware: { ar: "برنامج", en: "Software" },
  kindExchange: { ar: "منصة", en: "Exchange" },
  secretLabel: { ar: "العبارة السرّية", en: "Recovery phrase" },

  qWallet: { ar: "عرّفنا بمحفظتك", en: "Tell us about the wallet" },
  hKind: {
    ar: "يحدّد ما يحتاجه وصيّك ليصل إليها.",
    en: "It decides what your executor will need to reach it.",
  },
  kindHardwareDetail: { ar: "جهاز مثل Ledger أو Trezor", en: "A device like Ledger or Trezor" },
  kindSoftwareDetail: { ar: "تطبيق على هاتفك أو حاسوبك", en: "An app on your phone or computer" },
  kindExchangeDetail: {
    ar: "حساب على منصة مثل Binance",
    en: "An account on a platform like Binance",
  },
  qPhrase: { ar: "ما العبارة السرّية؟", en: "What is the recovery phrase?" },
  hPhrase: {
    ar: "الكلمات بترتيبها كما كُتبت على بطاقة النسخ الاحتياطي.",
    en: "The words, in order, as written on your backup card.",
  },
  qExchange: { ar: "كيف يدخل وصيّك إلى المنصة؟", en: "How does your executor sign in?" },
  qDevice: { ar: "أين الجهاز، وما رمزه؟", en: "Where is the device, and its PIN?" },
  hDevice: {
    ar: "من يجد الجهاز ويعرف رمزه لا يحتاج إلى كتابة الكلمات.",
    en: "Whoever finds the device and knows its PIN never has to type the words.",
  },
  needsKind: { ar: "اختر النوع للمتابعة", en: "Choose a type to continue" },
  needsName: { ar: "أضف اسماً للمتابعة", en: "Add a name to continue" },
  needsPhrase: { ar: "أكمل عبارة صحيحة للمتابعة", en: "Complete a valid phrase to continue" },
  needsLogin: { ar: "أكمل بيانات الدخول للمتابعة", en: "Complete the login to continue" },
  sectionBasics: { ar: "المحفظة", en: "The wallet" },
  sectionPhrase: { ar: "العبارة السرّية", en: "Recovery phrase" },
  sectionExchange: { ar: "الدخول إلى المنصة", en: "Exchange login" },
  sectionDevice: { ar: "الجهاز", en: "The device" },
  phraseSummary: { ar: "{n} كلمة · تظهر ببصمتك", en: "{n} words · shown with your fingerprint" },
  loginSummary: { ar: "{account} · كلمة المرور محفوظة", en: "{account} · password saved" },
  deviceNotRecorded: { ar: "لم يُحدَّد مكانه بعد", en: "Not recorded yet" },

  // The three protections in force, named on screen because a claim the user
  // cannot see is a claim they cannot rely on.
  chipScreenshot: { ar: "لقطات الشاشة محجوبة", en: "Screenshots blocked" },
  chipKeyboard: { ar: "لا ذاكرة للوحة المفاتيح", en: "No keyboard memory" },
  chipClipboard: {
    ar: "تُمحى الحافظة بعد اللصق",
    en: "Clipboard wiped after paste",
  },

  // Checksum outcomes. "Valid" is deliberately specific about *when* it was
  // checked — before saving — because that is the guarantee being made.
  checksumValid: {
    ar: "عبارة صحيحة · تحقّقنا من رقم التدقيق قبل الحفظ",
    en: "Valid phrase · checksum verified before saving",
  },
  checksumBad: {
    ar: "رقم التدقيق غير صحيح — راجع الكلمات وترتيبها",
    en: "Checksum does not match — check the words and their order",
  },
  checksumUnknownWords: {
    ar: "كلمات غير معروفة: {words}",
    en: "Not BIP-39 words: {words}",
  },
  checksumLength: {
    ar: "عبارة BIP-39 تتكوّن من ١٢ أو ١٥ أو ١٨ أو ٢١ أو ٢٤ كلمة — لديك {n}",
    en: "A BIP-39 phrase is 12, 15, 18, 21 or 24 words — you have {n}",
  },
  pasteEmpty: { ar: "الحافظة فارغة", en: "Nothing in the clipboard" },
  paste: { ar: "لصق", en: "Paste" },
  scanShort: { ar: "مسح رمز", en: "Scan" },
  secretPlaceholder: {
    ar: "اكتب أو الصق الكلمات، مفصولة بمسافات",
    en: "Type or paste the words, separated by spaces",
  },
  // The olive verdict, split so the count can carry the locale's numerals.
  validWords: { ar: "كلمة صحيحة", en: "valid words" },
  checksumMatches: { ar: "رقم التدقيق مطابق", en: "checksum matches" },

  // QR — reading a phrase off a printed backup card.
  scanTitle: { ar: "امسح رمز النسخ الاحتياطي", en: "Scan your backup code" },
  scanBody: {
    ar: "وجّه الكاميرا إلى رمز QR على بطاقة النسخ الاحتياطي. لا تُحفظ أي صورة.",
    en: "Point the camera at the QR on your backup card. No image is saved.",
  },
  scanNotAPhrase: {
    ar: "هذا الرمز لا يحتوي على عبارة BIP-39 صالحة.",
    en: "That code does not contain a valid BIP-39 phrase.",
  },
  cameraNeeded: {
    ar: "يحتاج المسح إذن الكاميرا. لا تُحفظ صور ولا يُرسل شيء.",
    en: "Scanning needs camera access. No images are saved and nothing is sent.",
  },
  cameraAllow: { ar: "اسمح بالكاميرا", en: "Allow camera" },
  cameraBlocked: {
    ar: "إذن الكاميرا مرفوض. فعّله من إعدادات النظام، أو الصق العبارة بدلاً من ذلك.",
    en: "Camera access is denied. Enable it in system settings, or paste the phrase instead.",
  },

  // ٤.٣'s exchange variant. A wallet held on an exchange has no seed phrase —
  // the account *is* the custody — so the form asks for what an executor would
  // actually need, and the BIP-39 gate does not apply.
  exchangeName: { ar: "اسم المنصة", en: "Exchange" },
  exchangeNamePlaceholder: { ar: "Binance", en: "Binance" },
  exchangeAccount: { ar: "الحساب", en: "Account" },
  exchangeAccountPlaceholder: { ar: "البريد أو رقم الحساب", en: "Email or account id" },
  exchangePassword: { ar: "كلمة المرور", en: "Password" },
  exchangeTwoFactor: {
    ar: "التحقق بخطوتين (اختياري)",
    en: "Two-factor (optional)",
  },
  exchangeTwoFactorPlaceholder: {
    ar: "أين مفتاح 2FA، ورموز الاسترداد إن وُجدت",
    en: "Where the 2FA key is, and any recovery codes",
  },
  exchangeNote: {
    ar: "لا تملك المنصات عبارة سرّية — الحساب نفسه هو الحيازة، لذلك نحفظ ما يلزم لاستعادته.",
    en: "An exchange has no recovery phrase — the account itself is the custody, so we keep what is needed to reclaim it.",
  },
} satisfies LabelSet<string>

/** ٤.٤ — country is a parameter, never a branch. */
export const NEW_BANK = {
  title: { ar: "حساب بنكي", en: "Bank account" },
  countryLabel: { ar: "الدولة", en: "Country" },
  bankLabel: { ar: "البنك", en: "Bank" },
  bankPlaceholder: { ar: "اختر أو اكتب اسم البنك", en: "Pick or type the bank" },
  ibanLabel: { ar: "IBAN", en: "IBAN" },
  ibanValid: {
    ar: "آيبان صحيح ({n} خانة)",
    en: "Valid IBAN ({n} characters)",
  },
  // Split, so the count can carry the locale's numerals on its own.
  ibanChars: { ar: "خانة", en: "characters" },
  ibanOk: { ar: "صحيح", en: "valid" },
  ibanBadLength: {
    ar: "آيبان {country} يتكوّن من {n} خانة — لديك {have}",
    en: "A {country} IBAN is {n} characters — you have {have}",
  },
  ibanBadChecksum: {
    ar: "رقم التدقيق غير صحيح — راجع الأرقام",
    en: "Checksum does not match — check the digits",
  },
  ibanWrongCountry: {
    ar: "هذا الآيبان يبدأ بـ {prefix}، والدولة المختارة {country}",
    en: "This IBAN starts with {prefix}, but the country is {country}",
  },
  accountTypeLabel: { ar: "نوع الحساب", en: "Account type" },
  accountCurrent: { ar: "جارٍ", en: "Current" },
  accountSavings: { ar: "توفير", en: "Savings" },
  currencyLabel: { ar: "العملة", en: "Currency" },

  qAccount: { ar: "ما الحساب؟", en: "Which account is it?" },
  hAccount: {
    ar: "الدولة تحدّد شكل الآيبان والعملة، ونتحقّق من الرقم قبل الحفظ فلا يصل إلى وصيّك رقم خاطئ.",
    en: "The country sets the IBAN format and currency, and we check the number before saving so your executor never gets a wrong one.",
  },
  qInstructions: { ar: "ماذا يفعل الوصي به؟", en: "What should your executor do with it?" },
  hInstructions: {
    ar: "سطر واحد هنا قد يوفّر على وصيّك أسابيع.",
    en: "One line here can save your executor weeks.",
  },
  needsBank: { ar: "أضف اسم البنك للمتابعة", en: "Add the bank to continue" },
  needsIban: { ar: "أكمل آيباناً صحيحاً للمتابعة", en: "Complete a valid IBAN to continue" },
  sectionAccount: { ar: "الحساب", en: "The account" },
  noInstructions: { ar: "لا تعليمات بعد", en: "No instructions yet" },
  branchLabel: { ar: "الفرع (اختياري)", en: "Branch (optional)" },
  branchPlaceholder: { ar: "مثال: فرع العليا", en: "e.g. Olaya branch" },
  instructionsLabel: { ar: "تعليمات للوصي", en: "Instructions for your executor" },
  instructionsPlaceholder: {
    ar: "راجع مدير العلاقات، الطابق ٣. يوجد صندوق أمانات باسمي.",
    en: "Ask for the relationship manager, 3rd floor. There is a safe deposit box in my name.",
  },
} satisfies LabelSet<string>

/** ٤.٥ — scan or pick; both paths end in one encrypted PDF. */
export const NEW_DOCUMENT = {
  title: { ar: "مستند", en: "Document" },
  fromFiles: { ar: "من الملفات", en: "From files" },
  scan: { ar: "صوّر المستند", en: "Scan the document" },
  scanning: { ar: "جارٍ التصوير…", en: "Scanning…" },
  // The scanner returns loose pages; the file it produces is one document, so
  // it gets a name that says so rather than a camera-roll style timestamp.
  scanNamePrefix: { ar: "مستند ممسوح", en: "Scanned document" },
  scanFailed: {
    ar: "تعذّر إنشاء المستند من الصور. حاول مرة أخرى أو اختر ملفاً.",
    en: "Could not build the document from those pages. Try again, or pick a file.",
  },
  titleLabel: { ar: "العنوان", en: "Title" },
  titlePlaceholder: { ar: "صك ملكية — حطين", en: "Title deed — Hittin" },
  typeLabel: { ar: "النوع", en: "Type" },
  typeDeed: { ar: "صك ملكية", en: "Title deed" },
  typeMarriage: { ar: "عقد زواج", en: "Marriage contract" },
  typeCertificate: { ar: "شهادة", en: "Certificate" },
  typeOther: { ar: "أخرى", en: "Other" },

  qAbout: { ar: "ما هذا المستند؟", en: "What is this document?" },
  qFile: { ar: "أرفق المستند", en: "Attach the document" },
  hFile: {
    ar: "صوّره بالكاميرا صفحةً صفحة، أو اختر ملفاً.",
    en: "Scan it page by page, or pick a file.",
  },
  needsTitle: { ar: "أضف عنواناً للمتابعة", en: "Add a title to continue" },
  needsFile: { ar: "أرفق المستند للمتابعة", en: "Attach the document to continue" },
  sectionAbout: { ar: "المستند", en: "The document" },
  pages: { ar: "{n} صفحة", en: "{n} pages" },
  pickFile: { ar: "اختر ملفاً", en: "Choose a file" },
  fileLabel: { ar: "الملف", en: "The file" },
  // Pages, because a deed is rarely one sheet and the order is baked into the
  // PDF at save — after which nobody can look inside it again.
  addPage: { ar: "أضف صفحة", en: "Add a page" },
  removePage: { ar: "أزل الصفحة", en: "Remove page" },
  movePageBack: { ar: "أخّر الصفحة", en: "Move page back" },
  movePageForward: { ar: "قدّم الصفحة", en: "Move page forward" },
  replaceFile: { ar: "غيّر الملف", en: "Change file" },
  tooLarge: {
    ar: "الملف أكبر من {n} م.ب. اختر ملفاً أصغر.",
    en: "That file is larger than {n} MB. Pick a smaller one.",
  },
} satisfies LabelSet<string>

/** ٤.٦ — the system Photo Picker, so no gallery permission is requested. */
export const NEW_PHOTOS = {
  title: { ar: "اختر الصور والمقاطع", en: "Choose photos and videos" },
  albumLabel: { ar: "اسم الألبوم", en: "Album name" },
  albumPlaceholder: { ar: "صور العائلة", en: "Family photos" },
  choose: { ar: "اختر الصور والمقاطع", en: "Choose photos and videos" },
  chooseMore: { ar: "أضف المزيد", en: "Add more" },
  selected: { ar: "{n} مختارة", en: "{n} selected" },
  removePhoto: { ar: "أزل من الألبوم", en: "Remove from the album" },
  retry: { ar: "أعد المحاولة", en: "Retry" },
  uploadingNow: { ar: "جارٍ الرفع…", en: "Uploading…" },
  // Which one, not how many: the rings already say how far along it got.
  uploadFailedOne: {
    ar: "تعذّر رفع أحد الملفات. المُعلَّم بالأحمر — أعد المحاولة.",
    en: "One item did not upload. The marked one — try again.",
  },
  encryptNote: {
    ar: "تُشفّر الصور والمقاطع ومصغّراتها معاً على جهازك قبل رفعها · {size}",
    en: "Photos, videos and their thumbnails are encrypted together on your device before upload · {size}",
  },
  preparing: { ar: "جارٍ التحضير…", en: "Preparing…" },
  uploading: { ar: "جارٍ رفع {done} من {total}", en: "Uploading {done} of {total}" },
  none: { ar: "لم تختر شيئاً بعد", en: "Nothing chosen yet" },

  qAlbumPhotos: {
    ar: "سمِّ الألبوم واختر صوره ومقاطعه",
    en: "Name the album and choose its photos and videos",
  },
  hPhotos: {
    ar: "حتى {n} صورة أو مقطعاً. يُشفَّر كلٌّ منها على جهازك قبل رفعه.",
    en: "Up to {n} photos or videos. Each is encrypted on your phone before upload.",
  },
  needsAlbum: { ar: "أضف اسماً للمتابعة", en: "Add a name to continue" },
  needsPhotos: {
    ar: "اختر صورة أو مقطعاً واحداً على الأقل",
    en: "Choose at least one photo or video",
  },
  sectionAlbum: { ar: "الألبوم", en: "Album" },
  sectionPhotos: { ar: "الصور والمقاطع", en: "Photos and videos" },
  photosCount: { ar: "في الألبوم: {n}", en: "In the album: {n}" },
} satisfies LabelSet<string>

/** ٤.٧ — the disposition radio is the point of this screen. */
export const NEW_ACCOUNT = {
  title: { ar: "حساب رقمي", en: "Digital account" },
  serviceLabel: { ar: "الخدمة", en: "Service" },
  servicePlaceholder: { ar: "iCloud", en: "iCloud" },
  usernameLabel: { ar: "اسم المستخدم", en: "Username" },
  usernamePlaceholder: { ar: "fatima@icloud.com", en: "fatima@icloud.com" },
  passwordLabel: { ar: "كلمة المرور", en: "Password" },
  recoveryLabel: { ar: "رموز الاسترداد (اختياري)", en: "Recovery codes (optional)" },
  // Free text, not a code: where the second factor lives outlives any code it
  // would generate, and an executor locked out by 2FA is locked out for good.
  twoFactorLabel: { ar: "التحقق بخطوتين (اختياري)", en: "Two-factor (optional)" },
  twoFactorPlaceholder: {
    ar: "مثال: تطبيق Authy على الآيباد، ورموز الاحتياط في الخزنة",
    en: "e.g. Authy on the iPad, backup codes in the safe",
  },
  recoveryPlaceholder: {
    ar: "رمز في كل سطر",
    en: "One code per line",
  },

  qAccountLogin: {
    ar: "أي حساب هذا، وكيف يدخل إليه وصيّك؟",
    en: "Which account is it, and how does your executor sign in?",
  },
  hService: {
    ar: "بريد، أو متجر، أو شبكة اجتماعية — أي خدمة.",
    en: "Email, a store, a social network — any service.",
  },
  qExtra: { ar: "هل يطلب الحساب رمزاً ثانياً؟", en: "Does the account ask for a second code?" },
  hExtra: {
    ar: "إن كان كذلك، فأين يجده وصيّك؟ ورموز الاسترداد إن وُجدت.",
    en: "If so, where will your executor find it? And any recovery codes.",
  },
  needsService: { ar: "أضف اسم الخدمة للمتابعة", en: "Add the service to continue" },
  needsLogin: { ar: "أكمل بيانات الدخول للمتابعة", en: "Complete the login to continue" },
  sectionLogin: { ar: "الحساب", en: "The account" },
  sectionExtra: { ar: "الحماية الإضافية", en: "Extra protection" },
  sectionDisposition: { ar: "ما يفعله الوصي", en: "What your executor does" },
  loginSummary: { ar: "{username} · كلمة المرور محفوظة", en: "{username} · password saved" },
  recoverySummary: { ar: "رموز الاسترداد: {n}", en: "Recovery codes: {n}" },
  twoFactorSummary: { ar: "مكان الرمز الثاني محفوظ", en: "Second factor noted" },
  extraNone: { ar: "لا شيء", en: "None" },

  dispositionLabel: {
    ar: "ما الذي تريده من الوصي؟",
    en: "What should your executor do?",
  },
  dispositionHandOver: { ar: "يُسلَّم كما تنصّ الوصية", en: "Hand it over as the will says" },
  dispositionDelete: { ar: "احذفه نهائياً", en: "Delete it permanently" },
  // What choosing each one actually does. Every option gets a line,
  // because these are three different instructions to a grieving person.
  dispositionHandOverNote: {
    ar: "يستلم الدخول ويكمل هو",
    en: "They get the login and carry on",
  },
  dispositionDeleteNote: {
    ar: "التعليمات تصل الوصي",
    en: "The instruction reaches your executor",
  },
  dispositionMemorialiseNote: {
    ar: "للمنصات التي تدعم ذلك",
    en: "Where the platform supports it",
  },
  chooseToContinue: {
    ar: "اختر واحداً للمتابعة",
    en: "Choose one to continue",
  },
  dispositionMemorialise: {
    ar: "حوّله إلى حساب تذكاري",
    en: "Turn it into a memorial account",
  },
  dispositionNote: {
    ar: "سيرى الوصي هذه التعليمات مكتوبة بخطك عند الإفراج.",
    en: "Your executor will see this instruction in your own words at release.",
  },
} satisfies LabelSet<string>

/** ٤.٨ — a letter, not a form. */
export const NEW_NOTE = {
  title: { ar: "ملاحظة مشفّرة", en: "Encrypted note" },
  kindInstructions: { ar: "تعليمات", en: "Instructions" },
  kindWhereabouts: { ar: "مكان أشياء", en: "Where things are" },
  kindWish: { ar: "وصية شخصية", en: "Personal wish" },

  kindInstructionsDetail: {
    ar: "خطوات تريد أن يتّبعها وصيّك",
    en: "Steps you want your executor to follow",
  },
  kindWhereaboutsDetail: {
    ar: "أين يجد المفاتيح والأوراق والأشياء",
    en: "Where to find keys, papers and things",
  },
  kindWishDetail: {
    ar: "كلمة أو رغبة تتركها لمن بعدك",
    en: "A word or a wish for those after you",
  },
  qAbout: { ar: "ما نوع ملاحظتك؟", en: "What kind of note is it?" },
  qBody: { ar: "اكتبها، أو سجّلها بصوتك", en: "Write it, or record it in your voice" },
  sectionAbout: { ar: "الملاحظة", en: "The note" },
  sectionBody: { ar: "المحتوى", en: "Content" },
  voiceSummary: { ar: "تسجيل صوتي · {d}", en: "Voice recording · {d}" },
  titleLabel: { ar: "العنوان", en: "Title" },
  titlePlaceholder: {
    ar: "مكان المفاتيح والأوراق",
    en: "Where the keys and papers are",
  },
  // The placeholder changes with the kind pill, which is what the pills are for.
  bodyInstructions: {
    ar: "اكتب هنا ما تريد أن يفعله الوصي، خطوة بخطوة…",
    en: "Write what you want your executor to do, step by step…",
  },
  bodyWhereabouts: {
    ar: "مفتاح الخزنة الحديدية في المكتب، الدرج الثاني، خلف ملف «الضمان».",
    en: "The safe key is in the office, second drawer, behind the “warranty” file.",
  },
  bodyWish: {
    ar: "أوصي بأن تُقسّم مقتنيات أمي بين البنات بالتشاور، لا بالقسمة الحسابية.",
    en: "I wish my mother's things divided among the daughters by agreement, not arithmetic.",
  },
  words: { ar: "{n} كلمة", en: "{n} words" },
  readOnRelease: { ar: "تُقرأ عند الإفراج", en: "Read at release" },

  // Written or spoken. The tabs name the act, not the file format — "صوت"
  // alone would read as a setting rather than as the other way to write this.
  formatText: { ar: "كتابة", en: "Write" },
  formatVoice: { ar: "تسجيل صوتي", en: "Record" },
  voiceHint: {
    ar: "اضغط لتبدأ التسجيل — حتى {n} دقائق",
    en: "Tap to start recording — up to {n} minutes",
  },
  // Said where the recording is reviewed, because a spoken note is the one
  // thing in the vault an executor hears in the owner's own voice.
  voiceNote: {
    ar: "سيسمع الوصي صوتك كما سجّلته. يُشفَّر التسجيل على جهازك قبل الحفظ.",
    en: "Your executor will hear this in your own voice. The recording is encrypted on your device before saving.",
  },
  rerecord: { ar: "سجّل من جديد", en: "Record again" },
  // Says why there is no play button over a saved take, rather than leaving
  // the owner to conclude the recording was lost.
  voiceStoredNote: {
    ar: "التسجيل مشفَّر في الخزنة ولا يُفتح هنا. سجّل من جديد إن أردت استبداله.",
    en: "The recording is encrypted in your vault and is not opened here. Record again to replace it.",
  },
  micDenied: {
    ar: "لم يُسمح لوصيّة باستخدام الميكروفون. فعّل الإذن من إعدادات جهازك، أو اكتب ملاحظتك بدلاً من ذلك.",
    en: "Wassiya was not allowed to use the microphone. Enable it in your device settings, or write the note instead.",
  },
  micFailed: {
    ar: "تعذّر التسجيل. حاول مرة أخرى.",
    en: "Could not record. Try again.",
  },
  needsVoice: { ar: "سجّل ملاحظتك للمتابعة", en: "Record your note to continue" },
  needsBody: { ar: "اكتب ملاحظتك للمتابعة", en: "Write your note to continue" },
  needsTitle: { ar: "أضف عنواناً للمتابعة", en: "Add a title to continue" },

  // Dictation writes *text*; it is not the voice note, and the label says so.
  dictate: { ar: "إملاء", en: "Dictate" },
  dictateStop: { ar: "أوقف الإملاء", en: "Stop dictation" },

  // Autosave. "حُفظت" here means kept on this device, not stored in the vault —
  // the wording has to hold that line or it promises encryption it has not done.
  draftJustNow: { ar: "محفوظة على جهازك الآن", en: "Kept on your device just now" },
  draftAgo: {
    ar: "محفوظة على جهازك قبل {n} دقيقة",
    en: "Kept on your device {n} min ago",
  },
  draftNote: {
    ar: "المسودة على هذا الجهاز فقط، وتُشفَّر عند الحفظ في الخزنة.",
    en: "The draft stays on this device, and is encrypted when you save it to your vault.",
  },
} satisfies LabelSet<string>

/** Investments and shares. */
export const NEW_INVESTMENT = {
  title: { ar: "استثمارات وأسهم", en: "Investments" },
  qAbout: { ar: "ما الاستثمار، وأين هو؟", en: "What is the investment, and where is it held?" },
  hAbout: {
    ar: "يكفي أن يعرف وصيّك الوسيط ورقم الحساب ليبدأ.",
    en: "The broker and the account number are enough for your executor to start.",
  },
  kindStocks: { ar: "محفظة أسهم", en: "Stock portfolio" },
  kindStocksDetail: { ar: "عبر وسيط أو تطبيق تداول", en: "Through a broker or a trading app" },
  kindFund: { ar: "صندوق استثماري", en: "Investment fund" },
  kindFundDetail: { ar: "صندوق عقاري أو مرابحة أو غيره", en: "A real-estate, murabaha or other fund" },
  kindOther: { ar: "استثمار آخر", en: "Other investment" },
  kindOtherDetail: { ar: "تمويل جماعي، صكوك، أو غيرها", en: "Crowdfunding, sukuk, or anything else" },
  providerLabel: { ar: "الوسيط أو المنصة", en: "Broker or platform" },
  providerPlaceholder: { ar: "الراجحي المالية", en: "Al Rajhi Capital" },
  accountNumberLabel: { ar: "رقم الحساب أو المحفظة", en: "Account or portfolio number" },
  accountNumberPlaceholder: { ar: "123456789", en: "123456789" },
  qAccess: { ar: "كيف يصل وصيّك إليه؟", en: "How does your executor reach it?" },
  hAccess: {
    ar: "بيانات الدخول اختيارية — غالباً يطلب الوسيط شهادة الوفاة وصك حصر الورثة.",
    en: "The login is optional — a broker usually asks for the death certificate and the inheritance deed.",
  },
  usernameLabel: { ar: "اسم المستخدم (اختياري)", en: "Username (optional)" },
  passwordLabel: { ar: "كلمة المرور (اختياري)", en: "Password (optional)" },
  instructionsLabel: { ar: "تعليمات للوصي", en: "Instructions for your executor" },
  instructionsPlaceholder: {
    ar: "مدير المحفظة: أ. سعد، هاتفه في جهات التواصل. لا تبع قبل استشارته.",
    en: "Portfolio manager: Saad, in my contacts. Do not sell before asking him.",
  },
  needsKind: { ar: "اختر النوع للمتابعة", en: "Choose a type to continue" },
  needsProvider: { ar: "أضف الوسيط أو المنصة للمتابعة", en: "Add the broker or platform to continue" },
  sectionAbout: { ar: "الاستثمار", en: "The investment" },
  sectionAccess: { ar: "الوصول والتعليمات", en: "Access and instructions" },
  loginSummary: { ar: "{username} · كلمة المرور محفوظة", en: "{username} · password saved" },
} satisfies LabelSet<string>

/** Insurance policies. */
export const NEW_INSURANCE = {
  title: { ar: "تأمين", en: "Insurance" },
  qAbout: { ar: "ما وثيقة التأمين؟", en: "Which insurance policy is it?" },
  kindLife: { ar: "على الحياة", en: "Life" },
  kindLifeDetail: { ar: "يُصرف مبلغه للمستفيد عند الوفاة", en: "Pays the beneficiary on death" },
  kindHealth: { ar: "صحي", en: "Health" },
  kindHealthDetail: { ar: "قد يغطي مصاريف أخيرة، أو يلزم إلغاؤه", en: "May cover final costs, or need cancelling" },
  kindProperty: { ar: "ممتلكات أو مركبة", en: "Property or vehicle" },
  kindPropertyDetail: { ar: "منزل، سيارة، أو غيرها", en: "A home, a car, or anything else" },
  kindOther: { ar: "أخرى", en: "Other" },
  kindOtherDetail: { ar: "ادخار، تقاعد، أو غيره", en: "Savings, pension, or anything else" },
  companyLabel: { ar: "شركة التأمين", en: "Insurer" },
  companyPlaceholder: { ar: "التعاونية", en: "Tawuniya" },
  policyNumberLabel: { ar: "رقم الوثيقة", en: "Policy number" },
  policyNumberPlaceholder: { ar: "POL-2024-00123", en: "POL-2024-00123" },
  qClaim: { ar: "كيف يُطالَب بها؟", en: "How is it claimed?" },
  hClaim: {
    ar: "لن يعرف وصيّك أن الوثيقة موجودة ما لم تخبره هنا.",
    en: "Your executor will not know the policy exists unless you say so here.",
  },
  beneficiaryLabel: { ar: "المستفيد كما في الوثيقة", en: "Beneficiary, as named on the policy" },
  beneficiaryPlaceholder: { ar: "زوجتي نورة", en: "My wife, Noura" },
  instructionsLabel: { ar: "كيف يُطالَب بها", en: "How to claim" },
  instructionsPlaceholder: {
    ar: "راجع فرع الشركة بشهادة الوفاة ونسخة من الوثيقة. المندوب: أ. فهد.",
    en: "Visit the insurer's branch with the death certificate and a copy of the policy. Agent: Fahad.",
  },
  needsKind: { ar: "اختر النوع للمتابعة", en: "Choose a type to continue" },
  needsCompany: { ar: "أضف شركة التأمين للمتابعة", en: "Add the insurer to continue" },
  sectionAbout: { ar: "الوثيقة", en: "The policy" },
  sectionClaim: { ar: "المطالبة", en: "Claiming" },
} satisfies LabelSet<string>

