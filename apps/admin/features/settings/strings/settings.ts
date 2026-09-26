import type { Dictionary } from "@/lib/i18n/locale"

/** Deployment settings, from the console. */
export const SETTINGS = {
  pageTitle: { ar: "الإعدادات", en: "Settings" },

  // States the split in one line, because the page has two halves and the
  // difference between them is the whole security argument.
  intro: {
    ar: "ما يمكن ضبطه من هنا، وما يبقى في بيئة النشر. المفاتيح السرّية لا تُعرض ولا تُحفظ في قاعدة البيانات — تُضبط بالأمر «npx convex env set» ويُعرض هنا وجودها فقط.",
    en: "What can be set from here, and what stays in the deployment environment. Secret keys are never shown or stored in the database — they are set with npx convex env set, and this page reports only whether they are present.",
  },

  sectionEmail: { ar: "البريد", en: "Email" },
  sectionOutreach: { ar: "التواصل مع الأوصياء", en: "Executor outreach" },
  sectionLinks: { ar: "الروابط", en: "Links" },
  sectionCredentials: { ar: "المفاتيح", en: "Credentials" },
  sectionEmailHint: {
    ar: "يمرّ منه كل إشعار: سلّم التصعيد، إشعارات البلاغ، تنبيه الاسترداد.",
    en: "Every notice goes through this: the escalation ladder, claim notices, the recovery alert.",
  },
  sectionOutreachHint: {
    ar: "أول ما يصل الوصي منّا، بعد انقضاء مهلة الاعتراض.",
    en: "The first thing an executor ever hears from us, after the objection period closes.",
  },
  sectionLinksHint: {
    ar: "يُبنى منه كل رابط يخرج من هذا النظام.",
    en: "Every link this deployment sends is built from it.",
  },
  testModeOn: { ar: "مفعّل — لا بريد حقيقي", en: "On — no real mail" },
  testModeOff: { ar: "مطفأ — البريد يصل فعلاً", en: "Off — mail is delivered" },

  emailFrom: { ar: "المُرسِل", en: "Sender" },
  emailFromHint: {
    ar: "مثال: وصيّة <no-reply@wassiya.sa>. عنوان خاطئ يوقف البريد بصمت.",
    en: "For example: Wassiya <no-reply@wassiya.sa>. A wrong address stops mail silently.",
  },
  emailTestMode: { ar: "وضع الاختبار", en: "Test mode" },
  emailTestModeHint: {
    ar: "بينما هو مفعّل، لا يصل البريد إلا إلى عناوين Resend التجريبية. أطفئه للبث الحقيقي.",
    en: "While this is on, mail reaches only Resend's test addresses. Turn it off to go live.",
  },
  sendTest: { ar: "أرسل رسالة اختبار", en: "Send a test" },
  sendTestHint: {
    ar: "تصل إلى بريدك أنت، لا إلى أي شخص آخر.",
    en: "It goes to your own address, nobody else's.",
  },
  testSent: { ar: "أُرسلت إلى {to}", en: "Sent to {to}" },

  outreachProvider: { ar: "قناة التواصل", en: "Channel" },
  outreachOff: {
    ar: "يدوي — يرسل الموظّف الرابط",
    en: "By hand — staff send the link",
  },
  outreachTwilio: { ar: "Twilio (رسائل نصية)", en: "Twilio (SMS)" },
  outreachHint: {
    ar: "عند الإيقاف يظهر رابط كل تسليم في شاشة التسليمات ليرسله الموظّف بنفسه — وهو البديل عند أي فشل أيضاً.",
    en: "When off, each delivery's link appears on the Deliveries screen for staff to send by hand — which is also the fallback for any failure.",
  },
  twilioFrom: { ar: "المُرسِل", en: "Sender" },
  twilioFromHint: {
    ar: "رقم بصيغة ‎+E.164 أو معرّف خدمة رسائل يبدأ بـ MG.",
    en: "A number in +E.164 form, or a Messaging Service SID starting MG.",
  },

  appUrl: { ar: "عنوان الموقع", en: "App URL" },
  appUrlHint: {
    ar: "يُبنى منه كل رابط في كل رسالة، ومنه رابط التسليم الذي يفتحه الوصي. قيمة خاطئة تكسرها جميعاً.",
    en: "Every link in every message is built from this, including the delivery link an executor opens. A wrong value breaks all of them.",
  },

  consoleUrl: { ar: "عنوان لوحة التحكّم", en: "Console URL" },
  consoleUrlHint: {
    ar: "هذه اللوحة نفسها. تُرسل به دعوات الفريق فقط — دونه تُنشأ الدعوة ولا يصل رابطها.",
    en: "This console. Only staff invitations link to it — without it an invitation is created but its link is never sent.",
  },

  // The half the console cannot set. Present or absent, never the value.
  credentialsHint: {
    ar: "تُضبط في بيئة النشر ولا تُعرض هنا أبداً. المطلوب: npx convex env set …",
    en: "Set in the deployment environment and never shown here. Use: npx convex env set …",
  },
  credSet: { ar: "مضبوط", en: "Set" },
  credMissing: { ar: "غير مضبوط", en: "Missing" },
  credResendApiKey: { ar: "مفتاح Resend", en: "Resend API key" },
  credTwilioAccountSid: { ar: "معرّف حساب Twilio", en: "Twilio account SID" },
  credTwilioAuthToken: { ar: "رمز Twilio", en: "Twilio auth token" },
  credDiditApiKey: { ar: "مفتاح Didit", en: "Didit API key" },
  credDiditWebhookSecret: { ar: "سر ويبهوك Didit", en: "Didit webhook secret" },
  credClerkWebhookSecret: { ar: "سر ويبهوك Clerk", en: "Clerk webhook secret" },
  credIdentityHashSecret: {
    ar: "مفتاح تجزئة الهوية",
    en: "Identity hash secret",
  },

  // Where a value is coming from, which is the thing a form cannot show.
  fromEnv: { ar: "من بيئة النشر", en: "From the environment" },
  fromRow: { ar: "من هذه الشاشة", en: "From this screen" },
  unset: { ar: "غير مضبوط", en: "Not set" },
  effective: { ar: "الفعّال الآن: {value}", en: "In effect: {value}" },
  placeholderEnv: { ar: "متروك لبيئة النشر", en: "Left to the environment" },

  save: { ar: "احفظ", en: "Save" },
  saving: { ar: "يُحفظ…", en: "Saving…" },
  saved: { ar: "حُفظت الإعدادات", en: "Settings saved" },
  saveFailed: { ar: "تعذّر الحفظ", en: "Could not save" },
  updatedAt: { ar: "آخر تعديل {date}", en: "Last changed {date}" },
  neverSaved: { ar: "لم تُعدّل من هنا بعد", en: "Never changed from here" },

  // Page titles for the four settings screens.
  titleIntegrations: { ar: "التكاملات", en: "Integrations" },
  introIntegrations: {
    ar: "ما يمكن ضبطه من هنا، وما يبقى في بيئة النشر. المفاتيح السرّية لا تُعرض ولا تُحفظ في قاعدة البيانات — يُعرض وجودها فقط.",
    en: "What can be set from here, and what stays in the deployment environment. Secret keys are never shown or stored in the database — only whether they are present.",
  },
  titlePlans: { ar: "الخطط والحدود", en: "Plans and limits" },
  introPlans: {
    ar: "ما تسمح به كل خطة. يسري التعديل فوراً على كل من فيها، ولا يُحذف شيء أبداً.",
    en: "What each plan allows. A change applies immediately to everyone on it, and nothing is ever deleted.",
  },
  titlePolicy: { ar: "المهل والسياسات", en: "Policy and timing" },
  introPolicy: {
    ar: "المهل التي يعمل بها المنتج. للقراءة فقط: بعضها وعد مُثبّت، وتغييره يمرّ بالكود والمراجعة لا بمربّع نص.",
    en: "The windows the product runs on. Read-only: several are stated promises, and changing one goes through code and review rather than a text box.",
  },
  // Policy, read-only.
  sectionClaims: { ar: "بلاغات الوفاة", en: "Death reports" },
  sectionClaimsHint: {
    ar: "ما بين البلاغ وفتح الخزنة.",
    en: "What sits between a report and a vault opening.",
  },
  sectionDelivery: { ar: "التسليم", en: "Delivery" },
  sectionDeliveryHint: {
    ar: "كم يبقى الباب مفتوحاً للوصي.",
    en: "How long the door stays open for an executor.",
  },
  sectionCheckin: { ar: "نبض الحياة", en: "Life check-in" },
  sectionCheckinHint: {
    ar: "سلّم التصعيد حين يتوقّف صاحب الخزنة عن الرد.",
    en: "The escalation ladder when an owner stops answering.",
  },
  vetoWindow: { ar: "مهلة الاعتراض", en: "Objection period" },
  vetoWindowHint: {
    ar: "من موافقة الموظّف على الشهادة حتى الإفراج، ما لم يعترض صاحب الخزنة ببصمته.",
    en: "From staff approving the certificate to release, unless the owner vetoes with their fingerprint.",
  },
  vetoLockout: { ar: "الحظر بعد الاعتراض", en: "Lockout after a veto" },
  vetoLockoutHint: {
    ar: "كم يُمنع مقدّم البلاغ من تقديم بلاغ آخر بعد اعتراض صاحب الخزنة.",
    en: "How long a claimant is barred from filing again after the owner vetoes.",
  },
  claimRate: { ar: "حدّ البلاغات", en: "Filing limit" },
  claimRateHint: {
    ar: "كم بلاغاً يقبل النظام من مقدّم واحد في اليوم.",
    en: "How many reports one filer may submit in a day.",
  },
  deliveryWindow: { ar: "نافذة التسليم", en: "Delivery window" },
  deliveryWindowHint: {
    ar: "بعدها تُحذف الخزنة كلها حين يُغلق آخر تسليم لها، ولا يفتحها أحد — نحن أيضاً.",
    en: "After this, once its last delivery closes, the whole vault is deleted and nobody can open it, us included.",
  },
  escalation: { ar: "أيام التصعيد", en: "Escalation days" },
  escalationHint: {
    ar: "بعد كم يوم من التأخّر تُرسَل كل خطوة.",
    en: "How many days overdue each step is sent.",
  },
  snooze: { ar: "التأجيل", en: "Snooze" },
  snoozeHint: {
    ar: "كم يؤجّل صاحب الخزنة موعده حين يطلب ذلك.",
    en: "How far an owner pushes their next check-in when they ask to.",
  },
  days: { ar: "{n} يوماً", en: "{n} days" },
  perDay: { ar: "{n} في اليوم", en: "{n} per day" },
  locked: { ar: "مُثبّت", en: "Locked" },
  lockedFootnote: {
    ar: "المُثبّت وعدٌ منصوص عليه — يتغيّر بالكود والمراجعة، لا من هنا.",
    en: "A locked value is a stated promise — it changes through code and review, not from here.",
  },

  sectionIdentity: { ar: "التحقق من الهوية", en: "Identity" },
  maxAttempts: { ar: "عدد المحاولات", en: "Attempt cap" },
  maxAttemptsHint: {
    ar: "بعد هذا العدد من الرفض يُطلب من صاحب الخزنة التواصل مع الدعم — وتُعاد المحاولات من شاشة الهوية.",
    en: "After this many rejections an owner is told to contact support, and attempts are reset from the identity queue.",
  },
  diditWorkflow: { ar: "مسار Didit", en: "Didit workflow" },
  diditWorkflowHint: {
    ar: "معرّف المسار الذي تُفتح به جلسات التحقق.",
    en: "The workflow id verification sessions are opened against.",
  },
} as const satisfies Dictionary
