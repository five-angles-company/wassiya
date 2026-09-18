/**
 * Arabic counted nouns. Four CLDR categories matter for anything this app
 * counts:
 *
 *   1        singular       مستلم        · أصل
 *   2        dual           مستلمان      · أصلان
 *   3–10     plural         ٣ مستلمين    · ٣ أصول
 *   11+      singular again ٤٣ مستلماً   · ٤٣ أصلاً   (accusative)
 *
 * A naive `${n} ${n === 1 ? one : many}` produces "٤٣ أصول", which reads to an
 * Arabic speaker exactly the way "43 asset" reads in English — and the design
 * writes "٤٣ أصلاً" on the first screen that counts anything.
 *
 * `zero` is separate from the grammar: Arabic would say "٠ أصول", but every
 * place this app counts something has a better sentence for none of it
 * ("بلا مستلم", "خزنتك فارغة"), so callers supply it as its own form.
 *
 * English collapses to zero/one/other, and the same table serves both.
 */
import type { Locale } from "@workspace/ui-native/lib/labels"

export type PluralCategory = "zero" | "one" | "two" | "few" | "many"

/** The five forms a counted noun needs. `{n}` is replaced with the number. */
export type CountForms = Record<PluralCategory, string>

export function pluralCategory(count: number, locale: Locale): PluralCategory {
  const n = Math.abs(Math.trunc(count))
  if (n === 0) return "zero"
  if (locale === "en") return n === 1 ? "one" : "many"
  if (n === 1) return "one"
  if (n === 2) return "two"
  // 103 behaves like 3 — the rule is on the last two digits, not the value.
  const mod100 = n % 100
  return mod100 >= 3 && mod100 <= 10 ? "few" : "many"
}

/**
 * Pick the right form and substitute the number, already shaped for the locale.
 *
 * @param formatted the count as it should appear — pass `fmtNum(n, locale)` so
 *   Arabic gets ٤٣ rather than 43. Kept as a parameter rather than called here
 *   so this module stays free of formatting policy.
 */
export function fmtCount(
  count: number,
  formatted: string,
  forms: CountForms,
  locale: Locale
): string {
  return forms[pluralCategory(count, locale)].replace("{n}", formatted)
}
