import { fmtDate } from "@/lib/format"
import type { Locale } from "@/lib/i18n/locale"

/** Didit's "YYYY-MM-DD", read at noon UTC so no browser time zone moves it a day. */
export function fmtBirthDate(value: string, locale: Locale): string {
  const [year, month, day] = value.split("-").map(Number)
  return fmtDate(Date.UTC(year ?? 1970, (month ?? 1) - 1, day ?? 1, 12), locale)
}
