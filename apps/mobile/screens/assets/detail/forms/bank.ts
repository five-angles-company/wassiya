/**
 * The bank-account payload, in both directions.
 *
 * `screens/assets/new/bank/index.tsx` is still the other writer; the JSON keys
 * and the label format below are copied from it verbatim and **must stay in
 * step** until it moves onto {@link toBankPayload}.
 *
 * ## The IBAN is held as typed and stored normalised
 *
 * The field displays `groupIban(...)` — four-character groups — because that is
 * how an IBAN is printed on a statement and how a person checks one against
 * paper. Storage gets `normalizeIban(...)`, spaces and dashes stripped, because
 * that is what an heir will paste into a bank form. The form holds the raw
 * keystrokes so a cursor does not jump while the grouping recomputes.
 *
 * ## The currency is derived, never typed
 *
 * It comes from the chosen country (`lib/countries.ts`), which is why changing
 * the country rewrites it. An owner cannot be asked to keep a country and its
 * currency consistent by hand.
 */
import { normalizeIban } from "@/lib/iban"
import { findCountry } from "@/lib/countries"
import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"

export type BankForm = {
  country: string
  bank: string
  /** As typed. `normalizeIban` runs at the boundary, not here. */
  iban: string
  accountType: string
  branch: string
  instructions: string
}

export function parseBank({ secret }: EditSource): BankForm | null {
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(secret)
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null
    }
    data = parsed as Record<string, unknown>
  } catch {
    return null
  }

  // An object with none of this type's fields is not this type's payload, and
  // an all-blank form over it would offer to overwrite an account with nothing.
  if (!("iban" in data) && !("bank" in data)) return null

  const str = (key: string): string =>
    typeof data[key] === "string" ? (data[key] as string) : ""

  return {
    country: str("country").length > 0 ? str("country") : "SA",
    bank: str("bank"),
    iban: str("iban"),
    accountType: str("accountType").length > 0 ? str("accountType") : "current",
    branch: str("branch"),
    instructions: str("instructions"),
  }
}

export function toBankPayload(form: BankForm): EditPayload {
  const clean = normalizeIban(form.iban)
  return {
    label: {
      title: form.bank.trim(),
      // The masked tail is what ٤.١ shows — enough to recognise the account,
      // not enough to be the account.
      subtitle: `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`,
    },
    secret: JSON.stringify({
      bank: form.bank.trim(),
      iban: clean,
      country: form.country,
      accountType: form.accountType,
      currency: findCountry(form.country)?.currency ?? "",
      branch: form.branch.trim(),
      instructions: form.instructions.trim(),
    }),
    meta: {},
  }
}
