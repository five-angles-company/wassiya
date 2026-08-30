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

  eyebrow: {
    ar: "خزنة إرث رقمي",
    en: "A digital-inheritance vault",
  },

  // Two lines because the second one takes the accent colour. At 72px there is
  // room for about fifteen characters a line and none at all for a value
  // proposition — and the board names death plainly rather than around it.
  heroLineOne: { ar: "ما تركه لك،", en: "What they left you" },
  heroLineTwo: { ar: "يصل إليك.", en: "reaches you." },
  heroBody: {
    ar: "إن توفّي شخص ترك لك شيئاً في وصيّة، تبدأ من هنا. وإن كنت وصيّاً على خزنة أحدهم، فلك بابك الخاص.",
    en: "If someone who left you something has died, start here. If you're a guardian for someone's vault, you have your own door.",
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

  ownerTitle: {
    ar: "صاحب خزنة؟ خزنتك على جوّالك",
    en: "Vault owner? Your vault lives on your phone",
  },
  // Saying the browser *cannot* open a vault is the encryption promise doing
  // its own marketing — which is why this dull little row earns its place.
  ownerBody: {
    ar: "لا يمكن فتح الخزنة من المتصفّح، ولا نحفظ مفتاحها على خدمتنا — لذلك لا يوجد هنا ما يخصّك. حمّل التطبيق للمتابعة.",
    en: "A vault can't be opened in a browser and we don't hold its key on our service — so there's nothing for you here. Get the app to continue.",
  },
  ownerAction: { ar: "حمّل التطبيق", en: "Get the app" },

  claimTitle: { ar: "فقدت شخصاً عزيزاً؟", en: "Have you lost someone?" },
  claimBody: {
    ar: "إن كان يحفظ إرثه الرقمي في وصيّة، يمكنك تقديم بلاغ وفاة من هنا. مجاناً، وبدون تطبيق.",
    en: "If they kept their digital legacy in Wassiya, you can file a death report here. Free, and no app to install.",
  },
  claimAction: { ar: "أبلغ عن وفاة", en: "Report a death" },

  guardianTitle: { ar: "أنت وصي؟", en: "Are you a guardian?" },
  guardianBody: {
    ar: "وُثِق بك لتؤكّد الوفاة وتسلّم نصيبك من المفتاح عند الإفراج. اعرف ما سيُطلب منك.",
    en: "Someone trusted you to confirm a death and hand over your half of the key at release. See what you will be asked to do.",
  },
  guardianAction: { ar: "أنا وصيّ", en: "I'm a guardian" },

  sealedTitle: {
    ar: "الخزنة مغلقة علينا نحن أيضاً",
    en: "The vault is sealed to us too",
  },
  sealedMore: { ar: "كيف يعمل التشفير", en: "How the encryption works" },
} as const satisfies Dictionary
