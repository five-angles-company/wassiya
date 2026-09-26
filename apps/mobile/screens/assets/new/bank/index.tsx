/**
 * ٤.٤ — a bank account.
 *
 * Country comes first because it parameterises everything under it: IBAN length
 * and mask, the currency, and which checksum rules apply. The currency is
 * derived and never typed — an owner cannot be made responsible for keeping a
 * country and its currency consistent by hand.
 *
 * A short IBAN is a counter, not an error. The line counts characters while the
 * number is still being written and only becomes a terracotta verdict once it is
 * long enough to judge.
 */
import { useState } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"
import { ChoiceField } from "@workspace/ui-native/components/wassiya/choice-field"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { monoFont } from "@workspace/ui-native/lib/fonts"
import { cn } from "@workspace/ui-native/lib/utils"
import { Check } from "lucide-react-native"
import { router } from "expo-router"
import { View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { COUNTRIES, DEFAULT_COUNTRY, findCountry } from "@/lib/countries"
import { checkIban, groupIban, normalizeIban } from "@/lib/iban"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

export function NewBankScreen() {
  const { t, locale } = useStrings("assets/new/bank")
  const { t: detail } = useStrings("assets/detail")
  const { submit, submitting, error } = useAssetSubmit()

  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [bank, setBank] = useState("")
  const [iban, setIban] = useState("")
  const [accountType, setAccountType] = useState("current")
  const [branch, setBranch] = useState("")
  const [instructions, setInstructions] = useState("")
  const [focused, setFocused] = useState<string | null>(null)

  const check = checkIban(iban, country)
  const selected = findCountry(country)
  const num = (n: number) => fmtNum(n, locale)

  const bind = (key: string) => ({
    onFocus: () => setFocused(key),
    onBlur: () => setFocused((current) => (current === key ? null : current)),
  })
  const state = (key: string) => ({
    active: focused === key,
    dimmed: focused !== null && focused !== key,
  })

  async function save() {
    if (check.status !== "valid") return
    const clean = normalizeIban(iban)
    const saved = await submit({
      type: "bank",
      label: {
        title: bank.trim(),
        // The masked tail is what ٤.١ shows — enough to recognise the account,
        // not enough to be the account.
        subtitle: `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`,
      },
      secret: JSON.stringify({
        bank: bank.trim(),
        iban: clean,
        country,
        accountType,
        currency: selected?.currency ?? "",
        branch: branch.trim(),
        instructions: instructions.trim(),
      }),
      meta: {},
    })
    if (saved) {
      router.replace({
        pathname: "/assets/[id]",
        params: { id: saved },
      })
    }
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={bank.trim().length > 0 && check.status === "valid"}
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="mb-auto">
        <FieldRow label={t.countryLabel!} divider>
          <ChoiceField
            label={t.countryLabel!}
            value={country}
            onChange={setCountry}
            options={COUNTRIES.map((c) => ({
              value: c.code,
              label: c.name[locale],
            }))}
          />
        </FieldRow>

        <FieldRow label={t.bankLabel!} divider {...state("bank")}>
          <FieldValue
            value={bank}
            onChangeText={setBank}
            placeholder={t.bankPlaceholder}
            {...bind("bank")}
          />
        </FieldRow>

        <FieldRow label={t.ibanLabel!} {...state("iban")}>
          <FieldValue
            value={groupIban(iban)}
            onChangeText={setIban}
            autoCapitalize="characters"
            autoCorrect={false}
            ltr
            className={cn(monoFont, "text-[15px] tracking-[0.75px]")}
            {...bind("iban")}
          />
        </FieldRow>

        {/* The quiet olive verdict, or a count while it is still short. */}
        <View className="mb-3 flex-row items-center gap-2">
          {check.status === "valid" ? (
            <Icon
              as={Check}
              size={14}
              strokeWidth={2.75}
              className="text-olive-700 shrink-0"
            />
          ) : null}
          <Text
            className={cn(
              "flex-1 text-[12px] leading-[1.6]",
              check.status === "valid" ? "text-olive-700" : "text-terracotta-800"
            )}
          >
            {ibanLine()}
          </Text>
        </View>

        <View className="bg-border h-px" />

        <View className="flex-row gap-[18px] py-[13px]">
          <View className="min-w-0 flex-1">
            <Text className="mb-1.5 text-[12px] opacity-50">
              {t.accountTypeLabel}
            </Text>
            <ChipRow
              options={[
                { value: "current", label: t.accountCurrent! },
                { value: "savings", label: t.accountSavings! },
              ]}
              value={accountType}
              onChange={setAccountType}
            />
          </View>
          <View className="w-16 shrink-0">
            <Text className="mb-1.5 text-[12px] opacity-50">
              {t.currencyLabel}
            </Text>
            <Text
              className="font-body-semibold text-foreground text-[16px] opacity-55"
              style={{ writingDirection: "ltr" }}
            >
              {selected?.currency ?? ""}
            </Text>
          </View>
        </View>

        <View className="bg-border h-px" />

        <FieldRow label={t.branchLabel!} divider {...state("branch")}>
          <FieldValue
            value={branch}
            onChangeText={setBranch}
            placeholder={t.branchPlaceholder}
            {...bind("branch")}
          />
        </FieldRow>

        <FieldRow label={t.instructionsLabel!} {...state("instructions")}>
          <FieldValue
            prose
            value={instructions}
            onChangeText={setInstructions}
            placeholder={t.instructionsPlaceholder}
            {...bind("instructions")}
          />
        </FieldRow>
      </View>

      {error !== null ? (
        <Text variant="meta" className="text-terracotta-800 mt-3">
          {error}
        </Text>
      ) : null}
    </WizardFrame>
  )

  function ibanLine(): string {
    switch (check.status) {
      case "valid":
        return `${num(normalizeIban(iban).length)} ${t.ibanChars} · ${t.ibanOk}`
      case "empty":
      case "unknownCountry":
        return ""
      case "wrongCountry":
        return t.ibanWrongCountry!
          .replace("{prefix}", check.prefix)
          .replace("{country}", selected?.name[locale] ?? "")
      case "badLength":
        return check.actual < check.expected
          ? detail.ibanCounting!
              .replace("{n}", num(check.actual))
              .replace("{total}", num(check.expected))
          : t.ibanBadLength!
              .replace("{country}", selected?.name[locale] ?? "")
              .replace("{n}", num(check.expected))
              .replace("{have}", num(check.actual))
      case "badChecksum":
        return t.ibanBadChecksum!
    }
  }
}
