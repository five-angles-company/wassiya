/**
 * ٤.٣–٤.٨ — the six add-asset wizards.
 *
 * One dictionary per wizard plus the chrome they share, keyed by their
 * own routes (`/assets/new/crypto`, `/assets/new/bank`, …).
 *
 * The footer button was to read "التالي: من يستلمه؟" on every one of these,
 * because each wizard is two steps and the second is heir assignment (5.3).
 * That screen is not built, so `save`/`unroutedNote` below say what actually
 * happens instead. See `WizardFrame` for why that label was not kept
 * over a button that does not go there.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** Chrome shared by all six. */
export const ASSET_NEW = {
  back: { ar: "رجوع", en: "Back" },
  stepSeparator: { ar: "من", en: "of" },
  // The original label. It was replaced by "احفظ في الخزنة" while 5.3 did
  // not exist and the run really did end here; it does exist, so the button
  // can promise the step it actually takes again.
  save: { ar: "التالي: من يستلمه؟", en: "Next: who receives it?" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },
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
    ar: "إضافة الأصول متوقّفة حتى تجديد الاشتراك. خزنتك وكل ما فيها يبقى كما هو، وتسليم الورثة يعمل.",
    en: "Adding assets is paused until your subscription renews. Your vault and everything in it is untouched, and heir delivery still works.",
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
  // the account *is* the custody — so the form asks for what an heir would
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
  branchLabel: { ar: "الفرع (اختياري)", en: "Branch (optional)" },
  branchPlaceholder: { ar: "مثال: فرع العليا", en: "e.g. Olaya branch" },
  instructionsLabel: { ar: "تعليمات للوارث", en: "Instructions for your heir" },
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
  title: { ar: "اختر الصور", en: "Choose photos" },
  albumLabel: { ar: "اسم الألبوم", en: "Album name" },
  albumPlaceholder: { ar: "صور العائلة", en: "Family photos" },
  choose: { ar: "اختر الصور", en: "Choose photos" },
  chooseMore: { ar: "أضف المزيد", en: "Add more" },
  selected: { ar: "{n} مختارة", en: "{n} selected" },
  removePhoto: { ar: "أزل الصورة", en: "Remove photo" },
  retry: { ar: "أعد المحاولة", en: "Retry" },
  uploadingNow: { ar: "جارٍ الرفع…", en: "Uploading…" },
  // Which one, not how many: the rings already say how far along it got.
  uploadFailedOne: {
    ar: "تعذّر رفع صورة. المُعلَّمة بالأحمر — أعد المحاولة.",
    en: "One photo did not upload. The marked one — try again.",
  },
  encryptNote: {
    ar: "تُشفّر الصور والمصغّرات معاً على جهازك قبل رفعها · {size}",
    en: "Photos and thumbnails are encrypted together on your device before upload · {size}",
  },
  preparing: { ar: "جارٍ التحضير…", en: "Preparing…" },
  uploading: { ar: "جارٍ رفع {done} من {total}", en: "Uploading {done} of {total}" },
  none: { ar: "لم تختر صوراً بعد", en: "No photos chosen yet" },
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
  // would generate, and an heir locked out by 2FA is locked out for good.
  twoFactorLabel: { ar: "التحقق بخطوتين (اختياري)", en: "Two-factor (optional)" },
  twoFactorPlaceholder: {
    ar: "مثال: تطبيق Authy على الآيباد، ورموز الاحتياط في الخزنة",
    en: "e.g. Authy on the iPad, backup codes in the safe",
  },
  recoveryPlaceholder: {
    ar: "رمز في كل سطر",
    en: "One code per line",
  },

  dispositionLabel: {
    ar: "ما الذي تريده من الوارث؟",
    en: "What should your heir do?",
  },
  dispositionHandOver: { ar: "سلّمه إلى وارث", en: "Hand it over" },
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
    ar: "سيرى الوارث هذه التعليمات مكتوبة بخطك عند الإفراج.",
    en: "Your heir will see this instruction in your own words at release.",
  },
} satisfies LabelSet<string>

/** ٤.٨ — a letter, not a form. */
export const NEW_NOTE = {
  title: { ar: "ملاحظة مشفّرة", en: "Encrypted note" },
  kindInstructions: { ar: "تعليمات", en: "Instructions" },
  kindWhereabouts: { ar: "مكان أشياء", en: "Where things are" },
  kindWish: { ar: "وصية شخصية", en: "Personal wish" },
  titleLabel: { ar: "العنوان", en: "Title" },
  titlePlaceholder: {
    ar: "مكان المفاتيح والأوراق",
    en: "Where the keys and papers are",
  },
  // The placeholder changes with the kind pill, which is what the pills are for.
  bodyInstructions: {
    ar: "اكتب هنا ما تريد أن يفعله الوارث، خطوة بخطوة…",
    en: "Write what you want your heir to do, step by step…",
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

  // Toolbar. Labels are for screen readers — the buttons show glyphs only.
  bold: { ar: "عريض", en: "Bold" },
  italic: { ar: "مائل", en: "Italic" },
  list: { ar: "قائمة", en: "List" },
  wishBlock: { ar: "فقرة وصية", en: "Wish block" },
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
