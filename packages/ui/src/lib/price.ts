/**
 * A plan price, from `planPrices`' integer minor units, as the console and
 * wassiya.app both print it — one implementation, so the two cannot disagree.
 *
 * A currency's decimals and symbol come from `Intl`, so a new currency needs no
 * code. Arabic digits are mapped rather than requested from ICU, for the reason
 * in `format-ar.ts`.
 */
import { toArabicDigits } from "./format-ar"

type Locale = "ar" | "en"

/** How many decimals a currency has: 2 for SAR, 3 for KWD, 0 for JPY. */
export function currencyDigits(currency: string): number {
  return (
    new Intl.NumberFormat("en", { style: "currency", currency }).resolvedOptions()
      .maximumFractionDigits ?? 2
  )
}

export function fmtPrice(amountMinor: number, currency: string, locale: Locale): string {
  const digits = currencyDigits(currency)
  const value = amountMinor / 10 ** digits
  if (locale === "en") {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(value)
  }
  const number = toArabicDigits(
    new Intl.NumberFormat("en-US", {
      minimumFractionDigits: digits,
      maximumFractionDigits: digits,
    }).format(value)
  )
    .replace(/,/g, "٬")
    .replace(".", "٫")
  const symbol =
    new Intl.NumberFormat("ar", { style: "currency", currency, currencyDisplay: "narrowSymbol" })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency
  // CLDR writes "ر.س." with a trailing dot and bidi marks around it.
  return `${number} ${symbol.replace(/[‎‏؜]/g, "").replace(/\.$/, "")}`
}

/**
 * What an operator types ("379.99", "٣٧٩٫٩٩", "1,299") as minor units, or `null`
 * when it is not a positive price in this currency — including one with more
 * decimals than the currency has.
 */
export function parsePrice(input: string, currency: string): number | null {
  const latin = input
    .trim()
    .replace(/[٠-٩]/g, (digit) => String(digit.charCodeAt(0) - 0x0660))
    .replace(/٫/g, ".")
    .replace(/[,٬\s]/g, "")
  const match = /^(\d+)(?:\.(\d+))?$/.exec(latin)
  if (match === null) {
    return null
  }
  const digits = currencyDigits(currency)
  const fraction = match[2] ?? ""
  if (fraction.length > digits) {
    return null
  }
  const minor = Number(match[1]) * 10 ** digits + Number(fraction.padEnd(digits, "0") || "0")
  return Number.isSafeInteger(minor) && minor > 0 ? minor : null
}
