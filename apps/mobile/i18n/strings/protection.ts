/**
 * ٦ — الحماية.
 *
 * The behaviour these strings describe is fixed by AGENTS.md's locked security
 * model and by `convex/checkin.ts` and `convex/claims.ts` — the ladder, the
 * cadence and the objection period are not copy decisions. The wording and the
 * arrangement are ours.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** ٦.١ — the Protection Centre. */
export const PROTECTION = {
  title: { ar: "الحماية", en: "Protection" },
  scoreLabel: { ar: "قوة حمايتك", en: "Your protection" },
  scoreComplete: {
    ar: "خزنتك محميّة بالكامل",
    en: "Your vault is fully protected",
  },
  scoreIncomplete: {
    ar: "أكمل الخطوات التالية لتكتمل حمايتك",
    en: "Finish these steps to complete your protection",
  },

  // Each row is a real gate, and each links to the screen that closes it.
  itemIdentity: { ar: "التحقق من الهوية", en: "Identity verified" },
  itemKey: { ar: "مفتاح الخزنة", en: "Vault key" },
  itemSheet: { ar: "وثيقة الاسترداد مطبوعة", en: "Recovery sheet printed" },
  itemExecutors: { ar: "الأوصياء", en: "Executors" },
  itemCheckin: { ar: "تأكيد الحياة", en: "Life check-in" },

  needed: { ar: "مطلوب", en: "Needed" },
  later: { ar: "لاحقاً", en: "Later" },

} satisfies LabelSet<string>

/** ٦.٤ — the life check-in. */
export const CHECKIN = {
  // Says where the button went, so this screen isn't a dead end for anyone
  // who came here looking for it.
  confirmOnHome: {
    ar: "تأكيد الحياة يتم من الشاشة الرئيسية، ببصمتك.",
    en: "You confirm you're well from the home screen, with your fingerprint.",
  },
  title: { ar: "تأكيد الحياة", en: "Life check-in" },
  intro: {
    ar: "نسألك بين حين وآخر إن كنت بخير، ونذكّرك إن تأخّرت. التأخّر وحده لا يُسلّم شيئاً: التسليم يحتاج بلاغ وفاة موثّقاً، وتأكيدك ببصمتك يوقف أي بلاغ.",
    en: "We ask now and then whether you're well, and remind you if you're late. Being late hands nothing over by itself: delivery needs a verified death report, and confirming with your fingerprint stops any report.",
  },

  // The sheet titles itself with the words on the link that opened it —
  // "إعدادات النبض" — not with the section name. `title` still names the route.
  settingsTitle: { ar: "إعدادات النبض", en: "Pulse settings" },
  cadenceLabel: { ar: "كل كم شهر نسألك؟", en: "How often should we ask?" },
  cadence3: { ar: "٣ أشهر", en: "3 months" },
  cadence6: { ar: "٦ أشهر", en: "6 months" },
  cadence12: { ar: "١٢ شهراً", en: "12 months" },
  graceLabel: { ar: "المهلة قبل التصعيد", en: "Grace before escalation" },
  grace14: { ar: "١٤ يوماً", en: "14 days" },
  grace30: { ar: "٣٠ يوماً", en: "30 days" },
  grace60: { ar: "٦٠ يوماً", en: "60 days" },
  save: { ar: "احفظ الإعداد", en: "Save settings" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },

  // The single confirm. Biometric-gated, and the only place in the entire
  // product where life may be confirmed.
  promptTitle: { ar: "هل أنت بخير؟", en: "Are you well?" },
  confirm: { ar: "أنا بخير", en: "I'm well" },
  confirmPrompt: {
    ar: "أثبت هويتك لتأكيد أنك بخير",
    en: "Confirm it's you to check in",
  },
  confirmed: { ar: "تم التأكيد. نراك بعد {n} شهراً.", en: "Confirmed. See you in {n} months." },
  snooze: { ar: "ذكّرني بعد أسبوع", en: "Remind me in a week" },
  lastConfirmed: { ar: "آخر تأكيد {date}", en: "Last confirmed {date}" },
  nextDue: { ar: "التأكيد القادم {date}", en: "Next check-in {date}" },
  overdue: {
    ar: "تأخّر التأكيد. أكّد الآن لإيقاف التصعيد.",
    en: "Your check-in is overdue. Confirm now to stop the escalation.",
  },
  biometricFailed: {
    ar: "لم يتم التحقق. التأكيد يحتاج بصمتك دائماً — ولن نقبله بأي طريقة أخرى.",
    en: "Not verified. Checking in always needs your biometrics — and we accept it no other way.",
  },
  notConfigured: {
    ar: "لم تفعّل تأكيد الحياة بعد. فعّله لنطمئن عليك بانتظام — وستستطيع دائماً إيقاف أي بلاغ وفاة ببصمتك.",
    en: "Life check-in is off. Turn it on so we check on you regularly — you can always stop a death report with your fingerprint.",
  },
  enable: { ar: "فعّل تأكيد الحياة", en: "Turn on life check-in" },
} satisfies LabelSet<string>

/**
 * ٧.٥ — a death report against the owner, as Home's banner states it. There is
 * no separate veto: the fingerprint check-in right below the banner stops it.
 */
export const CLAIM_VETO = {
  title: { ar: "بلاغ وفاة على حسابك", en: "A death report on your account" },
  // Deliberately unalarming in tone and unambiguous in fact. Most reports are
  // genuine; the ones that are not are the reason this banner exists.
  intro: {
    ar: "بلّغ {name} عن وفاتك. إن كنت تقرأ هذا فأنت حيّ: أكّد ببصمتك أدناه أنك بخير، فيتوقف البلاغ فوراً.",
    en: "{name} has reported your death. If you are reading this, you are alive: confirm below with your fingerprint and the report stops at once.",
  },
  deadline: {
    ar: "إن لم يتوقف قبل {date}، نتواصل مع أوصيائك، ويستلمون ما اخترت تسليمه فقط.",
    en: "If it is not stopped before {date}, we contact your executors, and they receive only what you chose to hand over.",
  },
  stopped: {
    ar: "أُوقف البلاغ. لن يُسلَّم شيء، ولن يستطيع المُبلِّغ المحاولة مجدداً لمدة ٩٠ يوماً.",
    en: "The report is stopped. Nothing will be handed over, and the reporter cannot try again for 90 days.",
  },
} satisfies LabelSet<string>


