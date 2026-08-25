/**
 * Copy shared across screens, plus the stubbed tab shell.
 *
 * `stepOf` is the section ٢ progress meter: four steps, and the board renders
 * it "١ من ٤" in Arabic — Eastern Arabic-Indic numerals, so the numbers go
 * through `fmtNum` at the call site rather than being baked in here.
 */
import type { LabelSet } from "@workspace/ui-native/lib/labels"

export const COMMON = {
  back: { ar: "رجوع", en: "Back" },
  cancel: { ar: "إلغاء", en: "Cancel" },
  continue: { ar: "متابعة", en: "Continue" },
  retry: { ar: "حاول مرة أخرى", en: "Try again" },
  stepSeparator: { ar: "من", en: "of" },
  loading: { ar: "لحظة…", en: "One moment…" },
  genericError: {
    ar: "حدث خطأ غير متوقع. حاول مرة أخرى.",
    en: "Something went wrong. Please try again.",
  },
  // The OS biometric sheet's own message, so it says why the vault is asking
  // rather than leaving the system default to. Distinct from `setup.prompt`,
  // which is the one-time key *creation* prompt in section ٢.
  unlockPrompt: {
    ar: "افتح خزنتك لعرض أصولك",
    en: "Unlock your vault to see your assets",
  },
} satisfies LabelSet<string>

// Five tabs, in the board's own order — 4.1's screenshot shows the bar this
// app shipped four of. `will` is the section ٥ tab: the board labels it
// الوصيّة (the will) even though the list inside it is الورثة (the heirs), so
// the route, the key and the label all say "will" and the screen inside keeps
// its own name.
export const TABS = {
  // Named for the question each answers, not for the domain noun. "الأصول"
  // (assets) is what the app stores; "الخزنة" (the vault) is what the owner
  // thinks they have. "خطتي" replaces "الوصيّة" because the tab holds people —
  // heirs, routing, the guardian — not a legal document.
  home: { ar: "الرئيسية", en: "Home" },
  assets: { ar: "الخزنة", en: "Vault" },
  plan: { ar: "خطتي", en: "My plan" },
  settings: { ar: "حسابي", en: "Account" },
  placeholderTitle: { ar: "قريباً", en: "Coming next" },
  placeholderBody: {
    ar: "هذه الشاشة تُبنى في المرحلة التالية. خزنتك جاهزة وآمنة في هذه الأثناء.",
    en: "This screen arrives in the next stage. Your vault is set up and safe in the meantime.",
  },
} satisfies LabelSet<string>
