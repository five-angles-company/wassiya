/**
 * The paywall, and the only screen in the product that asks for money.
 *
 * Three rules it must not break, all from AGENTS.md:
 *
 *   - **It says what the plan unlocks, never what the owner risks losing.**
 *     The lapse banner on ٩.٤ leads with what still works for the same reason:
 *     a vault about death must never be sold with fear, and a line implying
 *     executors could lose access would be untrue as well as cruel.
 *   - **No number is written here.** Every limit arrives as `{free}` or
 *     `{paid}` and is filled from `plans.current`. The catalogue is editable
 *     from the console, so a sentence reading "٥٠٠ م.ب" would be a lie the
 *     first time a tier moved — and a lie nothing would surface, because the
 *     server would go on enforcing the real number in silence.
 *   - **No price.** The CTA renders the store's own localised `priceString`;
 *     these strings only supply the frame around it.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

/** The limit sheet. One title and one line per wall an owner can hit. */
export const PAYWALL = {
  assetsTitle: { ar: "خزنتك المجانية ممتلئة", en: "Your free vault is full" },
  // Counts are bare numbers in a "limit: n" frame, so every value reads right
  // in Arabic without a counted-noun form for each — and "up to", because even
  // the annual plan stops at the vault's ceiling.
  assetsBody: {
    ar: "حدّ الأصول في خطتك الحالية {free}، وفي الخطة السنوية حتى {paid}.",
    en: "Asset limit on your current plan: {free}. On the annual plan: up to {paid}.",
  },

  storageTitle: { ar: "انتهت مساحتك", en: "You are out of space" },
  storageBody: {
    ar: "خطتك الحالية تمنحك {free}. الخطة السنوية ترفعها إلى {paid}.",
    en: "Your current plan gives you {free}. The annual plan raises it to {paid}.",
  },

  executorsTitle: { ar: "وصلت إلى حدّ الأوصياء", en: "You have reached your executor limit" },
  executorsBody: {
    ar: "حدّ الأوصياء في خطتك الحالية {free}، وفي الخطة السنوية حتى {paid}.",
    en: "Executor limit on your current plan: {free}. On the annual plan: up to {paid}.",
  },

  photosTitle: {
    ar: "الصور والفيديو مع الخطة السنوية",
    en: "Photos and videos come with the annual plan",
  },
  photosBody: {
    ar: "خطتك الحالية للنصوص والمستندات فقط.",
    en: "Your current plan holds text and documents only.",
  },

  fileSizeTitle: { ar: "هذا الملف أكبر من خطتك", en: "This file is larger than your plan" },
  fileSizeBody: {
    ar: "خطتك الحالية تقبل ملفاً حتى {free}. الخطة السنوية تقبل حتى {paid} للملف.",
    en: "Your current plan accepts files up to {free}. The annual plan accepts up to {paid} each.",
  },

  lapsedTitle: { ar: "اشتراكك انتهى", en: "Your subscription has ended" },
  lapsedBody: {
    ar: "خزنتك محفوظة كما هي، والتسليم لأوصيائك قائم. جدّد لتضيف وتعدّل.",
    en: "Your vault is kept as it is, and delivery to your executors still works. Renew to add and edit.",
  },

  /** What the annual plan is, in four lines. Order is deliberate: value first. */
  unlocksTitle: { ar: "الخطة السنوية", en: "The annual plan" },
  unlockAssets: { ar: "الأصول: حتى {paid}", en: "Assets: up to {paid}" },
  unlockExecutors: { ar: "الأوصياء: حتى {paid}", en: "Executors: up to {paid}" },
  unlockPhotos: { ar: "الصور والفيديو والملفات الكبيرة", en: "Photos, videos and large files" },
  unlockStorage: { ar: "{paid} مساحة مشفّرة", en: "{paid} of encrypted storage" },

  /** A size with no cap. Counts always have one — the vault's ceiling. */
  unlimited: { ar: "بلا حد", en: "no limit" },
  unitMb: { ar: "م.ب", en: "MB" },
  unitGb: { ar: "غ.ب", en: "GB" },

  subscribe: { ar: "اشترك", en: "Subscribe" },
  renew: { ar: "جدّد الاشتراك", en: "Renew" },
  perYear: { ar: "سنوياً", en: "per year" },
  notNow: { ar: "ليس الآن", en: "Not now" },

  // Billing is not wired yet. The same rule the OTP resend and the ٩.٤ manage
  // row follow: a button that looks live and does nothing is worse than a
  // sentence admitting the truth.
  soonTitle: { ar: "الاشتراك يفتح قريباً", en: "Subscriptions open soon" },
  contactUs: { ar: "راسلنا", en: "Contact us" },
  soonBody: {
    ar: "لم نفتح الدفع بعد. تواصل معنا وسنرفع حدودك يدوياً في هذه الأثناء.",
    en: "Payments are not open yet. Contact us and we will raise your limits by hand in the meantime.",
  },
} satisfies LabelSet<string>
