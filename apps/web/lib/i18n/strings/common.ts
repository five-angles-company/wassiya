import type { Dictionary } from "@/lib/i18n/locale"

/** Chrome shared by every screen: the shell, the boundaries, the toggles. */
export const COMMON = {
  brand: { ar: "وصيّة", en: "Wassiya" },

  language: { ar: "اللغة", en: "Language" },
  arabic: { ar: "العربية", en: "العربية" },
  english: { ar: "English", en: "English" },

  // The error boundary. Says what to do, not what went wrong — the reader is
  // usually bereaved and mid-claim, and every case this actually catches is
  // cured by trying again.
  errorTitle: {
    ar: "تعذّر تحميل هذه الصفحة",
    en: "This page did not load",
  },
  errorBody: {
    ar: "انقطع الاتصال بالخادم أو رُفض الطلب. أعد المحاولة — لم يُفقد شيء مما أدخلته سابقاً.",
    en: "The request to the server failed or was refused. Try again — nothing you entered earlier has been lost.",
  },
  errorDigest: { ar: "المرجع", en: "Reference" },
  retry: { ar: "أعد المحاولة", en: "Try again" },

  routeMissingTitle: { ar: "لا توجد صفحة هنا", en: "No page here" },
  routeMissingBody: {
    ar: "هذا العنوان لا يقابل أي صفحة. إن كنت تتابع طلباً، افتح الرابط الذي أرسلناه إلى بريدك.",
    en: "This address does not match any page. If you are following a claim, open the link we emailed you.",
  },
  backHome: { ar: "العودة إلى البداية", en: "Back to the start" },
} as const satisfies Dictionary

/**
 * The root page at `/`.
 *
 * Reached two ways, and it has to answer both: a living owner tapping "this is
 * my account" out of the funnel's header, and anyone who typed the bare domain.
 * The first needs telling that there is nothing for them here — the vault is
 * mobile-only, deliberately, because MK and the biometric gate need a hardware
 * keystore.
 */
export const HOME = {
  metaTitle: { ar: "وصيّة", en: "Wassiya" },
  metaDescription: {
    ar: "خزنة رقمية للإرث. الخزنة نفسها تعيش على هاتفك.",
    en: "A digital inheritance vault. The vault itself lives on your phone.",
  },

  title: { ar: "وصيّة", en: "Wassiya" },

  // The hero. Short, concrete, and about the reader rather than the product —
  // at 72px there is room for about fifteen characters and no room at all for
  // a value proposition.
  heroTitle: {
    ar: "ما تركه لك، يصل إليك.",
    en: "What they left you reaches you.",
  },
  heroBody: {
    ar: "إن فقدت شخصاً عزيزاً كان يحفظ إرثه الرقمي في وصيّة، ابدأ من هنا. مجاناً، وبدون تطبيق.",
    en: "If you have lost someone who kept their digital legacy in Wassiya, start here. Free, and no app to install.",
  },

  // The three facts the olive band carries. Each is a claim someone deciding
  // whether to trust us would want checked.
  factKeyValue: { ar: "لا يغادر الجهاز", en: "Never leaves the device" },
  factKeyLabel: {
    ar: "مفتاح الخزنة يُولَّد على هاتف صاحبها ويبقى فيه.",
    en: "The vault's key is generated on its owner's phone and stays there.",
  },
  factHoldValue: { ar: "نصّ مشفّر فقط", en: "Ciphertext only" },
  factHoldLabel: {
    ar: "ما يصل إلى خوادمنا مشفّر، ولا نملك ما يفتحه.",
    en: "What reaches our servers is encrypted, and we do not hold what opens it.",
  },
  factHalvesValue: { ar: "نصفان، لا نصف", en: "Two halves, not one" },
  factHalvesLabel: {
    ar: "صندوق الوارث يحتاج نصيبنا ونصيب الوصي معاً.",
    en: "An heir's box needs our half and the guardian's together.",
  },

  ownerTitle: { ar: "خزنتك على هاتفك", en: "Your vault is on your phone" },
  ownerBody: {
    ar: "لا يمكن فتح الخزنة من المتصفح، وهذا مقصود: مفتاحها محفوظ في الشريحة الأمنية لهاتفك ومحميّ ببصمتك. حمّل التطبيق وسجّل الدخول من هناك.",
    en: "The vault cannot be opened from a browser, and that is deliberate: its key is held in your phone's secure hardware and gated by your fingerprint. Install the app and sign in there.",
  },

  claimTitle: { ar: "فقدت شخصاً عزيزاً؟", en: "Have you lost someone?" },
  claimBody: {
    ar: "إن كان يحفظ إرثه الرقمي في وصيّة، يمكنك تقديم بلاغ وفاة من هنا. مجاناً، وبدون تطبيق.",
    en: "If they kept their digital legacy in Wassiya, you can file a death report here. Free, and no app to install.",
  },
  claimAction: { ar: "تقديم بلاغ وفاة", en: "File a death report" },

  guardianTitle: { ar: "أنت وصي؟", en: "Are you a guardian?" },
  guardianBody: {
    ar: "وُثِق بك لتؤكّد الوفاة وتسلّم نصيبك من المفتاح عند الإفراج. اعرف ما سيُطلب منك.",
    en: "Someone trusted you to confirm a death and hand over your half of the key at release. See what you will be asked to do.",
  },
  guardianAction: { ar: "ما دور الوصي؟", en: "What a guardian does" },

  sealedTitle: {
    ar: "الخزنة مغلقة علينا نحن أيضاً",
    en: "The vault is sealed to us too",
  },
  sealedMore: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
} as const satisfies Dictionary
