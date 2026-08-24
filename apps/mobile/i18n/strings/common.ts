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
} satisfies LabelSet<string>

export const TABS = {
  home: { ar: "الرئيسية", en: "Home" },
  assets: { ar: "الأصول", en: "Assets" },
  heirs: { ar: "الورثة", en: "Heirs" },
  settings: { ar: "الإعدادات", en: "Settings" },
  placeholderTitle: { ar: "قريباً", en: "Coming next" },
  placeholderBody: {
    ar: "هذه الشاشة تُبنى في المرحلة التالية. خزنتك جاهزة وآمنة في هذه الأثناء.",
    en: "This screen arrives in the next stage. Your vault is set up and safe in the meantime.",
  },
} satisfies LabelSet<string>
