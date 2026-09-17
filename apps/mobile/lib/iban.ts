/**
 * IBAN validation — length by country, then the ISO 13616 mod-97 checksum. ٤.٤:
 * *"a wrong IBAN discovered by an heir is unrecoverable"*, and the person who
 * would notice the mistake will not be around to be asked. mod-97 is what makes
 * a single mistyped or transposed digit detectable, and both are what people
 * actually do copying 24 characters off a statement.
 *
 * **Country is a parameter, never a branch.** The lengths below are data — no
 * Saudi code path, no rest-of-world code path — which is what lets one form
 * serve every launch market. Adding a country is one row here.
 */
/** IBAN length per ISO 13616, for the markets `lib/countries.ts` lists. */
export const IBAN_LENGTH: Record<string, number> = {
  SA: 24,
  AE: 23,
  EG: 29,
  DZ: 24,
  JO: 30,
  QA: 29,
  KW: 30,
  BH: 22,
  OM: 23,
  MA: 28,
  TN: 24,
  GB: 22,
}

export type IbanCheck =
  | { status: "valid" }
  | { status: "empty" }
  /** Right country, wrong number of characters. */
  | { status: "badLength"; expected: number; actual: number }
  /** The country code typed into the IBAN is not the one selected. */
  | { status: "wrongCountry"; prefix: string }
  /** Correct shape, failed mod-97 — a typo or a transposition. */
  | { status: "badChecksum"}
  /** No length on record for this country; the checksum still applies. */
  | { status: "unknownCountry" }

/** Strip spaces and upper-case, which is how an IBAN is validated and stored. */
export function normalizeIban(input: string): string {
  return input.replace(/[\s-]/g, "").toUpperCase()
}

/** Conventional four-character grouping, for display only. */
export function groupIban(input: string): string {
  return normalizeIban(input).replace(/(.{4})(?=.)/g, "$1 ")
}

export function checkIban(input: string, country: string): IbanCheck {
  const iban = normalizeIban(input)
  if (iban.length === 0) return { status: "empty" }

  const prefix = iban.slice(0, 2)
  if (/^[A-Z]{2}$/.test(prefix) && prefix !== country.toUpperCase()) {
    // Reported before length: "you pasted an AE IBAN into a Saudi account" is
    // the actual mistake, and the length complaint would be a symptom of it.
    return { status: "wrongCountry", prefix }
  }

  const expected = IBAN_LENGTH[country.toUpperCase()]
  if (expected === undefined) {
    return mod97(iban) ? { status: "valid" } : { status: "unknownCountry" }
  }
  if (iban.length !== expected) {
    return { status: "badLength", expected, actual: iban.length }
  }
  return mod97(iban) ? { status: "valid" } : { status: "badChecksum" }
}

/**
 * ISO 7064 mod-97-10: move the first four characters to the end, map letters to
 * two-digit numbers (A=10 … Z=35), and the whole thing read as an integer must
 * be ≡ 1 (mod 97).
 *
 * Computed digit by digit rather than by building the full integer: a 30-char
 * IBAN expands to a ~60-digit number, far past `Number.MAX_SAFE_INTEGER`, and
 * the naive version silently returns a wrong answer for long IBANs rather than
 * failing — which here would mean accepting a bad one.
 */
function mod97(iban: string): boolean {
  if (!/^[A-Z0-9]+$/.test(iban) || iban.length < 5) return false
  const rearranged = iban.slice(4) + iban.slice(0, 4)

  let remainder = 0
  for (const char of rearranged) {
    const value =
      char >= "A" && char <= "Z"
        ? String(char.charCodeAt(0) - 55) // A → "10" … Z → "35"
        : char
    for (const digit of value) {
      remainder = (remainder * 10 + Number(digit)) % 97
    }
  }
  return remainder === 1
}
