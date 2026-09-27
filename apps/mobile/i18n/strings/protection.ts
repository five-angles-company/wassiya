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
  title: { ar: "تأكيد الحياة", en: "Life check-in" },

  // Missed check-ins release nothing, and the sheet that sets them says so
  // before anything else.
  settingsIntro: {
    ar: "نسألك أن تؤكّد ببصمتك أنك بخير. إن تأخّرت نذكّرك فقط — التأخّر لا يُسلّم شيئاً.",
    en: "We ask you to confirm with your fingerprint that you're well. If you're late we only remind you — being late hands nothing over.",
  },
  cadenceLabel: { ar: "كم مرة نسألك؟", en: "How often should we ask?" },
  cadence3: { ar: "كل ٣ أشهر", en: "Every 3 months" },
  cadence6: { ar: "كل ٦ أشهر", en: "Every 6 months" },
  cadence12: { ar: "كل سنة", en: "Every year" },
  // `graceDays` is added to the interval before the first ask
  // (`checkin.dueAfter`), so it is worded as extra time, not as a pause after.
  graceLabel: { ar: "مهلة إضافية قبل أن نسألك", en: "Extra time before we ask" },
  grace14: { ar: "أسبوعان", en: "2 weeks" },
  grace30: { ar: "شهر", en: "1 month" },
  grace60: { ar: "شهران", en: "2 months" },
  nextAsk: { ar: "سنسألك يوم {date}", en: "We'll ask you on {date}" },
  // Mirrors `ESCALATION_STEPS` in convex/checkin.ts after day 0.
  reminders: {
    ar: "إن لم تُجب، نذكّرك بعد أسبوع، ثم أسبوعين، ثم شهر.",
    en: "If you don't answer, we remind you after a week, two weeks, then a month.",
  },
  unchanged: { ar: "غيّر إعداداً لتحفظه", en: "Change a setting to save" },
  save: { ar: "احفظ", en: "Save" },
  saving: { ar: "جارٍ الحفظ…", en: "Saving…" },

  confirmPrompt: {
    ar: "أثبت هويتك لتأكيد أنك بخير",
    en: "Confirm it's you to check in",
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


