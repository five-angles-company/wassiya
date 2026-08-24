/**
 * Arabic numerals and dates for the claim funnel.
 *
 * A deliberate re-implementation of the two functions the funnel needs, rather
 * than importing `@workspace/ui-native/lib/format` — that package pulls in
 * React Native, which cannot be bundled into a Next.js server component. The
 * two reasons the mobile version gives for not just using `Intl` apply here
 * too, and are worth repeating because they are not obvious:
 *
 *  1. **Digits are mapped, not requested from ICU.** The `-u-nu-arab`
 *     numbering-system extension is not dependable across runtimes, so grouping
 *     comes from `Intl` and the digit shaping is applied afterwards. Identical
 *     output everywhere.
 *  2. **Dates are Gregorian by name.** `ar-SA` defaults to the Islamic calendar
 *     in CLDR, so `Intl.DateTimeFormat("ar-SA")` would silently render a Hijri
 *     date where the design shows ٣١ أغسطس ٢٠٢٦. Month names are table-driven.
 *
 * If a third surface ever needs these, they should move to a shared
 * platform-neutral package — not to `ui-native`.
 */

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"] as const

const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
] as const

/** Replace every Latin digit with its Eastern Arabic-Indic counterpart. */
export function toArabicDigits(value: string): string {
  return value.replace(/[0-9]/g, (digit) => ARABIC_INDIC[Number(digit)]!)
}

/** @example fmtArabicNumber(26) // '٢٦' */
export function fmtArabicNumber(value: number): string {
  return toArabicDigits(new Intl.NumberFormat("en-US").format(value)).replace(
    /,/g,
    "٬"
  )
}

/** @example fmtArabicDate(new Date(2026, 7, 31)) // '٣١ أغسطس ٢٠٢٦' */
export function fmtArabicDate(date: Date): string {
  const day = toArabicDigits(String(date.getDate()))
  const year = toArabicDigits(String(date.getFullYear()))
  return `${day} ${AR_MONTHS[date.getMonth()]} ${year}`
}
