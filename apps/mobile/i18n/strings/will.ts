/**
 * ٥ — الوصيّة والورثة.
 *
 * One rule governs the copy on every screen in this section, and the board
 * states it twice: **الأنصبة يحدّدها القانون، لا التطبيق**. There are no
 * percentages, no shares and no division anywhere in these strings. An asset
 * goes to a recipient whole, and how its value is later divided is the
 * fara'id's business, not the app's.
 *
 * That is not only a legal position — a seed phrase cannot be divided at all.
 * Whoever receives it receives all of it.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٥.١ — the heirs list. */
export const HEIRS = {
  // The guardian sits on this tab because a guardian is a person you name in
  // your plan — an heir *receives*, a guardian *verifies*. It previously lived
  // under Account > Security, which is how "who is in my plan" ended up
  // answered in two different tabs.
  guardianLabel: { ar: "الوصي", en: "Guardian" },
  guardianRow: { ar: "من يؤكّد وفاتك", en: "Who confirms your death" },
  guardianOn: { ar: "مفعّل", en: "Active" },
  guardianOff: { ar: "غير مفعّل", en: "Not set" },
  // The tab is خطتي and the screen holds more than heirs — the guardian sits
  // here too — so the title names the plan rather than one list inside it.
  title: { ar: "خطتي", en: "My plan" },
  countZero: { ar: "لا ورثة بعد", en: "No heirs yet" },
  countOne: { ar: "وارث واحد", en: "1 heir" },
  countTwo: { ar: "وارثان", en: "2 heirs" },
  countFew: { ar: "{n} ورثة", en: "{n} heirs" },
  countMany: { ar: "{n} وارثاً", en: "{n} heirs" },

  // The distribution strip: how much of the vault actually reaches someone.
  coverage: {
    ar: "{routed} من {total} أصلاً لها مستلم",
    en: "{routed} of {total} assets have a recipient",
  },
  coverageLabel: { ar: "التوزيع", en: "Coverage" },
  unroutedWarning: {
    ar: "{n} أصلاً بلا مستلم — منها {example}",
    en: "{n} assets have no recipient — including {example}",
  },
  // The same warning without naming an asset. Titles are ciphertext, so a
  // locked vault can still say *how many* are unrouted — it just cannot say
  // which. Counting is what makes the gap actionable; the name is a courtesy.
  unroutedWarningLocked: {
    ar: "{n} أصلاً بلا مستلم",
    en: "{n} assets have no recipient",
  },
  allRouted: {
    ar: "كل أصولك لها مستلم",
    en: "Every asset has a recipient",
  },

  // Three statuses only, per the board. Silent is neutral by design — it is a
  // deliberate choice, not a pending action.
  statusSilent: { ar: "صامتة", en: "Silent" },
  statusAccepted: { ar: "قبلت الدعوة", en: "Accepted" },
  statusPending: { ar: "معلّقة", en: "Pending" },
  statusDeclined: { ar: "رفضت الدعوة", en: "Declined" },

  receives: { ar: "تستلم {n} أصلاً", en: "Receives {n} assets" },
  receivesNothing: {
    ar: "لا تستلم شيئاً بعد — وجّه لها أصلاً",
    en: "Receives nothing yet — route an asset to them",
  },
  withMessage: { ar: "رسالة مرفقة", en: "Message attached" },

  add: { ar: "أضف وارثاً", en: "Add an heir" },
  emptyTitle: { ar: "لم تضف ورثة بعد", en: "No heirs yet" },
  emptyBody: {
    ar: "الوارث هو من يستلم ما تركته. أضف واحداً لتبدأ توجيه أصولك.",
    en: "An heir is who receives what you leave. Add one to start routing your assets.",
  },
  routingLink: { ar: "من يستلم ماذا؟", en: "Who receives what?" },
} satisfies LabelSet<string>

/** ٥.٢ — adding one. */
export const HEIR_NEW = {
  title: { ar: "إضافة وارث", en: "Add an heir" },
  nameLabel: { ar: "الاسم الكامل", en: "Full name" },
  namePlaceholder: { ar: "سارة عبدالله المنصوري", en: "Sarah Abdullah Al-Mansouri" },

  relationLabel: { ar: "صلة القرابة", en: "Relationship" },
  // Required, and an enum rather than free text: it is recorded on the will
  // document and suggests routing. The note under it is the board's own, and
  // it exists to close the door on the question the field invites.
  relationNote: {
    ar: "تُسجَّل في الوثيقة وتقترح التوجيه — ولا تُحسب بها أنصبة.",
    en: "Recorded on the will and used to suggest routing — never to calculate a share.",
  },
  relDaughter: { ar: "بنت", en: "Daughter" },
  relSon: { ar: "ابن", en: "Son" },
  relHusband: { ar: "زوج", en: "Husband" },
  relWife: { ar: "زوجة", en: "Wife" },
  relFather: { ar: "أب", en: "Father" },
  relMother: { ar: "أم", en: "Mother" },
  relSibling: { ar: "أخ", en: "Sibling" },
  relOther: { ar: "أخرى", en: "Other" },

  phoneLabel: { ar: "رقم الجوال", en: "Mobile number" },
  phonePlaceholder: { ar: "55 118 2210", en: "55 118 2210" },
  // Validated hard because this is the channel the release chain uses. A wrong
  // digit here is discovered at the worst possible moment.
  phoneInvalid: {
    ar: "رقم غير صالح لهذه الدولة. راجعه — هذا هو الرقم الذي سنتواصل به عند الإفراج.",
    en: "Not a valid number for that country. Check it — this is how we reach them at release.",
  },
  phoneDuplicate: {
    ar: "لديك وارث بهذا الرقم بالفعل.",
    en: "You already have an heir with this number.",
  },

  modeLabel: { ar: "هل تخبره الآن؟", en: "Tell them now?" },
  modeSilent: { ar: "وارث صامت", en: "Silent heir" },
  modeSilentNote: {
    ar: "لا يعرف شيئاً الآن. يُبلَّغ فقط بعد التحقق من الوفاة.",
    en: "Knows nothing for now. Told only after death is verified.",
  },
  modeNotified: { ar: "وارث مُبلَّغ", en: "Notified heir" },
  modeNotifiedNote: {
    ar: "تصله دعوة الآن — يعرف أنه وارث، دون رؤية أي محتوى.",
    en: "Gets an invite now — knows they are named, without seeing any content.",
  },

  submit: { ar: "أضف الوارث", en: "Add heir" },
  saving: { ar: "جارٍ الإضافة…", en: "Adding…" },
  failed: { ar: "تعذّرت الإضافة. حاول مرة أخرى.", en: "Could not add. Try again." },
} satisfies LabelSet<string>

