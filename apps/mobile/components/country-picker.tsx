import type { Locale } from "@workspace/ui-native/lib/labels"
import { SheetSelect } from "@workspace/ui-native/components/wassiya/sheet-select"

import { COUNTRIES } from "@/lib/countries"

export type CountryPickerProps = {
  label: string
  value: string
  onChange: (code: string) => void
  hint?: string
  locale?: Locale
  className?: string
}

/**
 * The country parameter, as a field.
 *
 * Not a dial-code picker: this account is email-based, so the country is here
 * because it decides which identity documents 2.1 lists and, later, the IBAN
 * format and currency. Saudi Arabia leads the list as the launch market.
 *
 * All this owns now is the country list and its locale; the field, the sheet
 * and the selected-check belong to `SheetSelect`. It used to hand-roll a
 * `Modal` with a scrim, a rounded top, a drawn grabber pill and a `max-h-[70%]`
 * guess, because the shared `Select` teleports through `PortalHost` and broke
 * when the setup gate replaced the screen underneath it. A native sheet has no
 * such problem, and drags and dismisses the way it is drawn.
 */
export function CountryPicker({
  label,
  value,
  onChange,
  hint,
  locale = "ar",
  className,
}: CountryPickerProps) {
  return (
    <SheetSelect
      label={label}
      value={value === "" ? null : value}
      onChange={onChange}
      hint={hint}
      className={className}
      options={COUNTRIES.map((country) => ({
        value: country.code,
        label: country.name[locale],
      }))}
    />
  )
}
