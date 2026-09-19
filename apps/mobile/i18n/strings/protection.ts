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
  itemHeirs: { ar: "الورثة", en: "Heirs" },
  itemRouting: { ar: "توجيه الأصول", en: "Asset routing" },
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
    ar: "نسألك بين حين وآخر إن كنت بخير. إذا لم تجب خلال المهلة، تبدأ إجراءات التسليم لورثتك.",
    en: "We ask now and then whether you're well. If you don't answer within the grace period, delivery to your heirs begins.",
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
    ar: "لم تفعّل تأكيد الحياة بعد. بدونه لن يبدأ التسليم لورثتك أبداً.",
    en: "Life check-in is off. Without it, delivery to your heirs never begins.",
  },
  enable: { ar: "فعّل تأكيد الحياة", en: "Turn on life check-in" },
} satisfies LabelSet<string>

/**
 * ٧.٥ — the owner's veto interrupt.
 *
 * The one screen of section ٧ that lives in the app rather than the web funnel,
 * and the reason is stated: *"it must reach a person who is alive, on their own
 * phone, with a biometric to cancel."* A veto is the assertion "I am not dead",
 * and it has to be provable by presence, not by a tap on an unlocked handset
 * someone else is holding.
 */
export const CLAIM_VETO = {
  title: { ar: "طلب وراثة على حسابك", en: "An inheritance claim on your account" },
  // Deliberately unalarming in tone and unambiguous in fact. Most claims are
  // genuine; the ones that are not are the reason this screen exists.
  intro: {
    ar: "تقدّم {name} بطلب للوصول إلى ما تركته. إن كنت تقرأ هذا، فأنت حيّ — وبإمكانك إيقاف الطلب.",
    en: "{name} has filed a claim to access what you left. If you're reading this, you're alive — and you can stop it.",
  },
  deadline: {
    ar: "إن لم توقفه قبل {date}، سيُفرج عمّا خُصّص لهم.",
    en: "If you don't stop it before {date}, what's routed to them will be released.",
  },
  daysLeft: { ar: "{n} يوماً متبقياً", en: "{n} days left" },

  // Home links here; it must NOT read as the veto itself. Stopping a claim is
  // biometric-gated and happens on the claim screen, not from a banner.
  review: { ar: "راجع الطلب", en: "Review the claim" },
  veto: { ar: "أوقف الطلب — أنا بخير", en: "Stop this claim — I'm well" },
  vetoing: { ar: "جارٍ الإيقاف…", en: "Stopping…" },
  vetoPrompt: {
    ar: "أثبت هويتك لإيقاف الطلب",
    en: "Confirm it's you to stop this claim",
  },
  vetoed: {
    ar: "أُوقف الطلب. لن يُفرج عن شيء، ولن يستطيع مقدّم الطلب المحاولة مجدداً لمدة ٩٠ يوماً.",
    en: "The claim is stopped. Nothing will be released, and the claimant cannot try again for 90 days.",
  },
  vetoFailed: {
    ar: "تعذّر إيقاف الطلب. لم يتغيّر شيء — حاول مرة أخرى.",
    en: "Could not stop the claim. Nothing changed — try again.",
  },
  biometricFailed: {
    ar: "لم يتم التحقق. إيقاف الطلب يحتاج بصمتك — وهذا ما يمنع شخصاً آخر من إيقافه نيابةً عنك.",
    en: "Not verified. Stopping a claim needs your biometrics — which is what stops someone else doing it for you.",
  },
  windowClosed: {
    ar: "انتهت مدة الاعتراض على هذا الطلب.",
    en: "The objection window for this claim has closed.",
  },

  // The other half of the honesty: doing nothing is also a decision.
  ignoreTitle: { ar: "إن لم تفعل شيئاً", en: "If you do nothing" },
  ignoreBody: {
    ar: "سيمضي الطلب في مساره: بعد انتهاء المدة نتواصل مع ورثتك، ويستلم كلٌّ منهم ما خُصّص له وحده بعد التحقّق من هويته.",
    en: "The claim continues: when the period ends we contact your heirs, and each receives only what was routed to them once their identity is verified.",
  },
  none: { ar: "لا توجد طلبات على حسابك.", en: "No claims against your account." },
} satisfies LabelSet<string>


