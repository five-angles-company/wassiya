/**
 * ٧ — the heir-claim funnel's copy.
 *
 * Arabic only, deliberately, for now. The board ships a عربي/English toggle and
 * the funnel's own note says the voice must stay *"plain, warm, never
 * euphemistic about death"* — which is a translation job, not a `t()` call, and
 * worth doing properly rather than machine-mirroring. The shape here matches
 * the app's own catalogue, so a second locale is an added field per key rather
 * than a rewrite.
 *
 * A plain module rather than the app's `{ar,en}` LabelSet because `apps/web`
 * has no `useStrings` equivalent, and a server component cannot call a hook to
 * read copy anyway.
 */
export const CLAIM = {
  metaTitle: "طلب الوصول إلى إرث رقمي · وصيّة",
  metaDescription:
    "إذا فقدت شخصاً عزيزاً كان يحفظ إرثه الرقمي في وصيّة، يمكنك تقديم بلاغ وفاة لبدء التحقق. مجاناً، وبدون تطبيق.",

  brand: "وصيّة",
  myAccount: "هذا حسابي",

  title: "طلب الوصول إلى إرث رقمي",
  intro:
    "إذا فقدت شخصاً عزيزاً كان يحفظ إرثه الرقمي في وصيّة، يمكنك تقديم بلاغ وفاة لبدء التحقق.",
  condolence: "نعتذر لخسارتك. سنشرح كل خطوة قبل أن تبدأها، ولن نطلب منك أي مبلغ.",

  start: "تقديم بلاغ وفاة",
  startMeta: "٣ خطوات · نحو ١٠ دقائق",

  resumeTitle: "لديك رابط طلب سابق؟",
  resumeBody: "افتحه لمتابعة الحالة — أرسلناه إلى بريدك",
  guardianTitle: "أنت وصي؟",
  guardianBody: "دورك يأتي بعد مدة الاعتراض",

  needTitle: "ستحتاج ثلاثة أشياء",
  needs: [
    "هويتك الوطنية أو الإقامة",
    "شهادة الوفاة الرسمية",
    "الهاتف الذي سجّله لك",
  ],

  stepsTitle: "ما يحدث بعد ذلك",
  steps: [
    { n: "١", label: "تحقّق من هويتك", meta: "دقيقتان" },
    { n: "٢", label: "رفع شهادة الوفاة ومطابقة الاسم" },
    { n: "٣", label: "مدة اعتراض ٣٠ يوماً", meta: "نُبلغ صاحب الحساب" },
    { n: "٤", label: "الإفراج عمّا خُصّص لك وحدك" },
  ],

  disclaimer: "وصيّة ليست جهة قانونية ولا تقسّم التركات.",
  terms: "الشروط",
  privacy: "الخصوصية",
  howEncryption: "كيف يعمل التشفير",
} as const

