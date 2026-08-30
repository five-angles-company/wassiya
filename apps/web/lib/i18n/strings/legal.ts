import type { Dictionary } from "@/lib/i18n/locale"

/**
 * ٩.٥ — the documents, and the one that is not a document.
 *
 * `/legal/encryption` is linked from the top bar as الأمان rather than buried
 * with terms and privacy, because it is not fine print: it is the claim the
 * whole product rests on, written for someone deciding whether to trust it. The
 * other two are ordinary documents and read like it.
 *
 * The security page states the mechanism plainly and does **not** overstate it.
 * It says what we cannot do, and also what we can — a page that only listed
 * guarantees would be marketing.
 */
export const LEGAL = {
  encryptionMetaTitle: {
    ar: "كيف يعمل التشفير · وصيّة",
    en: "How the encryption works · Wassiya",
  },
  encryptionTitle: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
  encryptionLede: {
    ar: "خزنتك مغلقة علينا نحن أيضاً. هذه الصفحة تشرح كيف، وما الذي لا نستطيع فعله نتيجة لذلك.",
    en: "Your vault is sealed to us as well. This page explains how, and what that stops us from being able to do.",
  },

  keyTitle: { ar: "المفتاح لا يغادر جهازك", en: "The key never leaves your device" },
  keyBody: {
    ar: "يُولَّد مفتاح الخزنة على هاتف صاحبها، ويُحفظ في الشريحة الأمنية للجهاز محميّاً ببصمته. ما يصل إلى خوادمنا هو نصّ مشفّر فقط — لا نملك المفتاح، ولا يمكننا طلبه.",
    en: "The vault's key is generated on the owner's phone and kept in the device's secure hardware behind their fingerprint. What reaches our servers is ciphertext only — we do not hold the key, and we cannot ask for it.",
  },

  assetTitle: { ar: "كل أصل بمفتاحه", en: "Every asset has its own key" },
  assetBody: {
    ar: "لكل عنصر في الخزنة مفتاح خاص به، مغلّف بمفتاح الخزنة. يُشفَّر المحتوى على الجهاز قبل رفعه، فلا يمر بنا في أي لحظة وهو مقروء.",
    en: "Each item in the vault has its own key, wrapped by the vault's key. Content is encrypted on the device before it is uploaded, so it never passes through us in a readable form.",
  },

  halvesTitle: { ar: "صندوق الوارث يحتاج نصفين", en: "An heir's box needs two halves" },
  halvesBody: {
    ar: "عند الإفراج، لا يستلم الوارث مفتاح الخزنة أبداً — بل صندوقاً خاصاً به. مفتاح ذلك الصندوق من نصفين: نصف نحتفظ به ولا نطلقه إلا بعد اكتمال التحقق، ونصف لدى الوصي. لا نستطيع فتح الصندوق وحدنا، ولا يستطيع الوصي.",
    en: "At release an heir never receives the vault's key — they receive a box of their own. That box's key is in two halves: one we hold and release only after verification is complete, and one the guardian holds. We cannot open the box alone, and neither can the guardian.",
  },

  limitsTitle: { ar: "ما لا نستطيع فعله", en: "What we cannot do" },
  limitsBody: {
    ar: "لا نستطيع قراءة محتوى خزنتك، ولا استعادتها إن فُقدت ورقة الاسترداد وكل الأجهزة المسجّلة، ولا فتح صندوق وارث دون نصيب الوصي. هذه ليست سياسات نتّبعها — بل حدود لا يملك التصميم تجاوزها.",
    en: "We cannot read the contents of your vault, recover it if the recovery sheet and every enrolled device are lost, or open an heir's box without the guardian's share. These are not policies we follow — they are limits the design does not let us cross.",
  },

  canTitle: { ar: "وما نستطيع فعله", en: "And what we can" },
  canBody: {
    ar: "نرى ما يكفي لتشغيل الخدمة: البريد والاسم، وعدد الأصول وأحجامها، ومتى تحقّقت من حياتك، ومسار كل طلب وراثة. هذه بيانات وصفية وليست محتوى، ونذكرها هنا لأن صفحة تعدّد الضمانات ولا تذكر حدودها إعلان لا شرح.",
    en: "We see enough to run the service: your email and name, how many assets you hold and how large they are, when you last confirmed you were alive, and the course of any claim. That is metadata, not content — and it is stated here because a page that lists only guarantees is an advertisement rather than an explanation.",
  },

  termsMetaTitle: { ar: "الشروط · وصيّة", en: "Terms · Wassiya" },
  termsTitle: { ar: "شروط الاستخدام", en: "Terms of use" },
  termsLede: {
    ar: "وصيّة خدمة حفظ وتسليم، وليست جهة قانونية.",
    en: "Wassiya is a custody and handover service, not a legal authority.",
  },
  termsNotLegalTitle: { ar: "لا نقسّم التركات", en: "We do not divide estates" },
  termsNotLegalBody: {
    ar: "الأنصبة يحدّدها القانون، لا التطبيق. وصيّة توجّه الأصول إلى أشخاص بعينهم كما حدّدها صاحب الخزنة، وتسليمها لا يمثّل حكماً في الميراث ولا بديلاً عن إجراءاته.",
    en: "Shares are determined by law, not by an app. Wassiya routes assets to named people exactly as the vault's owner specified; handing them over is not a ruling on inheritance and is no substitute for its procedures.",
  },
  termsAvailabilityTitle: { ar: "الاشتراك والتسليم", en: "Subscription and delivery" },
  termsAvailabilityBody: {
    ar: "انقطاع الاشتراك يمنع إضافة أصول جديدة فقط. تبقى الخزنة مقروءة لصاحبها، ويبقى التسليم إلى الورثة عاملاً — لأن الخدمة التي تحتجز إرثاً لعدم سداد رسم ليست خدمة حفظ.",
    en: "A lapsed subscription blocks adding new assets and nothing else. The vault stays readable to its owner and delivery to heirs keeps working — a service that withheld an inheritance over an unpaid fee would not be a custody service.",
  },

  privacyMetaTitle: { ar: "الخصوصية · وصيّة", en: "Privacy · Wassiya" },
  privacyTitle: { ar: "الخصوصية", en: "Privacy" },
  privacyLede: {
    ar: "ما نحفظه، ولماذا، ومن يراه.",
    en: "What we keep, why, and who sees it.",
  },
  privacyKeepTitle: { ar: "ما نحفظه", en: "What we keep" },
  privacyKeepBody: {
    ar: "بريدك واسمك من حساب الدخول، وبيانات وصفية عن خزنتك: عدد الأصول وأحجامها وأنواعها، ومواعيد التحقق من الحياة، وسجل الطلبات. المحتوى نفسه مشفّر ولا نملك مفتاحه.",
    en: "Your email and name from your sign-in account, and metadata about your vault: how many assets, their sizes and types, your check-in dates, and the history of any claim. The content itself is encrypted and we do not hold its key.",
  },
  privacyIdentityTitle: { ar: "التحقق من الهوية", en: "Identity verification" },
  privacyIdentityBody: {
    ar: "صور الهوية تُعالَج لدى مزوّد التحقق وتُستخدم لهذا الغرض وحده. لا تُشارك مع الورثة الآخرين ولا مع الأوصياء، ولا تدخل الخزنة.",
    en: "Identity photographs are processed by our verification provider and used for that purpose alone. They are not shared with other heirs or with guardians, and they never enter the vault.",
  },
  privacyAuditTitle: { ar: "السجل لا يُمحى", en: "The record is not erasable" },
  privacyAuditBody: {
    ar: "كل إجراء حسّاس يُسجَّل في سجل لا يقبل التعديل ولا الحذف — لا من لوحة الإدارة ولا من الخادم. هذا شرط في منتج يسلّم تركات: أثر يمكن محوه ليس أثراً.",
    en: "Every sensitive action is written to a log that cannot be edited or deleted — not from the admin console and not on the server. That is a requirement in a product that hands over estates: a trail that can be erased is not a trail.",
  },
} as const satisfies Dictionary
