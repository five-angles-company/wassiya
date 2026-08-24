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