/** ٧.٤ — the status page they re-open for weeks. */
export const CLAIM_STATUS = {
  metaTitle: "حالة طلب الوراثة · وصيّة",
  heading: "طلبك قيد الانتظار",
  // The reason, stated first and without hedging. The board: vagueness here
  // reads as theft or stonewalling.
  why: "هذه المدة موجودة لسبب واحد: إن كان صاحب الحساب حيّاً، فله الحق أن يعترض. لن نُفرج عن شيء قبل {date}.",
  claimRef: "رقم الطلب",
  submittedAt: "قُدّم في {date}",
  daysLeft: "يوماً متبقياً",
  vetoEnds: "تنتهي مدة الاعتراض {date}",
  noLogin: "أرسلنا هذا الرابط إلى بريدك — لا حاجة لحساب أو كلمة مرور.",
  contact: "تواصل معنا بشأن الطلب",

  // The timeline — including "the owner was told". Radical transparency is the
  // design instruction, and hiding that step is what would read as a seizure.
  stepReceived: "استُلم البلاغ وتحقّقنا من هويتك",
  stepNotified: "أُبلغ صاحب الحساب على كل قنواته",
  stepNotifiedMeta: "إشعار، بريد، رسالة نصية",
  stepVeto: "مدة الاعتراض جارية",
  stepGuardian: "تأكيد الوصي",
  stepGuardianMeta: "يُطلب منه بعد انتهاء المدة",
  stepRelease: "الإفراج عمّا خُصّص لك",
  stepReleaseMeta: "تلقائياً — نرسل لك رابطاً",

  statusWaiting: "قيد الانتظار",
  statusReview: "قيد المراجعة اليدوية",
  statusGuardian: "بانتظار تأكيد الوصي",
  statusReleased: "تم الإفراج",
  statusVetoed: "أُغلق الطلب",
  statusLocked: "الطلب مغلق",

  // A veto is a designed state, not an error, and must not read as an
  // accusation — the person reading it has usually just lost someone.
  vetoedTitle: "أُغلق هذا الطلب",
  vetoedBody:
    "اعترض صاحب الحساب على الطلب خلال المدة المتاحة له، ولذلك لن يُفرج عن شيء. إن كنت تعتقد أن هناك خطأً، تواصل معنا.",
  releasedTitle: "تم الإفراج",
  releasedBody: "أرسلنا إلى بريدك رابطاً لصندوقك.",
  openBox: "افتح صندوقك",

  notFoundTitle: "لم نجد هذا الطلب",
  notFoundBody:
    "قد يكون الرابط قديماً أو غير مكتمل. افتح الرابط الذي أرسلناه إلى بريدك، أو ابدأ بلاغاً جديداً.",
  startOver: "ابدأ بلاغاً جديداً",
} as const

/** ٧.٢ — step 1: who are you, and whose vault is this. */
export const CLAIM_IDENTITY = {
  metaTitle: "التحقق من هويتك · وصيّة",
  step: "الخطوة ١ من ٣",
  heading: "من أنت؟",
  // The board's own line. It does the work of not making a grieving relative
  // feel accused at the first gate.
  intro:
    "نتحقق من هويتك أولاً — لا لأننا نشكّ فيك، بل لأن أحداً غيرك قد ينتحل صفتك.",

  signInTitle: "سجّل الدخول أولاً",
  signInBody:
    "نحتاج حساباً لنربط الطلب بك، ولنمنع تقديم طلبات متكررة باسمك. مجاناً، ودقيقة واحدة.",
  signIn: "تسجيل الدخول",

  subjectLabel: "بريد صاحب الحساب المتوفى",
  subjectHint: "البريد الذي كان يستخدمه في وصيّة",
  nameLabel: "اسمك الكامل كما في هويتك",
  contactLabel: "رقم جوالك",
  contactHint: "سنستخدمه للتواصل بشأن الطلب",
  fileClaim: "تسجيل البلاغ",
  filing: "جارٍ التسجيل…",

  checks: [
    "صورة لهويتك أو جواز سفرك",
    "صورة حيّة لوجهك",
    "رمز يُرسل إلى الرقم الذي سجّله لك المتوفى",
  ],
  startVerify: "ابدأ التحقق",
  starting: "جارٍ الفتح…",
  popupNote: "يفتح مزوّد التحقق في نافذة آمنة",
  popupBlocked:
    "منع المتصفح فتح النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع، أو افتح الرابط في تبويب جديد.",
  openInTab: "افتح في تبويب جديد",

  whyNumberTitle: "لماذا رقم محدّد؟",
  whyNumberBody:
    "الرمز يُرسل إلى الرقم الذي سجّله المتوفى لك — لا إلى رقم تكتبه أنت. هذا ما يجعل انتحال صفتك صعباً.",

  handoffTitle: "أكمل من هاتفك",
  handoffBody: "افتح هذا الرابط على هاتفك لتصوير هويتك بكاميرا الهاتف.",
  copyLink: "انسخ الرابط",
  copied: "نُسخ",

  privacyNote:
    "تُحفظ صورك مشفّرة وتُستخدم للتحقق فقط، ولا تُشارك مع الورثة الآخرين.",

  verified: "تم التحقق من هويتك",
  continue: "متابعة إلى شهادة الوفاة",
  failed: "تعذّر بدء التحقق. حاول مرة أخرى.",
  filed: "سجّلنا بلاغك",
} as const

