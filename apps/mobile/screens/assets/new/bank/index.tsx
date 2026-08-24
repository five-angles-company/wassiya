/**
 * ٤.٤ — a bank account.
 *
 * One parameterised form, never a per-country screen: the selected country
 * drives the IBAN length and nothing else changes. The mod-97 checksum is
 * verified locally before saving, for the same reason 4.3 verifies BIP-39 — an
 * heir who finds a wrong IBAN cannot ask what it should have been.
 *
 * The IBAN is the only field here rendered LTR-isolated. It is a machine
 * string that gets read out and typed into a bank's form, and Arabic-Indic
 * shaping on it has caused real mis-transcription.
 */
import { useState } from "react"
import { Text } from "@workspace/ui-native/components/ui/text"
import { SheetSelect } from "@workspace/ui-native/components/wassiya/sheet-select"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { View } from "react-native"

import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import { COUNTRIES, findCountry } from "@/lib/countries"
import { checkIban, groupIban, normalizeIban } from "@/lib/iban"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

export function NewBankScreen() {
  const { t, locale } = useStrings("assets/new/bank")
  const { t: chrome } = useStrings("assets/new")
  const { submit, submitting, error } = useAssetSubmit()

  const [country, setCountry] = useState("SA")
  const [bank, setBank] = useState("")
  const [iban, setIban] = useState("")
  const [accountType, setAccountType] = useState("current")
  const [branch, setBranch] = useState("")
  const [instructions, setInstructions] = useState("")

  const check = checkIban(iban, country)
  const selectedCountry = findCountry(country)

  async function save() {
    if (check.status !== "valid") return
    const clean = normalizeIban(iban)
    const saved = await submit({
      type: "bank",
      label: {
        title: bank.trim(),
        // The masked tail is what 4.1 shows — enough to recognise the account,
        // not enough to be the account.
        subtitle: `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`,
      },
      secret: JSON.stringify({
        bank: bank.trim(),
        iban: clean,
        country,
        accountType,
        currency: selectedCountry?.currency ?? "",
        branch: branch.trim(),
        instructions: instructions.trim(),
      }),
      meta: {},
    })
    if (saved) router.back()
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={bank.trim().length > 0 && check.status === "valid"}
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="gap-4">
        <SheetSelect
          label={t.countryLabel}
          value={country}
          onChange={setCountry}
          options={COUNTRIES.map((c) => ({
            value: c.code,
            label: c.name[locale],
          }))}
        />

        {/* Free text rather than a picker: the board asks for a per-country
            bank lookup "with free-text fallback", and a list that silently
            omits someone's bank is worse than no list at all. The lookup is
            the part still missing, not the ability to type. */}
        <Field
          label={t.bankLabel}
          placeholder={t.bankPlaceholder}
          value={bank}
          onChangeText={setBank}
        />

        <Field
          label={t.ibanLabel}
          value={groupIban(iban)}
          onChangeText={setIban}
          autoCapitalize="characters"
          autoCorrect={false}
          // Latin digits, left-to-right, in an otherwise mirrored screen.
          className="text-left"
          hint={
            check.status === "valid"
              ? t.ibanValid.replace(
                  "{n}",
                  fmtNum(normalizeIban(iban).length, locale)
                )
              : undefined
          }
          error={ibanError(check, t, locale, selectedCountry?.name[locale])}
        />

        <OptionChips
          label={t.accountTypeLabel}
          options={[
            { value: "current", label: t.accountCurrent },
            { value: "savings", label: t.accountSavings },
          ]}
          value={accountType}
          onChange={setAccountType}
        />

        <Field
          label={t.branchLabel}
          placeholder={t.branchPlaceholder}
          value={branch}
          onChangeText={setBranch}
        />

        <Field
          label={t.instructionsLabel}
          placeholder={t.instructionsPlaceholder}
          value={instructions}
          onChangeText={setInstructions}
          multiline
          className="h-auto min-h-24 py-3"
        />

        <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
          {chrome.encryptNote}
        </Text>

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800">
            {error}
          </Text>
        ) : null}
      </View>
    </WizardFrame>
  )
}

function ibanError(
  check: ReturnType<typeof checkIban>,
  t: Record<string, string>,
  locale: "ar" | "en",
  countryName: string | undefined
): string | undefined {
  // `unknownCountry` groups with the silent cases deliberately: no length on
  // record is not the user's problem, the checksum still passed, and
  // complaining would block a legitimate account in an unlisted market.
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
