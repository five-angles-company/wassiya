/**
 * Copy shared across screens, plus the stubbed tab shell.
 *
 * `stepOf` is the section ٢ progress meter: four steps, rendered
 * it "١ من ٤" in Arabic — Eastern Arabic-Indic numerals, so the numbers go
 * through `fmtNum` at the call site rather than being baked in here.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

export const COMMON = {
  back: { ar: "رجوع", en: "Back" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  stepSeparator: { ar: "من", en: "of" },
  loading: { ar: "لحظة…", en: "One moment…" },
  // The OS biometric sheet's own message, so it says why the vault is asking
  // rather than leaving the system default to. Distinct from `setup.prompt`,
  // which is the one-time key *creation* prompt in section ٢.
  unlockPrompt: {
    ar: "افتح خزنتك لعرض أصولك",
    en: "Unlock your vault to see your assets",
  },
  // The error boundary's screen. It sits above Convex, so it cannot read the
  // profile's language and uses the default.
  crashTitle: { ar: "حدث خطأ غير متوقع", en: "Something went wrong" },
  crashBody: {
    ar: "خزنتك بخير — لم يُحفظ ولم يُحذف شيء بسبب هذا الخطأ.",
    en: "Your vault is fine — nothing was saved or deleted because of this.",
  },
  crashRetry: { ar: "حاول مرة أخرى", en: "Try again" },
} satisfies LabelSet<string>

export const TABS = {
  // Named for the question each answers, not for the domain noun. "الأصول"
  // (assets) is what the app stores; "الخزنة" (the vault) is what the owner
  // thinks they have.
  //
  // The third tab names the one thing it manages: the people who receive.
  home: { ar: "الرئيسية", en: "Home" },
  assets: { ar: "الخزنة", en: "Vault" },
  executors: { ar: "الأوصياء", en: "Executors" },
  settings: { ar: "حسابي", en: "Account" },
} satisfies LabelSet<string>