/** ٧.٣ — step 2: the death certificate. */
export const CLAIM_CERTIFICATE = {
  metaTitle: "شهادة الوفاة · وصيّة",
  step: "الخطوة ٢ من ٣",
  heading: "شهادة الوفاة",
  intro:
    "ارفع الشهادة الرسمية. نطابق الاسم مع الهوية التي وثّقها صاحب الحساب عند التسجيل.",

  dropHere: "اسحب الملف هنا",
  dropHint: "PDF أو صورة · حتى ٢٠ م.ب",
  pickFile: "اختر ملفاً",
  uploaded: "رُفع",
  replace: "غيّر الملف",
  tooLarge: "الملف أكبر من ٢٠ م.ب. اختر ملفاً أصغر.",
  wrongType: "نقبل PDF أو صورة فقط.",
  uploading: "جارٍ الرفع…",

  nameLabel: "اسم المتوفى كما في الشهادة",
  nameHint: "انسخه حرفياً من الشهادة، حتى لو اختلف عن نطقه المعتاد",
  dateLabel: "تاريخ الوفاة",
  placeLabel: "المكان",
  refLabel: "رقم الشهادة (اختياري)",

  submit: "إرسال للمراجعة",
  submitting: "جارٍ الإرسال…",
  submitNote: "يمكنك إغلاق الصفحة بعدها — سنرسل لك رابط المتابعة.",
  failed: "تعذّر الإرسال. لم يُحفظ شيء — حاول مرة أخرى.",

  // Transliteration varies far more often than anyone forges a certificate, so
  // a mismatch is a review queue, never a rejection.
  matchNote:
    "إن اختلف رسم الاسم عن المسجّل لدينا، يذهب الطلب إلى مراجعة بشرية — لا يُرفض.",
} as const

/** ٧.٦ — the heir's box, after release. */
export const HEIR_BOX = {
  metaTitle: "صندوق الوارث · وصيّة",
  boxOf: "صندوقك · {name}",
  releasedAt: "أُفرج {date}",
  heading: "ما تركه لك {owner}",
  // The ceiling, stated before anything is shown.
  scope:
    "هذه نسختك وحدك — لا ترى ما خُصّص لغيرك، ولا يرى غيرك ما خُصّص لك.",

  // The key ceremony. The board draws the opened box; the security model
  // requires this step to reach it.
  lockedTitle: "أدخل نصيب الوصي",
  lockedBody:
    "نحتفظ بنصف مفتاح صندوقك فقط. النصف الآخر لدى الوصي — اطلبه منه وأدخله هنا. لا نستطيع فتح الصندوق بدونه، ولا نحتفظ بنسخة منه.",
  shareLabel: "نصيب الوصي",
  sharePlaceholder: "الصق النصيب الذي أعطاك إياه الوصي",
  unlock: "افتح الصندوق",
  unlocking: "جارٍ الفتح…",
  badShare:
    "لم ينجح هذا النصيب في فتح الصندوق. تأكد أنك نسخته كاملاً من الوصي.",

  messageTitle: "رسالة لك وحدك",
  assetsTitle: "أصول خُصّصت لك — {n}",
  downloadAll: "تحميل كل شيء",
  colAsset: "الأصل",
  colType: "النوع",
  colHandover: "الاستلام",
  colState: "الحالة",
  stateOpen: "مفتوح",
  stateSteps: "يحتاج خطوات",
  download: "تحميل",
  howTo: "كيف أستردها؟",

  farAid:
    "تقسيم القيمة بينكم يتم وفق الفرائض وبإجراءات الإرث المعتادة — وصيّة سلّمتك الوصول فقط.",
  expiry: "يبقى هذا الصندوق متاحاً ٩٠ يوماً، فحمّل ما يهمّك.",

  notReleased: "لم يُفرج عن هذا الصندوق بعد.",
  checkStatus: "تابع حالة الطلب",
} as const
