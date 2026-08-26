/**
 * ٥ — الورثة ومن يستلم ماذا.
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
  // The tab is الورثة now, and the screen holds exactly that: the people, and
  // nothing about which asset goes where. The coverage strip, the unrouted
  // warning and the routing CTA moved out at the owner's direction — routing is
  // asset division, and it stays reachable from Home's التوجيه tile and the
  // vault's own alert. The guardian left for the same reason: a guardian
  // *verifies*, it does not inherit, and Home already carries a الوصي tile.
  title: { ar: "الورثة", en: "Heirs" },
  countZero: { ar: "لا ورثة بعد", en: "No heirs yet" },
  countOne: { ar: "وارث واحد", en: "1 heir" },
  countTwo: { ar: "وارثان", en: "2 heirs" },
  countFew: { ar: "{n} ورثة", en: "{n} heirs" },
  countMany: { ar: "{n} وارثاً", en: "{n} heirs" },

  receives: { ar: "تستلم {n} أصلاً", en: "Receives {n} assets" },
  // Still here, and still terracotta. This is not asset division — it is the
  // one fact about an *heir* that can be silently wrong, and it is the mirror
  // of "بلا مستلم" on an asset.
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
  // What the silent/notified picker used to say, minus the choice. Every heir
  // is silent, so this states the consequence at the moment someone is deciding
  // to name a person.
  silentNotice: {
    ar: "لن يعرف وارثك شيئاً حتى الإفراج — لا إشعار ولا دعوة، ولا يرى أي محتوى.",
    en: "Your heir learns nothing until release — no notice, no invitation, and no content.",
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

  submit: { ar: "أضف الوارث", en: "Add heir" },
  saving: { ar: "جارٍ الإضافة…", en: "Adding…" },
  failed: { ar: "تعذّرت الإضافة. حاول مرة أخرى.", en: "Could not add. Try again." },
} satisfies LabelSet<string>

/**
 * ٥.٣b — choosing an asset's recipients.
 *
 * Was `ROUTING`, and carried an overview screen's copy too: a title ("من يستلم
 * ماذا؟"), a default-rule card, and the board's manifesto. That screen is gone —
 * it was ٤.١ grouped and filtered, and ٤.١ now groups and filters itself — so
 * what is left is exactly the picker's own words.
 *
 * The manifesto went with it and is not missing: `wholeAssetNote` below says
 * the same thing on this very screen, at the moment someone is choosing who
 * gets what, and the legal screen states it again in full.
 */
export const RECIPIENTS = {
  allHeirs: { ar: "كل الورثة", en: "All heirs" },
  executor: { ar: "الوصي", en: "Executor" },

  noHeirs: {
    ar: "أضف وارثاً أولاً — لا يمكن توجيه أصل إلى لا أحد.",
    en: "Add an heir first — an asset cannot be routed to nobody.",
  },

  // ٥.٣b
  // The subtitle slot carries the asset's name when reached from ٤.٩, and the
  // step count when a wizard hands off here. Same slot, so the header never
  // changes height between the two ways in.
  stepTwo: { ar: "الخطوة ٢ من ٢", en: "Step 2 of 2" },
  recipientsSubtitle: { ar: "اختر من يستلم هذا الأصل", en: "Choose who receives this asset" },
  allHeirsDetail: { ar: "مجتمعين", en: "Jointly" },
  recipientsTitle: { ar: "من يستلمها؟", en: "Who receives it?" },
  executorNote: {
    ar: "يستلم التعليمات فقط، دون المفاتيح",
    en: "Receives the instructions only, without the keys",
  },
  wholeAssetNote: {
    ar: "كل مستلم يحصل على الأصل كاملاً — لا يمكن تجزئة عبارة سرّية أو مستند. تقسيم القيمة بينهم يتم بعد التسليم وفق الفرائض الشرعية.",
    en: "Every recipient gets the whole asset — a phrase or a document cannot be split. Dividing value happens after delivery, under the fara'id.",
  },
  saveRecipients: { ar: "حفظ المستلمين", en: "Save recipients" },
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
  // The pencil in the header. It edits whichever heir the switcher has
  // selected, so it has to name them — "تعديل" alone would be a lie the moment
  // someone switches to a different heir and does not notice.
  editHeir: { ar: "تعديل {name}", en: "Edit {name}" },
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

/**
 * ٥.٢b — editing one, and deleting one.
 *
 * Deliberately thin: every field label comes from {@link HEIR_NEW}, because the
 * edit form *is* the add form with values in it. Only what is genuinely new to
 * editing lives here — the title, the two links out, and the delete sheet.
 */
export const HEIR_EDIT = {
  title: { ar: "تعديل وارث", en: "Edit heir" },
  /** Deleted from another device while this list was open. */
  notFound: { ar: "لم نعد نجد هذا الوارث.", en: "This heir no longer exists." },
  save: { ar: "حفظ التعديل", en: "Save changes" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },
  failed: {
    ar: "تعذّر حفظ التعديل. حاول مرة أخرى.",
    en: "Could not save. Try again.",
  },

  deleteHeir: { ar: "حذف الوارث", en: "Delete heir" },
  deleteTitle: { ar: "حذف {name}؟", en: "Delete {name}?" },
  /**
   * The consequence, stated before the confirmation.
   *
   * `heirs.remove` cascades: it drops their routing rows and their release
   * bundle. So deleting an heir who receives assets leaves those assets with
   * no recipient — which is the single thing this sheet exists to say out loud.
   */
  deleteRouted: {
    ar: "{name} تستلم {n} أصلاً. بحذفها تصبح هذه الأصول بلا مستلم، وتُلغى حصّتها من مفاتيح الإفراج.",
    en: "{name} receives {n} assets. Deleting them leaves those assets with no recipient and destroys their share of the release keys.",
  },
  deleteNothing: {
    ar: "لا تستلم {name} شيئاً حالياً، فلن يتغيّر توجيه أي أصل.",
    en: "{name} receives nothing right now, so no asset's routing changes.",
  },
  deleteFinal: { ar: "لا يمكن التراجع عن هذا.", en: "This cannot be undone." },
  deletePermanently: { ar: "احذفها نهائياً", en: "Delete permanently" },
  deleting: { ar: "جارٍ الحذف…", en: "Deleting…" },
  keepIt: { ar: "إبقاؤها", en: "Keep them" },
  deleteFailed: {
    ar: "تعذّر الحذف. حاول مرة أخرى.",
    en: "Could not delete. Try again.",
  },
} satisfies LabelSet<string>
