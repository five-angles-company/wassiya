import type { PluralSet } from "@/lib/i18n/plural"

/** Counts more than one feature says. Read through `plural`. */
export const ATTEMPTS_LEFT: PluralSet = {
  ar: {
    zero: "لم تبقَ أي محاولة",
    one: "بقيت محاولة واحدة",
    two: "بقيت محاولتان",
    few: "بقيت {n} محاولات",
    many: "بقيت {n} محاولة",
    other: "بقيت {n} محاولة",
  },
  en: { one: "1 attempt left", other: "{n} attempts left" },
}
