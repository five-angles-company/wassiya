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
  emptySubtitle: { ar: "لا أحد بعد", en: "Nobody yet" },
  emptyLead: {
    ar: "الوصي يستلم كل ما تسلّمه بعد رحيلك، وينفّذ وصيّتك. اختر شخصاً تثق به.",
    en: "Your executor receives everything you hand over after you are gone, and carries out your will. Choose someone you trust.",
  },
  howItWorks: {
    ar: "كل وصيّ يستلم كل ما اخترت تسليمه، وحده. لا نخبره بشيء قبل الإفراج — أعطه ورقته بنفسك، أو احفظها مع وصيّتك.",
    en: "Each executor receives everything you chose to hand over, on their own. We tell them nothing before release — give them their sheet yourself, or keep it with your will.",
  },
  // Wassiya holds no key. This is the price of that, stated where the owner
  // decides how many executors and sheets to keep.
  lossNotice: {
    ar: "إن ضاعت كل أوراق الأوصياء ووثيقة استردادك، لا يستطيع أحد فتح ما تركته — ولا نحن.",
    en: "If every executor sheet and your recovery sheet are lost, nobody can open what you left — not even us.",
  },
} satisfies LabelSet<string>

/** ٥.٢ — adding one. The edit screen borrows these labels wholesale. */
export const EXECUTOR_NEW = {
  title: { ar: "إضافة وصيّ", en: "Add an executor" },
  nameLabel: { ar: "الاسم الكامل كما في الهوية", en: "Full name, as on their ID" },
  namePlaceholder: { ar: "سارة عبدالله المنصوري", en: "Sarah Abdullah Al-Mansouri" },

  phoneLabel: { ar: "رقم الجوال", en: "Mobile number" },
  phonePlaceholder: { ar: "55 118 2210", en: "55 118 2210" },
  // Validated hard: this is the channel the release chain uses, and a wrong
  // digit is discovered when nobody can ask the owner to fix it.
  phoneInvalid: {
    ar: "رقم غير صالح لهذه الدولة. راجعه — هذا هو الرقم الذي سنتواصل به بعد التحقق من الوفاة.",
    en: "Not a valid number for that country. Check it — this is how we reach them once a death is verified.",
  },
  phoneDuplicate: {
    ar: "لديك وصيّ بهذا الرقم بالفعل.",
    en: "You already have an executor with this number.",
  },

  emailLabel: { ar: "البريد الإلكتروني (اختياري)", en: "Email (optional)" },
  emailPlaceholder: { ar: "sara@example.com", en: "sara@example.com" },
  emailHint: {
    ar: "نراسله عليه أيضاً عند التسليم. قناتان أضمن من واحدة — الأرقام تُعاد تدويرها.",
    en: "We write here too at delivery. Two channels beat one — numbers get recycled.",
  },
  emailInvalid: { ar: "بريد غير صالح.", en: "That is not an email address." },

  idNumberLabel: { ar: "رقم الهوية الوطنية أو الإقامة", en: "National ID or residency number" },
  idNumberPlaceholder: { ar: "1023456789", en: "1023456789" },
  idNumberHint: {
    ar: "مطلوب: نطابقه بهوية الوصي الموثّقة قبل أن يُفتح له شيء. لا نحفظ الرقم نفسه.",
    en: "Required: we match it to the executor's verified ID before anything opens. We never store the number itself.",
  },
  idNumberRegistered: {
    ar: "مسجّل — اكتب رقماً جديداً لاستبداله",
    en: "Registered — type a new number to replace it",
  },
  idNumberInvalid: { ar: "الرقم قصير جداً.", en: "That number is too short." },

  silentNotice: {
    ar: "لن نخبر وصيّك بشيء قبل الإفراج — لا إشعار ولا دعوة. أخبره بنفسك، وأعطه ورقته أو احفظها مع وصيّتك.",
    en: "We tell your executor nothing before release — no notice, no invitation. Tell them yourself, and give them their sheet or keep it with your will.",
  },

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
    ar: "أعطها لـ{name} أو احفظها مع وصيّتك. بعد رحيلك يفتح بها ما سلّمته — ولا تفتح شيئاً ما دمت حيّاً.",
    en: "Give it to {name} or keep it with your will. After you are gone it opens what you handed over — and nothing while you are alive.",
  },
  reprintNotice: {
    ar: "هذه ورقة جديدة. بمجرد أن تطبعها تتوقف الورقة السابقة عن العمل.",
    en: "This is a new sheet. Once you print it, the previous one stops working.",
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
  owner: { ar: "صاحب الوصيّة", en: "Owner" },
  executor: { ar: "الوصي", en: "Executor" },
  account: { ar: "حساب صاحب الوصيّة", en: "Owner's Wassiya account" },
  issued: { ar: "تاريخ الإصدار", en: "Issued" },
  version: { ar: "الإصدار", en: "Version" },
  shownOnce: {
    ar: "تُعرض مرة واحدة فقط. لا نستطيع إظهارها مرة أخرى — ولا نحتفظ بنسخة.",
    en: "Shown once. We cannot show it again — and we keep no copy.",
  },
  handling: {
    ar: "من يحمل هذه الورقة ويثبت هويته يستلم ما سُلّم بعد الوفاة. احفظها كما تحفظ الوصيّة، ولا تُصوَّر.",
    en: "Whoever holds this sheet and proves their identity receives what was handed over after the death. Keep it as you keep the will, and do not photograph it.",
  },
  howTitle: { ar: "متى تُستخدم، وكيف", en: "When it is used, and how" },
  howWhen: {
    ar: "بعد وفاة صاحب الوصيّة فقط، ولا تفتح شيئاً قبل ذلك. وصيّة لا تملك أي مفتاح: هذه الورقة، أو وثيقة استرداد صاحبها، هي الطريق الوحيد.",
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
  savePdf: { ar: "حفظ PDF", en: "Save PDF" },
  share: { ar: "مشاركة للطابعة", en: "Send to printer" },
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
  // Printed but not stored: the paper opens nothing. Said plainly, with the
  // one action that fixes it, while the code is still in memory.
  activateFailed: {
    ar: "طُبعت الورقة لكن لم نتمكن من تفعيلها، فهي لا تعمل بعد. لا تغادر هذه الشاشة — فعّلها الآن.",
    en: "The sheet printed but could not be activated, so it does not work yet. Do not leave this screen — activate it now.",
  },
  activate: { ar: "فعّل الورقة", en: "Activate the sheet" },
} satisfies LabelSet<string>

/** The asset screen's handover choice — يُسلَّم / خاص. */
export const HANDOVER = {
  label: { ar: "بعد رحيلك", en: "After you are gone" },
  handedOver: { ar: "يُسلَّم للوصي", en: "Handed over" },
  private: { ar: "خاص", en: "Private" },
  handedOverBody: {
    ar: "يستلمه أوصياؤك كاملاً مع كل ما سلّمته.",
    en: "Your executors receive it whole, with everything else you hand over.",
  },
  noExecutor: {
    ar: "لم تسمِّ وصياً بعد — لن يصل إلى أحد حتى تضيف وصياً.",
    en: "You have not named an executor — it reaches nobody until you add one.",
  },
  addExecutor: { ar: "أضف وصياً", en: "Add an executor" },
  privateBody: {
    ar: "لا يفتحه أحد بعدك — يُحذف مع خزنتك.",
    en: "Nobody opens it after you — it is deleted with your vault.",
  },
  changeFailed: {
    ar: "تعذّر التغيير. لم يتغيّر شيء.",
    en: "Could not change it. Nothing changed.",
  },
} satisfies LabelSet<string>
