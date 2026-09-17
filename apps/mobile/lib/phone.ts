/**
 * Mobile-number validation, per country. ٥.٢: *"Contact is what the release
 * chain uses; validate it hard."* A wrong digit is discovered at the one moment
 * nobody can ask the owner to correct it.
 *
 * Length-and-prefix only, deliberately: there is no way to confirm a number is
 * *reachable* without sending to it, and full E.164 parsing would mean a
 * metadata library an order of magnitude larger than this file. What it catches
 * is the class of errors people actually make — a local 0 left on the front, a
 * country code typed twice, too few or too many digits.
 *
 * Country is a parameter, never a branch — the same rule as the IBAN table.
 */
/** National-number length and valid first digits, after any trunk 0. */
const RULES: Record<string, { dial: string; length: number; prefixes: string[] }> = {
  SA: { dial: "966", length: 9, prefixes: ["5"] },
  AE: { dial: "971", length: 9, prefixes: ["5"] },
  EG: { dial: "20", length: 10, prefixes: ["1"] },
  DZ: { dial: "213", length: 9, prefixes: ["5", "6", "7"] },
  JO: { dial: "962", length: 9, prefixes: ["7"] },
  QA: { dial: "974", length: 8, prefixes: ["3", "5", "6", "7"] },
  KW: { dial: "965", length: 8, prefixes: ["5", "6", "9"] },
  BH: { dial: "973", length: 8, prefixes: ["3"] },
  OM: { dial: "968", length: 8, prefixes: ["7", "9"] },
  MA: { dial: "212", length: 9, prefixes: ["6", "7"] },
  TN: { dial: "216", length: 8, prefixes: ["2", "4", "5", "9"] },
  GB: { dial: "44", length: 10, prefixes: ["7"] },
}

export type PhoneCheck =
  | { status: "valid"; e164: string }
  | { status: "empty" }
  | { status: "invalid" }
  /** No rule on record; the number is kept as typed rather than rejected. */
  | { status: "unknownCountry"; e164: string }

export function dialCode(country: string): string | null {
  return RULES[country.toUpperCase()]?.dial ?? null
}

/**
 * Reduce what was typed to a national number.
 *
 * Handles the three things people paste: a leading `+`, the country's own dial
 * code repeated in the field, and a trunk `0` that is correct locally and wrong
 * internationally. Dropping the trunk zero is the one transformation that
 * silently *fixes* a number rather than rejecting it, which is right — every
 * national format in this table writes it and no international format keeps it.
 */
export function nationalDigits(input: string, country: string): string {
  let digits = input.replace(/[^\d]/g, "")
  const dial = RULES[country.toUpperCase()]?.dial
  if (dial !== undefined && digits.startsWith(dial)) {
    digits = digits.slice(dial.length)
  }
  return digits.replace(/^0+/, "")
}

export function checkPhone(input: string, country: string): PhoneCheck {
  const digits = nationalDigits(input, country)
  if (digits.length === 0) return { status: "empty" }

  const rule = RULES[country.toUpperCase()]
  if (rule === undefined) {
    return { status: "unknownCountry", e164: `+${input.replace(/[^\d]/g, "")}` }
  }
  const ok =
    digits.length === rule.length &&
    rule.prefixes.some((prefix) => digits.startsWith(prefix))
  return ok
    ? { status: "valid", e164: `+${rule.dial}${digits}` }
    : { status: "invalid" }
}
