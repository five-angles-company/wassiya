import type { Dictionary } from "@/i18n/locale"

/**
 * The home page, written for someone who has never thought about encryption:
 * everyday words, short sentences, no technical terms. "Locked" rather than
 * "encrypted", "a waiting period" rather than "veto window".
 *
 * Three rules this file must keep (AGENTS.md):
 *   - **The escrow trade is stated, never hidden.** "Not even us" is true while
 *     the owner lives. What is set aside for heirs Wassiya *can* open, after the
 *     death and the heir are confirmed, and `securityEscrowBody` and the first
 *     FAQ say so in plain words.
 *   - **No number is written here.** Plan limits arrive from `plans.published`
 *     at build time, and there is never a price — the fallbacks included.
 *   - **No "am I an heir?" path.** Every heir is silent; the heir door explains
 *     the message they may receive and nothing more.
 */
export const HOME = {
  metaTitle: {
    ar: "وصيّة — احفظ ما يهمّك لمن تحب",
    en: "Wassiya — keep what matters for the people you love",
  },
  metaDescription: {
    ar: "احفظ حساباتك ومستنداتك ورسائلك في خزنة آمنة على جوّالك. لا يراها أحد غيرك، وبعد رحيلك تصل لمن اخترتهم فقط.",
    en: "Keep your accounts, documents and messages in a safe vault on your phone. Nobody else can see them, and after you're gone they reach only the people you chose.",
  },

  heroBadge: { ar: "خزنة آمنة لإرثك الرقمي", en: "A safe vault for your digital legacy" },
  heroTitleLead: { ar: "ما يهمّك، يصل", en: "What matters to you, kept for" },
  heroTitleAccent: { ar: "لمن تحب.", en: "the people you love." },
  heroBody: {
    ar: "احفظ حساباتك ومستنداتك ورسائلك في خزنة على جوّالك. ما دمت حيّاً لا يراها أحد غيرك — ولا نحن. وبعد رحيلك، نسلّم كل شخص ما اخترته له فقط.",
    en: "Keep your accounts, documents and messages in a vault on your phone. While you're alive, nobody else can see them — not even us. After you're gone, we give each person only what you chose for them.",
  },
  heroHow: { ar: "كيف تعمل", en: "See how it works" },
  heroTrustDevice: { ar: "لا يراها أحد غيرك", en: "Only you can see it" },
  heroTrustPasswords: { ar: "بلا كلمات مرور", en: "No passwords" },
  heroTrustFree: { ar: "مجاني للبدء", en: "Free to start" },

  floatLockTitle: { ar: "لا يفتحها أحد", en: "Nobody opens it" },
  floatLockMeta: { ar: "ما دمت حيّاً — ولا نحن", en: "While you're alive — not even us" },
  floatHeirsTitle: { ar: "ثلاثة ورثة", en: "Three heirs" },
  floatHeirsMeta: { ar: "لا يعلمون شيئاً قبل وقته", en: "They learn nothing until it's time" },

  proofDeviceTitle: { ar: "خاصة بك وحدك", en: "Private to you" },
  proofDeviceBody: { ar: "حتى نحن لا نرى ما تحفظه", en: "Not even we can see what you keep" },
  proofFingerprintTitle: { ar: "تُفتح ببصمتك", en: "Opens with your fingerprint" },
  proofFingerprintBody: { ar: "بلا كلمات مرور تنساها", en: "No passwords to forget" },
  proofVaultTitle: { ar: "لمن اخترتهم فقط", en: "Only to the people you chose" },
  proofVaultBody: { ar: "كل شخص يأخذ ما خصّصته له", en: "Each gets what you set aside for them" },
  proofHumanTitle: { ar: "نتأكد قبل كل خطوة", en: "We check before every step" },
  proofHumanBody: { ar: "من الوفاة ومن هوية كل شخص", en: "The death, and each person's identity" },

  stepsEyebrow: { ar: "كيف تعمل", en: "How it works" },
  stepsTitle: { ar: "ثلاث خطوات بسيطة", en: "Three simple steps" },
  step1Title: { ar: "أضف ما يهمّك", en: "Add what matters" },
  step1Body: {
    ar: "حساباتك ومستنداتك وصورك، ورسائل بصوتك لمن تحب.",
    en: "Your accounts, documents, photos, and voice messages for the people you love.",
  },
  step2Title: { ar: "اختر لمن يذهب كل شيء", en: "Choose who gets what" },
  step2Body: {
    ar: "حدّد لكل شخص ما يصله. ولا يعرف أحد منهم شيئاً قبل وقته.",
    en: "Decide what goes to each person. None of them knows anything until it's time.",
  },
  step3Title: { ar: "نسلّمها بعد رحيلك", en: "We hand it over after you" },
  step3Body: {
    ar: "بعد التأكد من الوفاة ومن هوية كل شخص، يصله ما اخترته له فقط.",
    en: "Once we've confirmed the death and each person's identity, they receive only what you chose.",
  },

  securityEyebrow: { ar: "الخصوصية", en: "Privacy" },
  securityTitle: {
    ar: "حتى نحن لا نستطيع رؤية ما تحفظه",
    en: "Not even we can see what you keep",
  },
  securityBody: {
    ar: "كل شيء يُقفل على جوّالك قبل أن يصل إلينا، والمفتاح يبقى معك وحدك.",
    en: "Everything is locked on your phone before it reaches us, and only you hold the key.",
  },
  diagramPhone: { ar: "على جوّالك", en: "On your phone" },
  diagramPhoneNote: {
    ar: "المفتاح الاحتياطي في الدرج الثاني، خلف دفتر العائلة.",
    en: "The spare key is in the second drawer, behind the family book.",
  },
  diagramEncrypt: { ar: "يُقفل هنا", en: "Locked here" },
  diagramServer: { ar: "ما يصلنا نحن", en: "What we receive" },
  securityItemTitle: { ar: "لكل شيء قفله", en: "Everything has its own lock" },
  securityItemBody: {
    ar: "كل ملف وكل سرّ له قفل خاص، ولا يفتحه إلا جوّالك.",
    en: "Every file and every secret has its own lock that only your phone can open.",
  },
  securityPhoneTitle: { ar: "على جوّالك فقط", en: "On your phone only" },
  securityPhoneBody: {
    ar: "لا تُفتح خزنتك من أي موقع أو جهاز آخر، ولا نملك مفتاحها.",
    en: "Your vault can't be opened from a website or another device, and we don't have its key.",
  },
  securityEscrowTitle: {
    ar: "وما تتركه لورثتك محفوظ لهم",
    en: "What you leave your heirs is kept for them",
  },
  securityEscrowBody: {
    ar: "ما خصّصته لكل شخص يبقى مقفلاً حتى نتأكد من الوفاة ومن هويته، وعندها فقط نفتحه لنسلّمه له. وما لم تخصّصه لأحد لا يُفتح أبداً.",
    en: "What you set aside for each person stays locked until we've confirmed the death and who they are. Only then do we open it to hand it over. Anything you didn't set aside for anyone is never opened.",
  },
  securityLink: { ar: "اقرأ كيف نحمي خزنتك", en: "Read how we protect your vault" },

  vaultEyebrow: { ar: "ما تحفظه", en: "What you keep" },
  vaultTitle: { ar: "كل ما يهمّك في مكان واحد", en: "Everything that matters, in one place" },
  vaultBody: {
    ar: "كل ما قد تحتاجه عائلتك يوماً، مرتّب وآمن.",
    en: "Everything your family might one day need, organised and safe.",
  },
  vaultLocked: { ar: "مقفلة", en: "Locked" },
  vaultCryptoLabel: { ar: "العملات الرقمية", en: "Crypto" },
  vaultCryptoValue: {
    ar: "كلمات الاسترداد ومفاتيح المحافظ.",
    en: "Recovery words and wallet keys.",
  },
  vaultBankLabel: { ar: "الحسابات البنكية", en: "Bank accounts" },
  vaultBankValue: {
    ar: "أرقام الحسابات، وما يجب أن تعرفه عائلتك.",
    en: "Account numbers, and what your family needs to know.",
  },
  vaultDocsLabel: { ar: "المستندات والصور", en: "Documents and photos" },
  vaultDocsValue: {
    ar: "الصكوك والعقود والصور العزيزة.",
    en: "Deeds, contracts and precious photos.",
  },
  vaultAccountsLabel: { ar: "الحسابات الإلكترونية", en: "Online accounts" },
  vaultAccountsValue: {
    ar: "كلمات المرور لبريدك وحساباتك.",
    en: "Passwords for your email and accounts.",
  },
  vaultNotesLabel: { ar: "رسائل لمن تحب", en: "Messages to loved ones" },
  vaultNotesValue: {
    ar: "اكتبها أو سجّلها بصوتك، وتصل لصاحبها فقط.",
    en: "Write them or record them in your voice — only the right person receives them.",
  },
  voiceTo: { ar: "إلى ابنتي", en: "To my daughter" },

  keysEyebrow: { ar: "بلا كلمات مرور", en: "No passwords" },
  keysTitle: { ar: "لا شيء تحتاج أن تتذكّره", en: "Nothing to remember" },
  keysBody: {
    ar: "خزنتك تُفتح بطريقتين بسيطتين.",
    en: "Your vault opens in two simple ways.",
  },
  keysPhone: { ar: "جوّالك", en: "Your phone" },
  keysDeviceLabel: { ar: "بصمتك، كل يوم", en: "Your fingerprint, every day" },
  keysDeviceValue: {
    ar: "افتح خزنتك ببصمتك أو وجهك، مثل أي تطبيق.",
    en: "Open your vault with your fingerprint or face, like any app.",
  },
  keysPaperLabel: { ar: "ورقة الاسترداد، عند الحاجة", en: "The recovery sheet, just in case" },
  keysPaperValue: {
    ar: "ورقة مطبوعة تفتح خزنتك إذا ضاع جوّالك. احفظها مع أوراقك المهمة، فمن يملكها يستطيع فتح خزنتك.",
    en: "A printed sheet that opens your vault if you lose your phone. Keep it with your important papers — whoever has it can open your vault.",
  },
  keysNever: {
    ar: "لن نطلب منك هذه الورقة أبداً. من يطلبها منك ليس نحن.",
    en: "We will never ask you for this sheet. Anyone who does is not us.",
  },

  releaseEyebrow: { ar: "بعد رحيلك", en: "After you're gone" },
  releaseTitle: {
    ar: "لا نسلّم شيئاً قبل أن نتأكد",
    en: "Nothing is handed over until we're sure",
  },
  releaseBody: {
    ar: "ورثتك لا يعلمون شيئاً مسبقاً. أول ما يسمعونه منّا رسالتنا إليهم، في وقتها.",
    en: "Your heirs don't know anything in advance. The first they hear from us is our message, when the time comes.",
  },
  gateCertificate: { ar: "شهادة وفاة رسمية", en: "An official death certificate" },
  gateCertificateMeta: { ar: "يرسلها إلينا من يعرفك", en: "Sent to us by someone who knows you" },
  gateReview: { ar: "نراجعها بأنفسنا", en: "We check it ourselves" },
  gateReviewMeta: {
    ar: "ونتأكد أن الاسم فيها هو اسمك",
    en: "And make sure the name on it is yours",
  },
  gateVeto: { ar: "فترة انتظار", en: "A waiting period" },
  gateVetoMeta: {
    ar: "نخبرك، وتستطيع إيقاف كل شيء ببصمتك",
    en: "We tell you, and you can stop everything with your fingerprint",
  },
  gateIdentity: { ar: "نتأكد من هوية الوارث", en: "We confirm who the heir is" },
  gateIdentityMeta: { ar: "ليصل كل شيء لصاحبه", en: "So everything reaches the right person" },
  gateDelivery: { ar: "التسليم", en: "Handed over" },
  gateDeliveryMeta: {
    ar: "يفتحه الوارث على جهازه، خلال سنة",
    en: "The heir opens it on their device, within a year",
  },
  checkinTitle: { ar: "ونطمئن عليك", en: "And we check in on you" },
  checkinBody: {
    ar: "من وقت لآخر نسألك: هل أنت بخير؟ لمسة بإصبعك تكفي للرد. ولا نسلّم شيئاً أبداً دون شهادة وفاة رسمية.",
    en: "Every so often we ask: are you well? One touch of your finger is enough. Nothing is ever handed over without an official death certificate.",
  },
  sharesTitle: { ar: "أنت تختار ما يأخذه كل شخص", en: "You choose what each person gets" },
  sharesBody: {
    ar: "نوصل ما اخترته كما هو، ولا نقسّم الميراث. تقسيم الميراث يحكمه الشرع والقانون.",
    en: "We deliver what you chose, as it is. We don't divide inheritances — that is set by law.",
  },

  plansEyebrow: { ar: "الخطط", en: "Plans" },
  plansTitle: { ar: "ابدأ مجاناً", en: "Start for free" },
  plansBody: {
    ar: "إنشاء الحساب وكل الخطوات الأساسية مجانية. ولا نطلب منك الاشتراك إلا إذا احتجت إلى أكثر.",
    en: "Creating your account and all the basic steps are free. We only ask you to subscribe if you need more.",
  },
  planFree: { ar: "المجانية", en: "Free" },
  planFreeTagline: { ar: "لتبدأ", en: "To get started" },
  planAnnual: { ar: "السنوية", en: "Yearly" },
  planAnnualTagline: { ar: "لكل ما يهمّك", en: "For everything that matters" },
  planFreeFallback: { ar: "مساحة لتبدأ خزنتك.", en: "Room to start your vault." },
  planAnnualFallback: {
    ar: "مساحة أكبر، وورثة أكثر، والصور والملفات الكبيرة.",
    en: "More room, more heirs, plus photos and large files.",
  },
  planStorage: { ar: "المساحة", en: "Storage" },
  planAssets: { ar: "العناصر", en: "Items" },
  planHeirs: { ar: "الورثة", en: "Heirs" },
  planPhotos: { ar: "الصور", en: "Photos" },
  planFileSize: { ar: "أكبر ملف", en: "Largest file" },
  planUnlimited: { ar: "بلا حدود", en: "Unlimited" },
  planIncluded: { ar: "متاحة", en: "Included" },
  planNotIncluded: { ar: "غير متاحة", en: "Not included" },
  unitMb: { ar: "م.ب", en: "MB" },
  unitGb: { ar: "غ.ب", en: "GB" },
  plansPrice: {
    ar: "ترى السعر في متجر التطبيقات.",
    en: "You'll see the price in your app store.",
  },
  plansLapse: {
    ar: "إذا توقف اشتراكك تبقى خزنتك كما هي، ويصل ما تركته لورثتك. فقط لن تستطيع إضافة الجديد.",
    en: "If your subscription stops, your vault stays as it is and your heirs still receive what you left them. You just can't add anything new.",
  },

  doorsEyebrow: { ar: "للعائلات", en: "For families" },
  doorsTitle: { ar: "هل أنت هنا من أجل شخص آخر؟", en: "Here because of someone else?" },
  doorClaimTitle: { ar: "فقدت شخصاً عزيزاً", en: "I've lost someone" },
  doorClaimBody: {
    ar: "إن كان يستخدم وصيّة، ابدأ بالإبلاغ عن وفاته. لن تحصل على شيء بتقديم البلاغ — نحن نتواصل مع ورثته مباشرة.",
    en: "If they used Wassiya, start by reporting their death. Reporting doesn't give you anything — we contact their heirs directly.",
  },
  doorClaimAction: { ar: "أبلغ عن وفاة", en: "Report a death" },
  doorClaimMeta: {
    ar: "نحو عشر دقائق، ويمكنك الإكمال لاحقاً",
    en: "About ten minutes, and you can finish later",
  },
  doorHeirTitle: { ar: "وصلتني رسالة من وصيّة", en: "I got a message from Wassiya" },
  doorHeirBody: {
    ar: "يعني ذلك أن شخصاً ترك لك شيئاً. افتح الرابط الموجود في الرسالة، ثم نتأكد من هويتك قبل أن تستلم.",
    en: "It means someone left you something. Open the link in the message, and we'll confirm who you are before you receive it.",
  },
  doorHeirWarning: {
    ar: "لن نطلب منك مالاً أو كلمة مرور، ولن نتصل بك لنطلبها.",
    en: "We'll never ask you for money or a password, and we'll never call to ask for them.",
  },
  doorHeirAction: { ar: "اسألنا إن شككت", en: "Not sure? Ask us" },

  faqEyebrow: { ar: "أسئلة", en: "Questions" },
  faqTitle: { ar: "أسئلة شائعة", en: "Common questions" },
  faqMore: { ar: "لم تجد جوابك؟", en: "Can't find your answer?" },
  faqMoreAction: { ar: "اسألنا", en: "Ask us" },

  finalTitle: { ar: "رتّب ما يهمّك، مرة واحدة", en: "Sort out what matters, once" },
  finalBody: {
    ar: "حمّل وصيّة وابدأ مجاناً. لا كلمات مرور، ولا تعقيد.",
    en: "Download Wassiya and start for free. No passwords, no hassle.",
  },
} as const satisfies Dictionary
