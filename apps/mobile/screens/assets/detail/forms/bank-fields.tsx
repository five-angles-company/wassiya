import { useState } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChoiceField } from "@workspace/ui-native/components/wassiya/choice-field"
import { FieldCell } from "@workspace/ui-native/components/wassiya/field-cell"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { monoFont } from "@workspace/ui-native/lib/fonts"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { cn } from "@workspace/ui-native/lib/utils"
import * as Clipboard from "expo-clipboard"
import { Check, Copy } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { COUNTRIES } from "@/lib/countries"
import { checkIban, groupIban, normalizeIban, type IbanCheck } from "@/lib/iban"
import type { BankForm } from "@/screens/assets/detail/forms/bank"

/**
 * ٤.٤'s fields, as the board draws them on ١٥.
 *
 * **Nothing here is masked, and the IBAN can be copied.** A bank account has no
 * password; the IBAN is printed on statements and handed out to receive money,
 * so masking it would make the one value an heir has to transcribe the hardest
 * one to read — and buy nothing, since its tail already shows unmasked in the
 * vault list. It gets a copy affordance instead, mono, LTR, in four-character
 * groups: the form it has to be transcribed in.
 *
 * The currency is derived from the country and reads at 55%, so nobody taps it
 * expecting a keyboard.
 *
 * A short IBAN is a counter, not an error — the line counts characters while the
 * number is being typed and only becomes a verdict once it is long enough.
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

type Key = "iban" | "bank" | "branch" | "instructions"

export function BankFields({
  value,
  onChange,
  labels,
  bank,
  locale,
}: BankFieldsProps) {
  const [focused, setFocused] = useState<Key | null>(null)
  const [copied, setCopied] = useState(false)

  const check = checkIban(value.iban, value.country)
  const country = COUNTRIES.find((c) => c.code === value.country) ?? null

  const state = (key: Key) => ({
    active: focused === key,
    dimmed: focused !== null && focused !== key,
  })
  const bind = (key: Key) => ({
    onFocus: () => setFocused(key),
    onBlur: () => setFocused((current) => (current === key ? null : current)),
  })

  async function copy() {
    await Clipboard.setStringAsync(normalizeIban(value.iban))
    setCopied(true)
  }

  return (
    <>
      <FieldRow label={bank.bankLabel!} divider {...state("bank")}>
        <FieldValue
          value={value.bank}
          onChangeText={(next) => onChange({ bank: next })}
          {...bind("bank")}
        />
      </FieldRow>

      <FieldRow
        label={labels.fieldIban!}
        divider
        trailing={
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={labels.copyIban!}
            onPress={() => void copy()}
            hitSlop={10}
            className="shrink-0"
          >
            <Icon
              as={copied ? Check : Copy}
              size={18}
              strokeWidth={2.75}
              className={copied ? "text-olive-700" : "text-foreground opacity-45"}
            />
          </Pressable>
        }
        {...state("iban")}
      >
        <FieldValue
          value={groupIban(value.iban)}
          onChangeText={(next) => {
            setCopied(false)
            onChange({ iban: next })
          }}
          autoCapitalize="characters"
          autoCorrect={false}
          ltr
          className={cn(monoFont, "text-[15px] tracking-[0.75px]")}
          {...bind("iban")}
        />
      </FieldRow>

      {/* The quiet olive verdict, or a count while it is still too short. */}
      <Text
        className={cn(
          "mb-1 text-[11.5px] leading-[1.6]",
          check.status === "valid" ? "text-olive-700" : "text-terracotta-800"
        )}
      >
        {ibanLine(check, value.iban, bank, labels, locale, country?.name[locale])}
      </Text>

      <View className="bg-border h-px" />

      <View className="flex-row gap-[18px] py-[13px]">
        <FieldCell
          label={labels.fieldAccountType!}
          value={
            value.accountType === "savings"
              ? bank.accountSavings!
              : bank.accountCurrent!
          }
        />
        <FieldCell
          label={labels.fieldCurrency!}
          value={country?.currency ?? ""}
          dim
          ltr
        />
        <FieldCell label={labels.fieldBranch!} value={value.branch} />
      </View>

      <View className="bg-border h-px" />

      <FieldRow label={bank.countryLabel!} divider>
        <ChoiceField
          label={bank.countryLabel!}
          value={value.country}
          onChange={(next) => onChange({ country: next })}
          options={COUNTRIES.map((c) => ({ value: c.code, label: c.name[locale] }))}
        />
      </FieldRow>

      <FieldRow
        label={labels.fieldInstructions!}
        {...state("instructions")}
      >
        <FieldValue
          prose
          value={value.instructions}
          onChangeText={(next) => onChange({ instructions: next })}
          placeholder={bank.instructionsPlaceholder}
          {...bind("instructions")}
        />
      </FieldRow>
    </>
  )
}

/**
 * The line under the IBAN. A count while it is short, a verdict once it is not.
 *
 * `unknownCountry` says nothing at all: no length on record is not the owner's
 * problem, the checksum still passed, and complaining would block a legitimate
 * account in an unlisted market.
 */
function ibanLine(
  check: IbanCheck,
  raw: string,
  t: Record<string, string>,
  labels: Record<string, string>,
  locale: Locale,
  countryName: string | undefined
): string {
  switch (check.status) {
    case "valid":
      return t.ibanValid!.replace(
        "{n}",
        fmtNum(normalizeIban(raw).length, locale)
      )
    case "empty":
    case "unknownCountry":
      return ""
    case "wrongCountry":
      return t.ibanWrongCountry!
        .replace("{prefix}", check.prefix)
        .replace("{country}", countryName ?? "")
    case "badLength":
      // Short is a counter, not an error — until it is longer than it should be.
      return check.actual < check.expected
        ? labels.ibanCounting!
            .replace("{n}", fmtNum(check.actual, locale))
            .replace("{total}", fmtNum(check.expected, locale))
        : t.ibanBadLength!
            .replace("{country}", countryName ?? "")
            .replace("{n}", fmtNum(check.expected, locale))
            .replace("{have}", fmtNum(check.actual, locale))
    case "badChecksum":
      return t.ibanBadChecksum!
  }
}
