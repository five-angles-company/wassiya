/**
 * Investments, as steps: what and where it is, then how the executor reaches
 * it. The login is optional: a broker usually hands a deceased client's
 * portfolio over on papers, not a password.
 */
import { ChartPie, Layers, TrendingUp } from "lucide-react-native"
import { View } from "react-native"

import { Field } from "@/components/field"
import { SecretField } from "@/components/secret-field"
import { useStrings } from "@/i18n/use-strings"
import {
  investmentKindLabel,
  type InvestmentForm,
} from "@/screens/assets/detail/forms/investment"
import { maskTail } from "@/screens/assets/detail/forms/secret-json"
import { ChoiceCards } from "@/screens/assets/flow/choice-cards"
import type { AssetSection, FlowStep } from "@/screens/assets/flow/types"

export function useInvestmentSteps(
  form: InvestmentForm,
  patch: (fields: Partial<InvestmentForm>) => void,
  onReveal?: () => void
): FlowStep[] {
  const { t } = useStrings("assets/new/investment")
  const { t: detail } = useStrings("assets/detail")

  return [
    {
      key: "about",
      question: t.qAbout!,
      hint: t.hAbout,
      blocked:
        form.kind === ""
          ? t.needsKind!
          : form.provider.trim().length === 0
            ? t.needsProvider!
            : null,
      content: (
        <View className="gap-5">
          <ChoiceCards
            options={[
              { value: "stocks", title: t.kindStocks!, detail: t.kindStocksDetail, icon: TrendingUp },
              { value: "fund", title: t.kindFund!, detail: t.kindFundDetail, icon: ChartPie },
              { value: "other", title: t.kindOther!, detail: t.kindOtherDetail, icon: Layers },
            ]}
            value={form.kind === "" ? null : form.kind}
            onChange={(kind) => patch({ kind })}
          />
          <Field
            label={t.providerLabel!}
            placeholder={t.providerPlaceholder}
            value={form.provider}
            onChangeText={(provider) => patch({ provider })}
          />
          <Field
            label={t.accountNumberLabel!}
            placeholder={t.accountNumberPlaceholder}
            value={form.accountNumber}
            onChangeText={(accountNumber) => patch({ accountNumber })}
            autoCapitalize="none"
            className="text-left"
          />
        </View>
      ),
    },
    {
      key: "access",
      question: t.qAccess!,
      hint: t.hAccess,
      optional: true,
      blocked: null,
      content: (
        <View className="gap-4">
          <Field
            label={t.usernameLabel!}
            value={form.username}
            onChangeText={(username) => patch({ username })}
            autoCapitalize="none"
            className="text-left"
          />
          <SecretField
            label={t.passwordLabel!}
            value={form.password}
            onChangeText={(password) => patch({ password })}
            revealLabel={detail.revealShort!}
            onReveal={onReveal}
          />
          <Field
            label={t.instructionsLabel!}
            placeholder={t.instructionsPlaceholder}
            value={form.instructions}
            onChangeText={(instructions) => patch({ instructions })}
            multiline
            textAlignVertical="top"
            className="h-auto min-h-28 py-3 leading-[1.7]"
          />
        </View>
      ),
    },
  ]
}

export function investmentSections(
  form: InvestmentForm,
  t: Record<string, string>,
  notRecorded: string
): AssetSection[] {
  const account = form.accountNumber.trim()
  const instructions = form.instructions.trim()
  const access =
    form.username.trim().length > 0
      ? t.loginSummary!.replace("{username}", form.username.trim())
      : instructions.split(/\n/u)[0] ?? ""
  return [
    {
      step: "about",
      label: t.sectionAbout!,
      value: [investmentKindLabel(form.kind, t), account.length > 0 ? maskTail(account) : ""]
        .filter((part) => part.length > 0)
        .join(" · "),
    },
    {
      step: "access",
      label: t.sectionAccess!,
      value: access.length > 0 ? access : notRecorded,
      secret: form.username.trim().length > 0,
      empty: access.length === 0,
    },
  ]
}
