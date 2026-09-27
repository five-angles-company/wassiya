import { fmtNumber } from "@/lib/format"
import type { Locale } from "@/lib/i18n/locale"

/**
 * A count inside a sentence, in the grammatical number its language needs.
 *
 * Arabic has six plural categories, and one and two are written as word forms
 * ("عنصر واحد", "عنصران") rather than digits — `{n} عنصراً` is right only for
 * 11–99. `Intl.PluralRules` picks the category; every form is written out by
 * hand, and `other` is the fallback for any category a set leaves out.
 */
export type PluralForms = Partial<Record<Intl.LDMLPluralRule, string>> & {
  other: string
}

export type PluralSet = { ar: PluralForms; en: PluralForms }

export function plural(set: PluralSet, count: number, locale: Locale): string {
  const forms = set[locale]
  const form = forms[new Intl.PluralRules(locale).select(count)] ?? forms.other
  return form.replace("{n}", fmtNumber(count, locale))
}
