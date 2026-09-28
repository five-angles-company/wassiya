/**
 * ٥ — الأوصياء.
 *
 * Every executor receives everything the owner hands over, whole, and carries
 * out the will; there are no shares and no per-person choices anywhere in these
 * strings (الأنصبة يحدّدها القانون، لا التطبيق).
 *
 * Two promises are stated wherever they apply and must never be softened:
 * Wassiya tells an executor nothing before release, and Wassiya holds no key —
 * if every sheet is lost, nobody can open what was handed over.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٥.١ — the executors list. */
export const EXECUTORS = {
  title: { ar: "الأوصياء", en: "Executors" },
  countZero: { ar: "لا أوصياء بعد", en: "No executors yet" },
  countOne: { ar: "وصيّ واحد", en: "1 executor" },
  countTwo: { ar: "وصيّان", en: "2 executors" },
  countFew: { ar: "{n} أوصياء", en: "{n} executors" },
  countMany: { ar: "{n} وصيّاً", en: "{n} executors" },

  sheetPrinted: { ar: "ورقته مطبوعة · {date}", en: "Sheet printed · {date}" },
  // The one fact about an executor that can be silently wrong: named, but
  // holding nothing that opens the handover.
  noSheet: {
    ar: "لم تُطبع ورقته بعد — لن يستطيع فتح شيء",
    en: "No sheet printed yet — they could open nothing",
  },

  add: { ar: "أضف وصياً", en: "Add an executor" },

  searchPlaceholder: { ar: "ابحث في الأوصياء", en: "Search your executors" },
  filterAll: { ar: "الكل", en: "All" },
  filterNoSheet: { ar: "بلا ورقة", en: "No sheet" },
  noResultsTitle: { ar: "لا يوجد ما يطابق بحثك", en: "Nothing matches" },
  noResultsBody: {
    ar: "جرّب اسماً آخر، أو أزل عامل التصفية.",
    en: "Try another name, or clear the filter.",
  },
  clearFilters: { ar: "أظهر كل الأوصياء", en: "Show all executors" },
  emptyTitle: { ar: "من سيستلم ما تتركه؟", en: "Who will receive what you leave?" },
  emptyLead: {
    ar: "يستلم ما تسلّمه بعد وفاتك وينفّذ وصيّتك. اختر من تثق به.",
    en: "They receive what you hand over after your death and carry out your will. Choose someone you trust.",
  },
  howItWorks: {
    ar: "كل وصيّ يستلم كل ما تسلّمه. لا نخبره بشيء قبل وفاتك.",
    en: "Each executor receives everything you hand over. We tell them nothing before your death.",
  },
  // Wassiya holds no key. This is the price of that, stated where the owner
  // decides how many executors and sheets to keep.
  lossNotice: {
    ar: "إن ضاعت كل الأوراق ووثيقة استردادك، لا يفتح أحد ما تركته — ولا نحن.",
    en: "If every sheet and your recovery sheet are lost, nobody can open what you left — not even us.",
  },
} satisfies LabelSet<string>

