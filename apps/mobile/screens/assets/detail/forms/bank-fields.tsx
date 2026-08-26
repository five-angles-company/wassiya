import { ChoiceRow } from "@workspace/ui-native/components/wassiya/choice-row"
import { EditableRow } from "@workspace/ui-native/components/wassiya/editable-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"

import { COUNTRIES } from "@/lib/countries"
import { checkIban, groupIban, type IbanCheck } from "@/lib/iban"
import type { BankForm } from "@/screens/assets/detail/forms/bank"

/**
 * ٤.٤'s fields, as rows.
 *
 * ## Nothing here is masked
 *
 * A bank account has no password. An IBAN is printed on statements and given
 * out to receive money — masking it would make the one field an heir has to
 * transcribe the hardest one to read, and buy nothing, because the tail already
 * appears unmasked in the vault list. It is `mono` instead, which is the
 * protection that actually matters: it gets copied character by character, and
 * a reshaped digit is how a family loses an account.
 *
 * ## The IBAN validates as it is typed
 *
 * Same `checkIban` the wizard uses — country prefix, then per-market length,
 * then ISO 7064 mod-97. An owner correcting a digit sees the error clear on the
 * keystroke that fixes it, and `canSave` is gated on the same verdict, so an
 * IBAN that cannot be a real one cannot be saved over one that was.
 */
export type BankFieldsProps = {
  value: BankForm
  onChange: (patch: Partial<BankForm>) => void
  /** The `assets/detail` dictionary. */
  labels: Record<string, string>
  /** The `assets/new/bank` dictionary — its labels and IBAN copy. */
  bank: Record<string, string>
  locale: Locale
}

export function BankFields({
  value,
  onChange,
  labels,
  bank,
  locale,
}: BankFieldsProps) {
  const check = checkIban(value.iban, value.country)
  const country = COUNTRIES.find((c) => c.code === value.country) ?? null

  return (
    <>
      <ChoiceRow
        label={bank.countryLabel!}
        value={value.country}
        onChange={(country) => onChange({ country })}
        options={COUNTRIES.map((c) => ({
          value: c.code,
          label: c.name[locale],
        }))}
        divider
      />
      <EditableRow
        label={labels.fieldBank!}
        value={value.bank}
        onChangeText={(bank) => onChange({ bank })}
        divider
      />
      {/* Displayed grouped, stored normalised — see `toBankPayload`. The raw
          keystrokes stay in state so the cursor does not jump on regrouping. */}
      <EditableRow
        label={labels.fieldIban!}
        value={groupIban(value.iban)}
        onChangeText={(iban) => onChange({ iban })}
        autoCapitalize="characters"
        autoCorrect={false}
        mono
        error={ibanError(check, bank, locale, country?.name[locale])}
        divider
      />
      <ChoiceRow
        label={labels.fieldAccountType!}
        value={value.accountType}
        onChange={(accountType) => onChange({ accountType })}
        options={[
          { value: "current", label: bank.accountCurrent! },
          { value: "savings", label: bank.accountSavings! },
        ]}
        divider
      />
      {/* Derived from the country, so it is shown and not asked for. An owner
          cannot be made responsible for keeping the two consistent. */}
      <EditableRow
        label={labels.fieldCurrency!}
        value={country?.currency ?? ""}
        onChangeText={() => undefined}
        readOnly
        mono
        divider
      />
      <EditableRow
        label={labels.fieldBranch!}
        value={value.branch}
        onChangeText={(branch) => onChange({ branch })}
        placeholder={bank.branchPlaceholder}
        divider
      />
      <EditableRow
        label={labels.fieldInstructions!}
        value={value.instructions}
        onChangeText={(instructions) => onChange({ instructions })}
        placeholder={bank.instructionsPlaceholder}
        expand
        summary={value.instructions.length > 0 ? value.instructions : "—"}
      />
    </>
  )
}

/**
 * The wizard's own formatter, kept identical.
 *
 * `unknownCountry` groups with the silent cases deliberately: no length on
 * record is not the owner's problem, the checksum still passed, and complaining
 * would block a legitimate account in an unlisted market.
 */
function ibanError(
  check: IbanCheck,
  t: Record<string, string>,
  locale: Locale,
  countryName: string | undefined
): string | undefined {
  switch (check.status) {
    case "valid":
    case "empty":
    case "unknownCountry":
      return undefined
    case "wrongCountry":
      return t.ibanWrongCountry!
        .replace("{prefix}", check.prefix)
        .replace("{country}", countryName ?? "")
    case "badLength":
      return t.ibanBadLength!
        .replace("{country}", countryName ?? "")
        .replace("{n}", fmtNum(check.expected, locale))
        .replace("{have}", fmtNum(check.actual, locale))
    case "badChecksum":
      return t.ibanBadChecksum
  }
}
