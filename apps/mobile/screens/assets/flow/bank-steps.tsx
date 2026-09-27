/**
 * ٤.٤ — a bank account, as steps: the account (country, bank, IBAN), then
 * what the executor should do with it.
 *
 * Country comes first because it parameterises the IBAN — length, prefix,
 * checksum — and the currency, which is derived and never typed. A short IBAN
 * is a counter, not an error: the line counts while the number is still being
 * written and only turns into a verdict once it is long enough to judge.
 */
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { monoFont } from "@workspace/ui-native/lib/fonts"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { cn } from "@workspace/ui-native/lib/utils"
import { Check } from "lucide-react-native"
import { View } from "react-native"

import { CountryPicker } from "@/components/country-picker"
import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import { DEFAULT_COUNTRY, findCountry } from "@/lib/countries"
import { checkIban, groupIban, normalizeIban } from "@/lib/iban"
import type { BankForm } from "@/screens/assets/detail/forms/bank"
import type { AssetSection, FlowStep } from "@/screens/assets/flow/types"

export const EMPTY_BANK: BankForm = {
  country: DEFAULT_COUNTRY,
  bank: "",
  iban: "",
  accountType: "current",
  branch: "",
  instructions: "",
}

export function useBankSteps(
  form: BankForm,
  patch: (fields: Partial<BankForm>) => void
): FlowStep[] {
  const { t, locale } = useStrings("assets/new/bank")
  const { t: detail } = useStrings("assets/detail")
  const check = checkIban(form.iban, form.country)
  const country = findCountry(form.country)
  const num = (n: number) => fmtNum(n, locale)

  function ibanLine(): string {
    switch (check.status) {
      case "valid":
        return `${num(normalizeIban(form.iban).length)} ${t.ibanChars} · ${t.ibanOk}`
      case "empty":
      case "unknownCountry":
        return ""
      case "wrongCountry":
        return t
          .ibanWrongCountry!.replace("{prefix}", check.prefix)
          .replace("{country}", country?.name[locale] ?? "")
      case "badLength":
        return check.actual < check.expected
          ? detail
              .ibanCounting!.replace("{n}", num(check.actual))
              .replace("{total}", num(check.expected))
          : t
              .ibanBadLength!.replace("{country}", country?.name[locale] ?? "")
              .replace("{n}", num(check.expected))
              .replace("{have}", num(check.actual))
      case "badChecksum":
        return t.ibanBadChecksum!
    }
  }

  return [
    {
      key: "account",
      question: t.qAccount!,
      hint: t.hAccount,
      blocked:
        form.bank.trim().length === 0
          ? t.needsBank!
          : check.status === "valid"
            ? null
            : t.needsIban!,
      content: (
        <View className="gap-5">
          <CountryPicker
            label={t.countryLabel!}
            value={form.country}
            onChange={(code) => patch({ country: code })}
            locale={locale}
          />
          <Field
            label={t.bankLabel!}
            placeholder={t.bankPlaceholder}
            value={form.bank}
            onChangeText={(bank) => patch({ bank })}
          />
          <View className="gap-2">
            <Field
              label={t.ibanLabel!}
              value={groupIban(form.iban)}
              onChangeText={(iban) => patch({ iban })}
              autoCapitalize="characters"
              autoCorrect={false}
              className={cn(monoFont, "text-left text-[15px] tracking-[0.75px]")}
            />
            <View className="flex-row items-center gap-2">
              {check.status === "valid" ? (
                <Icon as={Check} size={14} strokeWidth={2.75} className="text-olive-700 shrink-0" />
              ) : null}
              <Text
                className={cn(
                  "text-meta flex-1",
                  check.status === "valid" ? "text-olive-700" : "text-terracotta-800"
                )}
              >
                {ibanLine()}
              </Text>
            </View>
          </View>
          <View className="flex-row items-end gap-4">
            <View className="min-w-0 flex-1">
              <ChipRow
                label={t.accountTypeLabel}
                options={[
                  { value: "current", label: t.accountCurrent! },
                  { value: "savings", label: t.accountSavings! },
                ]}
                value={form.accountType}
                onChange={(accountType) => patch({ accountType })}
              />
            </View>
            <View className="shrink-0 items-end gap-2">
              <Text variant="meta">{t.currencyLabel}</Text>
              <Text
                className="font-body-semibold text-muted-foreground text-[16px]"
                style={{ writingDirection: "ltr" }}
              >
                {country?.currency ?? ""}
              </Text>
            </View>
          </View>
        </View>
      ),
    },
    {
      key: "instructions",
      question: t.qInstructions!,
      hint: t.hInstructions,
      optional: true,
      blocked: null,
      content: (
        <View className="gap-5">
          <Field
            label={t.instructionsLabel!}
            placeholder={t.instructionsPlaceholder}
            value={form.instructions}
            onChangeText={(instructions) => patch({ instructions })}
            multiline
            textAlignVertical="top"
            className="h-auto min-h-32 py-3 leading-[1.7]"
          />
          <Field
            label={t.branchLabel!}
            placeholder={t.branchPlaceholder}
            value={form.branch}
            onChangeText={(branch) => patch({ branch })}
          />
        </View>
      ),
    },
  ]
}

export function bankSections(
  form: BankForm,
  t: Record<string, string>,
  locale: Locale
): AssetSection[] {
  const clean = normalizeIban(form.iban)
  const instructions = form.instructions.trim()
  return [
    {
      step: "account",
      label: t.sectionAccount!,
      value: [
        findCountry(form.country)?.name[locale] ?? "",
        `${clean.slice(0, 4)} •••• ${clean.slice(-4)}`,
        form.accountType === "savings" ? t.accountSavings! : t.accountCurrent!,
      ]
        .filter((part) => part.length > 0)
        .join(" · "),
      secret: true,
    },
    {
      step: "instructions",
      label: t.instructionsLabel!,
      value: instructions.length > 0 ? instructions : t.noInstructions!,
      empty: instructions.length === 0,
    },
  ]
}
