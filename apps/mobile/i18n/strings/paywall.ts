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
  assetsBody: {
    ar: "خطتك الحالية تحفظ {free} أصول. الخطة السنوية تفتح عدداً غير محدود.",
    en: "Your current plan holds {free} assets. The annual plan makes it unlimited.",
  },

  storageTitle: { ar: "انتهت مساحتك", en: "You are out of space" },
  storageBody: {
    ar: "خطتك الحالية تمنحك {free}. الخطة السنوية ترفعها إلى {paid}.",
    en: "Your current plan gives you {free}. The annual plan raises it to {paid}.",
  },

  executorsTitle: { ar: "وصلت إلى حدّ الأوصياء", en: "You have reached your executor limit" },
  executorsBody: {
    ar: "خطتك الحالية تتيح {free}. الخطة السنوية تتيح لك تسمية أكثر من وصيّ، فلا يتوقف التسليم على ورقة واحدة.",
    en: "Your current plan allows {free}. The annual plan lets you name more than one executor, so the handover never rests on a single sheet.",
  },

  photosTitle: { ar: "الصور مع الخطة السنوية", en: "Photos come with the annual plan" },
  photosBody: {
    ar: "خطتك الحالية تحفظ النصوص والمستندات. الصور والملفات الكبيرة تحتاج الخطة السنوية.",
    en: "Your current plan holds text and documents. Photos and large files need the annual plan.",
  },

  fileSizeTitle: { ar: "هذا الملف أكبر من خطتك", en: "This file is larger than your plan" },
  fileSizeBody: {
    ar: "خطتك الحالية تقبل ملفاً حتى {free}. الخطة السنوية تقبل حتى {paid} للملف.",
    en: "Your current plan accepts files up to {free}. The annual plan accepts up to {paid} each.",
  },

  lapsedTitle: { ar: "اشتراكك انتهى", en: "Your subscription has ended" },
  lapsedBody: {
    ar: "خزنتك تبقى مقروءة والتسليم لأوصيائك يعمل كما هو. التجديد يعيد الإضافة فقط.",
    en: "Your vault stays readable and delivery to your executors still works. Renewing only brings adding back.",
  },

  /** What the annual plan is, in four lines. Order is deliberate: value first. */
  unlocksTitle: { ar: "الخطة السنوية", en: "The annual plan" },
  unlockAssets: { ar: "أصول بلا حد", en: "Unlimited assets" },
  unlockAssetsCount: { ar: "{paid} أصل", en: "{paid} assets" },
  unlockExecutors: { ar: "أوصياء بلا حد", en: "Unlimited executors" },
  unlockExecutorsCount: { ar: "{paid} أوصياء", en: "{paid} executors" },
  unlockPhotos: { ar: "الصور والملفات الكبيرة", en: "Photos and large files" },
  unlockStorage: { ar: "{paid} مساحة مشفّرة", en: "{paid} of encrypted storage" },

  /** Counts, where a limit is a number of things rather than a size. */
  assetsCount: { ar: "{n} أصول", en: "{n} assets" },
  executorsCount: { ar: "{n} أوصياء", en: "{n} executors" },
  unlimited: { ar: "عدداً غير محدود", en: "an unlimited number" },
  unitMb: { ar: "م.ب", en: "MB" },
  unitGb: { ar: "غ.ب", en: "GB" },

  subscribe: { ar: "اشترك", en: "Subscribe" },
  renew: { ar: "جدّد الاشتراك", en: "Renew" },
  perYear: { ar: "سنوياً", en: "per year" },
  notNow: { ar: "ليس الآن", en: "Not now" },
  restore: { ar: "استعادة عملية شراء", en: "Restore a purchase" },

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