/** ٥.٢ — adding one. The edit screen borrows these labels wholesale. */
export const EXECUTOR_NEW = {
  title: { ar: "إضافة وصيّ", en: "Add an executor" },
  // How it works, above the form: the two promises that must reach the owner
  // before they name someone — the sheet opens nothing while they live, and
  // Wassiya tells the executor nothing before release.
  step1: { ar: "سمِّ شخصاً تثق به", en: "Name someone you trust" },
  step1Body: {
    ar: "باسمه ورقم جواله ورقم هويته.",
    en: "With their name, mobile number and ID number.",
  },
  step2: { ar: "اطبع ورقته", en: "Print their sheet" },
  step2Body: {
    ar: "تفتح ما سلّمته بعد وفاتك فقط.",
    en: "It opens what you hand over, only after your death.",
  },
  step3: {
    ar: "أعطه إياها، أو احفظها مع وصيّتك",
    en: "Give it to them, or keep it with your will",
  },
  step3Body: {
    ar: "لا نخبره بشيء قبل التحقق من الوفاة.",
    en: "We tell them nothing until a death is verified.",
  },
  nameLabel: { ar: "الاسم الكامل كما في الهوية", en: "Full name, as on their ID" },
  namePlaceholder: { ar: "سارة عبدالله المنصوري", en: "Sarah Abdullah Al-Mansouri" },

  phoneLabel: { ar: "رقم الجوال", en: "Mobile number" },
  phonePlaceholder: { ar: "55 118 2210", en: "55 118 2210" },
  // Validated hard: this is the channel the release chain uses, and a wrong
  // digit is discovered when nobody can ask the owner to fix it.
  phoneInvalid: {
    ar: "رقم غير صالح لهذه الدولة — به نتواصل معه بعد الوفاة.",
    en: "Not valid for this country — it is how we reach them after a death.",
  },
  phoneDuplicate: {
    ar: "لديك وصيّ بهذا الرقم بالفعل.",
    en: "You already have an executor with this number.",
  },

  emailLabel: { ar: "البريد الإلكتروني (اختياري)", en: "Email (optional)" },
  emailPlaceholder: { ar: "sara@example.com", en: "sara@example.com" },
  emailHint: {
    ar: "نراسله عليه أيضاً عند التسليم.",
    en: "We write here too at delivery.",
  },
  emailInvalid: { ar: "بريد غير صالح.", en: "That is not an email address." },

  idNumberLabel: { ar: "رقم الهوية الوطنية أو الإقامة", en: "National ID or residency number" },
  idNumberPlaceholder: { ar: "1023456789", en: "1023456789" },
  idNumberHint: {
    ar: "نطابقه بهويته قبل أن يُفتح له شيء. لا نحفظ الرقم نفسه.",
    en: "We match it to their ID before anything opens. We never store the number.",
  },
  idNumberRegistered: {
    ar: "مسجّل — اكتب رقماً جديداً لاستبداله",
    en: "Registered — type a new number to replace it",
  },
  idNumberInvalid: { ar: "الرقم قصير جداً.", en: "That number is too short." },

  submit: { ar: "أضف الوصي", en: "Add executor" },
  submitBlocked: {
    ar: "أكمل الاسم والجوال ورقم الهوية",
    en: "Add a name, a mobile number and an ID number",
  },
  saving: { ar: "جارٍ الإضافة…", en: "Adding…" },
  failed: { ar: "تعذّرت الإضافة. حاول مرة أخرى.", en: "Could not add. Try again." },
} satisfies LabelSet<string>

/** ٥.٢b — editing one, and deleting one. Field labels come from EXECUTOR_NEW. */
export const EXECUTOR_EDIT = {
  title: { ar: "تعديل وصيّ", en: "Edit executor" },
  /** Deleted from another device while this list was open. */
  notFound: { ar: "لم نعد نجد هذا الوصي.", en: "This executor no longer exists." },
  save: { ar: "حفظ التعديل", en: "Save changes" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },
  failed: {
    ar: "تعذّر حفظ التعديل. حاول مرة أخرى.",
    en: "Could not save. Try again.",
  },

  sheetRow: { ar: "ورقة الوصي", en: "Executor sheet" },
  sheetNone: { ar: "لم تُطبع بعد — اطبعها الآن", en: "Not printed yet — print it now" },
  sheetPrinted: {
    ar: "مطبوعة · {date} · الإصدار {v}",
    en: "Printed · {date} · version {v}",
  },

  deleteExecutor: { ar: "حذف الوصي", en: "Delete executor" },
  deleteTitle: { ar: "حذف {name}؟", en: "Delete {name}?" },
  deleteBody: {
    ar: "لن يستلم {name} شيئاً، وتتوقف ورقته عن العمل.",
    en: "{name} will receive nothing, and their sheet stops working.",
  },
  // With no executor left, no delivery is ever created: what was handed over
  // reaches nobody. Said before the confirmation, not after.
  deleteLast: {
    ar: "{name} هو وصيّك الوحيد. بعد حذفه لن يصل ما سلّمته إلى أحد حتى تضيف وصياً آخر.",
    en: "{name} is your only executor. Without them, nothing you hand over reaches anyone until you add another.",
  },
  deleteFinal: { ar: "لا يمكن التراجع عن هذا.", en: "This cannot be undone." },
  deletePermanently: { ar: "احذفه نهائياً", en: "Delete permanently" },
  deleting: { ar: "جارٍ الحذف…", en: "Deleting…" },
  keepIt: { ar: "إبقاؤه", en: "Keep them" },
  deleteFailed: {
    ar: "تعذّر الحذف. حاول مرة أخرى.",
    en: "Could not delete. Try again.",
  },
} satisfies LabelSet<string>

