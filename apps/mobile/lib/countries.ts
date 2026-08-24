/**
 * The country parameter.
 *
 * Country is a parameter, never a branch — there is no Saudi code path and a
 * rest-of-world code path. It drives which identity documents 2.1 lists, and
 * later the IBAN format, currency and bank suggestions. Saudi Arabia is the
 * launch market so it leads the list; the rest follow alphabetically by their
 * Arabic name, which is the order an Arabic-first user scans in.
 *
 * `documents` is the human sentence 2.1 shows, not a machine list: Didit
 * decides what it will actually accept, and promising a document the provider
 * rejects would be worse than being slightly general.
 */
import type { Bilingual } from "@workspace/ui-native/lib/labels"

export type Country = {
  /** ISO 3166-1 alpha-2, exactly as `users.country` stores it. */
  code: string
  name: Bilingual
  /** ISO 4217, for the subscription and asset screens later. */
  currency: string
  documents: Bilingual
}

const RESIDENT_AND_CITIZEN: Bilingual = {
  ar: "الهوية الوطنية أو الإقامة أو جواز السفر",
  en: "National ID, iqama or passport",
}

const ID_OR_PASSPORT: Bilingual = {
  ar: "الهوية الوطنية أو جواز السفر",
  en: "National ID or passport",
}

export const COUNTRIES: readonly Country[] = [
  {
    code: "SA",
    name: { ar: "السعودية", en: "Saudi Arabia" },
    currency: "SAR",
    documents: RESIDENT_AND_CITIZEN,
  },
  {
    code: "AE",
    name: { ar: "الإمارات", en: "United Arab Emirates" },
    currency: "AED",
    documents: RESIDENT_AND_CITIZEN,
  },
  {
    code: "BH",
    name: { ar: "البحرين", en: "Bahrain" },
    currency: "BHD",
    documents: ID_OR_PASSPORT,
  },
  {
    code: "DZ",
    name: { ar: "الجزائر", en: "Algeria" },
    currency: "DZD",
    documents: ID_OR_PASSPORT,
  },
  {
    code: "JO",
    name: { ar: "الأردن", en: "Jordan" },
    currency: "JOD",
    documents: ID_OR_PASSPORT,
  },
  {
    code: "KW",
    name: { ar: "الكويت", en: "Kuwait" },
    currency: "KWD",
    documents: RESIDENT_AND_CITIZEN,
  },
  {
    code: "OM",
    name: { ar: "عُمان", en: "Oman" },
    currency: "OMR",
    documents: RESIDENT_AND_CITIZEN,
  },
  {
    code: "QA",
    name: { ar: "قطر", en: "Qatar" },
    currency: "QAR",
    documents: RESIDENT_AND_CITIZEN,
  },
  {
    code: "EG",
    name: { ar: "مصر", en: "Egypt" },
    currency: "EGP",
    documents: ID_OR_PASSPORT,
  },
  {
    code: "MA",
    name: { ar: "المغرب", en: "Morocco" },
    currency: "MAD",
    documents: ID_OR_PASSPORT,
  },
] as const

export const DEFAULT_COUNTRY = "SA"

export function findCountry(code: string | null | undefined): Country | null {
  if (code === null || code === undefined) return null
  return COUNTRIES.find((country) => country.code === code) ?? null
}