/** ٥.٣ and ٥.٣b — routing. */
export const ROUTING = {
  title: { ar: "من يستلم ماذا؟", en: "Who receives what?" },
  // The manifesto, verbatim from the board. It is the reason this screen
  // replaces a share calculator rather than containing one.
  manifesto: {
    ar: "الأنصبة يحدّدها القانون، لا التطبيق. وصيّة توصّل الوصول فقط — وتقسيم القيمة يبقى للورثة وفق الفرائض الشرعية.",
    en: "Shares are set by law, not by an app. Wassiya delivers access only — dividing value stays with the heirs under the fara'id.",
  },

  defaultRuleTitle: { ar: "القاعدة الافتراضية مفعّلة", en: "Default rule is on" },
  defaultRuleBody: {
    ar: "{n} أصلاً غير موجّهة تذهب إلى جميع الورثة مجتمعين.",
    en: "{n} unrouted assets go to all heirs jointly.",
  },
  defaultRuleNone: {
    ar: "كل أصل له مستلم محدّد.",
    en: "Every asset has an explicit recipient.",
  },
  edit: { ar: "تعديل", en: "Edit" },
  allHeirs: { ar: "كل الورثة", en: "All heirs" },
  executor: { ar: "الوصي", en: "Executor" },

  noHeirs: {
    ar: "أضف وارثاً أولاً — لا يمكن توجيه أصل إلى لا أحد.",
    en: "Add an heir first — an asset cannot be routed to nobody.",
  },

  // ٥.٣b
  recipientsTitle: { ar: "من يستلم الوصول؟", en: "Who receives access?" },
  executorNote: {
    ar: "يستلم التعليمات فقط، دون المفاتيح",
    en: "Receives the instructions only, without the keys",
  },
  wholeAssetNote: {
    ar: "كل مستلم يحصل على الأصل كاملاً — لا يمكن تجزئة عبارة سرّية أو مستند. تقسيم القيمة بينهم يتم بعد التسليم وفق الفرائض الشرعية.",
    en: "Every recipient gets the whole asset — a phrase or a document cannot be split. Dividing value happens after delivery, under the fara'id.",
  },
  saveRecipients: { ar: "حفظ المستلمين", en: "Save recipients" },
  savePlan: { ar: "حفظ خطة التسليم", en: "Save the delivery plan" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },
  saveFailed: { ar: "تعذّر الحفظ. لم يتغيّر شيء.", en: "Could not save. Nothing changed." },

  // Routing is recorded, but the key envelopes that make it deliverable need a
  // guardian — section ٦. Said plainly rather than implied, because "saved"
  // must not be mistaken for "will be delivered".
  pendingBundles: {
    ar: "التوجيه محفوظ. تجهيز مفاتيح التسليم يحتاج وصياً، ويصل مع شاشة الحماية.",
    en: "Routing is saved. Preparing the delivery keys needs a guardian, and arrives with the protection screen.",
  },
} satisfies LabelSet<string>

/** ٥.٤ — the heir preview. */
export const HEIR_PREVIEW = {
  title: { ar: "معاينة الوارث", en: "Preview as heir" },
  // The board's own framing: this is a promise about the ceiling, not a teaser.
  disclaimer: {
    ar: "هذا كل ما سيراه {name} بعد الإفراج — لا أكثر.",
    en: "This is everything {name} will see after release — nothing more.",
  },
  heading: { ar: "ما تركته لـ{name}", en: "What you left {name}" },
  empty: {
    ar: "لا يستلم {name} شيئاً بعد. وجّه له أصلاً من شاشة التوجيه.",
    en: "{name} receives nothing yet. Route an asset to them from the routing screen.",
  },
  viaAllHeirs: { ar: "عبر «كل الورثة»", en: "via “all heirs”" },
  whole: { ar: "كاملة", en: "Whole" },
  messageAttached: { ar: "رسالة مرفقة", en: "Message attached" },
} satisfies LabelSet<string>