/**
 * ٥.٣ — printing an executor's sheet.
 *
 * The printed page explains itself without the app: it is read after a death,
 * possibly by someone who never saw this screen.
 */
export const EXECUTOR_SHEET = {
  title: { ar: "ورقة {name}", en: "{name}'s sheet" },
  body: {
    ar: "أعطها لـ{name} أو احفظها مع وصيّتك. لا تفتح شيئاً ما دمت حيّاً.",
    en: "Give it to {name} or keep it with your will. It opens nothing while you are alive.",
  },
  reprintNotice: {
    ar: "هذه ورقة جديدة. حين تؤكد أنها معك تتوقف الورقة السابقة عن العمل.",
    en: "This is a new sheet. Once you confirm you have it, the previous one stops working.",
  },
  locked: {
    ar: "افتح خزنتك أولاً — تُصنع الورقة بمفتاحها.",
    en: "Unlock your vault first — the sheet is made with its key.",
  },
  unlock: { ar: "افتح الخزنة", en: "Unlock the vault" },

  // Arabic in both locales, like the recovery sheet: it is filed in
  // Arabic-speaking jurisdictions whatever language the app runs in.
  brandName: { ar: "وصيّة", en: "وصيّة" },
  documentTitle: { ar: "ورقة الوصي", en: "ورقة الوصي" },
  documentSubtitle: { ar: "WASSIYA EXECUTOR SHEET", en: "WASSIYA EXECUTOR SHEET" },
  codeLabel: { ar: "رمز الوصي", en: "Executor code" },
  owner: { ar: "صاحب الخزنة", en: "Owner" },
  executor: { ar: "الوصي", en: "Executor" },
  account: { ar: "حساب صاحب الخزنة", en: "Owner's Wassiya account" },
  issued: { ar: "تاريخ الإصدار", en: "Issued" },
  version: { ar: "الإصدار", en: "Version" },
  shownOnce: {
    ar: "تُعرض مرة واحدة فقط. لا نستطيع إظهارها مرة أخرى — ولا نحتفظ بنسخة.",
    en: "Shown once. We cannot show it again — and we keep no copy.",
  },
  handling: {
    ar: "من يحملها ويثبت هويته يستلم ما سلّمته بعد وفاتك. لا تصوّرها.",
    en: "Whoever holds it and proves who they are receives what you hand over after your death. Do not photograph it.",
  },
  howTitle: { ar: "متى تُستخدم، وكيف", en: "When it is used, and how" },
  howWhen: {
    ar: "بعد وفاة صاحب الخزنة فقط، ولا تفتح شيئاً قبل ذلك. وصيّة لا تملك أي مفتاح: هذه الورقة، أو وثيقة استرداد صاحبها، هي الطريق الوحيد.",
    en: "Only after the owner's death, and it opens nothing before. Wassiya holds no key: this sheet, or the owner's recovery sheet, is the only way.",
  },
  howStep1: {
    ar: "يُبلَّغ عن الوفاة على wassiya.app مع شهادة الوفاة — أي شخص يستطيع ذلك.",
    en: "Report the death at wassiya.app with the death certificate — anyone can.",
  },
  howStep2: {
    ar: "بعد التحقق ومرور ٣٠ يوماً، نتواصل مع الوصي على رقمه المسجّل برابط.",
    en: "Once it is verified and 30 days have passed, we send the executor a link on their registered number.",
  },
  howStep3: {
    ar: "يثبت الوصي هويته، ثم يكتب هذا الرمز كما هو — حروف لاتينية، والشرطات ليست جزءاً منه.",
    en: "The executor proves their identity, then types this code exactly — Latin letters; the dashes are not part of it.",
  },
  qrCaption: { ar: "", en: "" },
  sheetFooter: {
    ar: "ورقة واحدة من صفحة واحدة · لا تحتوي على معرّف الحساب",
    en: "One document, one page · it does not contain the account identifier",
  },
  keepWithWill: {
    ar: "احفظها مع الوصيّة الموثّقة، أو سلّمها للوصي يداً بيد.",
    en: "Keep it with the notarised will, or hand it to the executor in person.",
  },

  print: { ar: "طباعة", en: "Print" },
  saveOrShare: { ar: "حفظ أو مشاركة PDF", en: "Save or share the PDF" },
  preparing: { ar: "جارٍ تجهيز الورقة…", en: "Preparing the sheet…" },
  cancelled: {
    ar: "لم تُطبع الورقة. ما زالت على الشاشة — حاول مجدداً.",
    en: "The sheet was not printed. It is still on screen — try again.",
  },
  failed: {
    ar: "تعذّر تجهيز الورقة. حاول مجدداً.",
    en: "Could not prepare the sheet. Try again.",
  },
  screenshotBlocked: {
    ar: "لقطات الشاشة ممنوعة هنا. اطبع الورقة أو احفظها PDF.",
    en: "Screenshots are blocked here. Print the sheet or save it as a PDF.",
  },
  confirmHint: {
    ar: "تأكّد أن الورقة خرجت كاملة — لن يُعرض الرمز مرة أخرى.",
    en: "Check the sheet came out whole — the code will not be shown again.",
  },
  confirmHave: { ar: "الورقة معي", en: "I have the sheet" },
  printAgain: { ar: "اطبع مرة أخرى", en: "Print again" },
  // Printed but not stored: the paper opens nothing. Said plainly, with the
  // one action that fixes it, while the code is still in memory.
  activateFailed: {
    ar: "لم تُحفظ الورقة بعد، فهي لا تفتح شيئاً. لا تغادر — حاول مرة أخرى.",
    en: "The sheet is not saved yet, so it opens nothing. Don't leave — try again.",
  },
} satisfies LabelSet<string>

