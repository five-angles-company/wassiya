import type { Dictionary } from "@/i18n/locale"

/**
 * The home page, written for someone who has never thought about encryption:
 * everyday words, short sentences, no technical terms. "Locked" rather than
 * "encrypted", "a waiting period" rather than "veto window".
 *
 * Rules this file must keep (AGENTS.md):
 *   - **Wassiya holds no key, and the price of that is stated.** The executor
 *     opens what was handed over with their own sheet, or the owner's recovery
 *     sheet; if every sheet is lost nobody can open it. `securityHandoverBody`
 *     and the FAQ say so in plain words. Never write that Wassiya can open,
 *     recover or reset anything.
 *   - **Delivery goes to the executor**, who carries out the will — never "to
 *     the people you chose". Arabic says الوصي / الأوصياء, never وريث / ورثة.
 *   - **No number is written here.** Plan limits arrive from `plans.published`
 *     at build time, and there is never a price — the fallbacks included.
 *   - **No "am I an executor?" path.** Every executor is silent; the executor
 *     door explains the message they may receive and nothing more.
 */
export const HOME = {
  metaTitle: {
    ar: "وصيّة — احفظ ما يهمّك لمن تحب",
    en: "Wassiya — keep what matters for the people you love",
  },
  metaDescription: {
    ar: "احفظ حساباتك ومستنداتك ورسائلك في خزنة آمنة على جوّالك. لا يراها أحد غيرك، وبعد رحيلك يستلم وصيّك ما اخترت تسليمه فقط. ولا نملك نحن أي مفتاح.",
    en: "Keep your accounts, documents and messages in a safe vault on your phone. Nobody else can see them, and after you're gone your executor receives only what you chose to hand over. We hold no key.",
  },

  heroBadge: { ar: "خزنة آمنة لإرثك الرقمي", en: "A safe vault for your digital legacy" },
  heroTitleLead: { ar: "ما يهمّك،", en: "What matters to you," },
  heroTitleAccent: { ar: "بيد من تثق به.", en: "in hands you trust." },
  heroBody: {
    ar: "احفظ حساباتك ومستنداتك ورسائلك في خزنة على جوّالك. ما دمت حيّاً لا يراها أحد غيرك — ولا نحن. وبعد رحيلك، يستلم وصيّك ما اخترت تسليمه فقط، ويُنفّذ وصيّتك.",
    en: "Keep your accounts, documents and messages in a vault on your phone. While you're alive, nobody else can see them — not even us. After you're gone, the executor you named receives only what you chose to hand over, and carries out your will.",
  },
  heroHow: { ar: "كيف تعمل", en: "See how it works" },
  heroTrustDevice: { ar: "لا يراها أحد غيرك", en: "Only you can see it" },
  heroTrustPasswords: { ar: "بلا كلمات مرور", en: "No passwords" },
  heroTrustFree: { ar: "مجاني للبدء", en: "Free to start" },

  floatLockTitle: { ar: "لا نملك أي مفتاح", en: "We hold no key" },
  floatLockMeta: { ar: "لا في حياتك، ولا بعدها", en: "Not in your lifetime, nor after" },
  floatExecutorTitle: { ar: "وصيّك: محمد", en: "Your executor: Mohammed" },
  floatExecutorMeta: { ar: "لا نراسله بشيء قبل وقته", en: "We send him nothing until it's time" },

  proofDeviceTitle: { ar: "خاصة بك وحدك", en: "Private to you" },
  proofDeviceBody: { ar: "حتى نحن لا نرى ما تحفظه", en: "Not even we can see what you keep" },
  proofFingerprintTitle: { ar: "تُفتح ببصمتك", en: "Opens with your fingerprint" },
  proofFingerprintBody: { ar: "بلا كلمات مرور تنساها", en: "No passwords to forget" },
  proofHandoverTitle: { ar: "لوصيّك وحده", en: "Only to your executor" },
  proofHandoverBody: { ar: "يستلم ما اخترت تسليمه، لا أكثر", en: "What you chose to hand over, nothing more" },
  proofHumanTitle: { ar: "نتأكد قبل كل خطوة", en: "We check before every step" },
  proofHumanBody: { ar: "من الوفاة ومن هوية الوصي", en: "The death, and your executor's identity" },

  stepsEyebrow: { ar: "كيف تعمل", en: "How it works" },
  stepsTitle: { ar: "ثلاث خطوات بسيطة", en: "Three simple steps" },
  step1Title: { ar: "أضف ما يهمّك", en: "Add what matters" },
  step1Body: {
    ar: "حساباتك ومستنداتك وصورك ورسائلك. ولكلٍّ منها تختار: يُسلَّم لوصيّك، أو يبقى خاصاً فلا يصل لأحد.",
    en: "Your accounts, documents, photos and messages. For each one you choose: handed over to your executor, or kept private so it reaches no one.",
  },
  step2Title: { ar: "سمِّ وصيّك", en: "Name your executor" },
  step2Body: {
    ar: "اختر من تثق به — واحداً أو أكثر — واطبع لكلٍّ منهم ورقته. أعطه إياها، أو ضعها مع وصيّتك.",
    en: "Choose someone you trust — one person or more — and print each of them their sheet. Hand it to them, or keep it with your will.",
  },
  step3Title: { ar: "يستلمها بعد رحيلك", en: "They receive it after you" },
  step3Body: {
    ar: "بعد التأكد من الوفاة ومن هويته، يفتح وصيّك ما اخترت تسليمه بورقته، ويُنفّذ وصيّتك.",
    en: "Once the death and their identity are confirmed, your executor opens what you chose to hand over with their sheet, and carries out your will.",
  },

  securityEyebrow: { ar: "الخصوصية", en: "Privacy" },
  securityTitle: {
    ar: "لا نملك أي مفتاح لخزنتك",
    en: "We hold no key to your vault",
  },
  securityBody: {
    ar: "كل شيء يُقفل على جوّالك قبل أن يصل إلينا. مفتاح خزنتك معك وحدك، وما تسلّمه لوصيّك لا تفتحه إلا ورقته.",
    en: "Everything is locked on your phone before it reaches us. Only you hold your vault's key, and what you hand over opens only with your executor's sheet.",
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
    ar: "كل ملف وكل سرّ له قفل خاص به، يُقفل على جوّالك قبل أن يُرفع.",
    en: "Every file and every secret has its own lock, closed on your phone before it's uploaded.",
  },
  securityPhoneTitle: { ar: "على جوّالك فقط", en: "On your phone only" },
  securityPhoneBody: {
    ar: "ما دمت حيّاً لا تُفتح خزنتك من أي موقع أو جهاز آخر، ولا نملك مفتاحها.",
    en: "While you're alive, your vault can't be opened from a website or another device, and we don't have its key.",
  },
  securityHandoverTitle: {
    ar: "وبعد رحيلك، بورقة وصيّك",
    en: "After you, with your executor's sheet",
  },
  securityHandoverBody: {
    ar: "يفتح وصيّك ما اخترت تسليمه بورقته، على جهازه، بعد التحقق من الوفاة ومن هويته. وما أبقيته خاصاً لا يفتحه أحد. ولأننا لا نملك أي مفتاح: إن ضاعت ورقته وورقة استردادك معاً، فلا يستطيع أحد فتحه — ولا نحن.",
    en: "Your executor opens what you chose to hand over with their sheet, on their own device, once the death and their identity are verified. What you kept private, nobody opens. And because we hold no key: if their sheet and your recovery sheet are both lost, nobody can open it — not even us.",
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
    ar: "اكتبها أو سجّلها بصوتك، ويوصلها وصيّك لأصحابها.",
    en: "Write them or record them in your voice, and your executor passes them on.",
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
    ar: "ورقة مطبوعة تفتح خزنتك إذا ضاع جوّالك. احفظها مع أوراقك المهمة، فمن يملكها يستطيع فتح خزنتك. وبعد التحقق من وفاتك لا تفتح إلا ما اخترت تسليمه، ولوصيّك بعد التحقق من هويته.",
    en: "A printed sheet that opens your vault if you lose your phone. Keep it with your important papers — whoever has it can open your vault. Once your death is verified, it opens only what you chose to hand over, and only for your verified executor.",
  },
  keysNever: {
    ar: "لن نطلب منك هذه الورقة أبداً، ولا ورقة وصيّك. من يطلبها منك ليس نحن.",
    en: "We will never ask you for this sheet, or your executor's. Anyone who does is not us.",
  },

  releaseEyebrow: { ar: "بعد رحيلك", en: "After you're gone" },
  releaseTitle: {
    ar: "لا نسلّم شيئاً قبل أن نتأكد",
    en: "Nothing is handed over until we're sure",
  },
  releaseBody: {
    ar: "لا نراسل وصيّك بشيء مسبقاً. أول ما يسمعه منّا رسالتنا إليه، بعد التحقق من الوفاة وانتهاء فترة الانتظار.",
    en: "We send your executor nothing in advance. The first they hear from us is our message, once the death is verified and the waiting period is over.",
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
  gateIdentity: { ar: "نتأكد من هوية الوصي", en: "We confirm who your executor is" },
  gateIdentityMeta: {
    ar: "ونطابقها برقم الهوية الذي سجّلته له",
    en: "Matched to the ID number you registered for them",
  },
  gateDelivery: { ar: "التسليم", en: "Handed over" },
  gateDeliveryMeta: {
    ar: "يفتحه الوصي بورقته على جهازه، خلال سنة",
    en: "Your executor opens it with their sheet, on their device, within a year",
  },
  checkinTitle: { ar: "ونطمئن عليك", en: "And we check in on you" },
  checkinBody: {
    ar: "من وقت لآخر نسألك: هل أنت بخير؟ لمسة ببصمتك تكفي للرد، وهي نفسها توقف أي بلاغ عن وفاتك. ولا نسلّم شيئاً أبداً دون شهادة وفاة رسمية.",
    en: "Every so often we ask: are you well? One touch of your fingerprint is enough — and the same touch stops any report of your death. Nothing is ever handed over without an official death certificate.",
  },
  sharesTitle: { ar: "وصيّك يُنفّذ وصيّتك", en: "Your executor carries out your will" },
  sharesBody: {
    ar: "نسلّمه ما اخترته كما هو، ولا نقسّم الميراث. تقسيم الميراث يحكمه الشرع والقانون.",
    en: "We hand over what you chose, as it is. We don't divide inheritances — that is set by law.",
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
    ar: "مساحة أكبر، وأوصياء أكثر، والصور والملفات الكبيرة.",
    en: "More room, more executors, plus photos and large files.",
  },
  planStorage: { ar: "المساحة", en: "Storage" },
  planAssets: { ar: "العناصر", en: "Items" },
  planExecutors: { ar: "الأوصياء", en: "Executors" },
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
    ar: "إذا توقف اشتراكك تبقى خزنتك كما هي، ويبقى التسليم لوصيّك قائماً. فقط لن تستطيع إضافة الجديد.",
    en: "If your subscription stops, your vault stays as it is and your executor still receives what you chose to hand over. You just can't add anything new.",
  },

  doorsEyebrow: { ar: "للعائلات", en: "For families" },
  doorsTitle: { ar: "هل أنت هنا من أجل شخص آخر؟", en: "Here because of someone else?" },
  doorClaimTitle: { ar: "فقدت شخصاً عزيزاً", en: "I've lost someone" },
  doorClaimBody: {
    ar: "إن كان يستخدم وصيّة، ابدأ بالإبلاغ عن وفاته. لن تحصل على شيء بتقديم البلاغ — نحن نتواصل مباشرة مع من سمّاه وصياً.",
    en: "If they used Wassiya, start by reporting their death. Reporting doesn't give you anything — we contact the executor they named directly.",
  },
  doorClaimAction: { ar: "أبلغ عن وفاة", en: "Report a death" },
  doorClaimMeta: {
    ar: "دقائق قليلة، ويمكنك الإكمال لاحقاً",
    en: "A few minutes, and you can finish later",
  },
  doorExecutorTitle: { ar: "وصلتني رسالة من وصيّة", en: "I got a message from Wassiya" },
  doorExecutorBody: {
    ar: "يعني ذلك أن شخصاً سمّاك وصياً على ما تركه لدينا. افتح الرابط في الرسالة وأثبت هويتك، ثم افتح ما تُرك بورقة الوصي — تجدها معك أو مع وصيّته.",
    en: "It means someone named you the executor of what they left with us. Open the link in the message and confirm who you are, then open what was left with the executor sheet — you have it, or it's with their will.",
  },
  doorExecutorWarning: {
    ar: "لن نطلب منك مالاً ولا كلمة مرور ولا رمز ورقتك، ولن نتصل بك لنطلبها.",
    en: "We'll never ask you for money, a password or your sheet's code, and we'll never call to ask for them.",
  },
  doorExecutorAction: { ar: "اسألنا إن شككت", en: "Not sure? Ask us" },

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