/** The asset screen's handover choice — يُسلَّم / خاص. */
export const HANDOVER = {
  label: { ar: "بعد وفاتك", en: "After your death" },
  question: { ar: "بعد وفاتك، ماذا يحدث له؟", en: "After your death, what happens to it?" },
  hint: {
    ar: "تستطيع تغيير هذا لاحقاً من صفحته.",
    en: "You can change this later from its page.",
  },
  noExecutorCreate: {
    ar: "لم تسمِّ وصيّاً بعد — يصله حين تضيفه.",
    en: "No executor yet — it reaches them once you add one.",
  },
  handedOver: { ar: "يُسلَّم للوصي", en: "Handed over" },
  private: { ar: "خاص", en: "Private" },
  noExecutor: {
    ar: "لم تسمِّ وصيّاً بعد — لن يصل إلى أحد.",
    en: "No executor yet — it reaches nobody.",
  },
  addExecutor: { ar: "أضف وصياً", en: "Add an executor" },
  handedOverBody: { ar: "يستلمه أوصياؤك بعد وفاتك.", en: "Your executors receive it after your death." },
  privateBody: {
    ar: "لا يفتحه أحد بعدك.",
    en: "Nobody opens it after you.",
  },
  changeFailed: {
    ar: "تعذّر التغيير. لم يتغيّر شيء.",
    en: "Could not change it. Nothing changed.",
  },
} satisfies LabelSet<string>
