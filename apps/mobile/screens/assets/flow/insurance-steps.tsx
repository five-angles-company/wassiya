/**
 * Insurance, as steps: the policy, then how it is claimed. An executor who
 * does not know a policy exists never claims it — that is the whole reason
 * this type is here.
 */
import { HeartHandshake, House, Stethoscope, Umbrella } from "lucide-react-native"
import { View } from "react-native"

import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import {
  insuranceKindLabel,
  type InsuranceForm,
} from "@/screens/assets/detail/forms/insurance"
import { maskTail } from "@/screens/assets/detail/forms/secret-json"
import { ChoiceCards } from "@/screens/assets/flow/choice-cards"
import type { AssetSection, FlowStep } from "@/screens/assets/flow/types"

export function useInsuranceSteps(
  form: InsuranceForm,
  patch: (fields: Partial<InsuranceForm>) => void
): FlowStep[] {
  const { t } = useStrings("assets/new/insurance")

  return [
    {
      key: "about",
      question: t.qAbout!,
      blocked:
        form.kind === ""
          ? t.needsKind!
          : form.company.trim().length === 0
            ? t.needsCompany!
            : null,
      content: (
        <View className="gap-5">
          <ChoiceCards
            options={[
              { value: "life", title: t.kindLife!, detail: t.kindLifeDetail, icon: HeartHandshake },
              { value: "health", title: t.kindHealth!, detail: t.kindHealthDetail, icon: Stethoscope },
              { value: "property", title: t.kindProperty!, detail: t.kindPropertyDetail, icon: House },
              { value: "other", title: t.kindOther!, detail: t.kindOtherDetail, icon: Umbrella },
            ]}
            value={form.kind === "" ? null : form.kind}
            onChange={(kind) => patch({ kind })}
          />
          <Field
            label={t.companyLabel!}
            placeholder={t.companyPlaceholder}
            value={form.company}
            onChangeText={(company) => patch({ company })}
          />
          <Field
            label={t.policyNumberLabel!}
            placeholder={t.policyNumberPlaceholder}
            value={form.policyNumber}
            onChangeText={(policyNumber) => patch({ policyNumber })}
            autoCapitalize="characters"
            className="text-left"
          />
        </View>
      ),
    },
    {
      key: "claim",
      question: t.qClaim!,
      hint: t.hClaim,
      optional: true,
      blocked: null,
      content: (
        <View className="gap-4">
          <Field
            label={t.beneficiaryLabel!}
            placeholder={t.beneficiaryPlaceholder}
            value={form.beneficiary}
            onChangeText={(beneficiary) => patch({ beneficiary })}
          />
          <Field
            label={t.instructionsLabel!}
            placeholder={t.instructionsPlaceholder}
            value={form.instructions}
            onChangeText={(instructions) => patch({ instructions })}
            multiline
            textAlignVertical="top"
            className="h-auto min-h-32 py-3 leading-[1.7]"
          />
        </View>
      ),
    },
  ]
}

export function insuranceSections(
  form: InsuranceForm,
  t: Record<string, string>,
  notRecorded: string
): AssetSection[] {
  const policy = form.policyNumber.trim()
  const claim =
    form.beneficiary.trim().length > 0
      ? `${t.beneficiaryLabel}: ${form.beneficiary.trim()}`
      : (form.instructions.trim().split(/\n/u)[0] ?? "")
  return [
    {
      step: "about",
      label: t.sectionAbout!,
      value: [insuranceKindLabel(form.kind, t), policy.length > 0 ? maskTail(policy) : ""]
        .filter((part) => part.length > 0)
        .join(" · "),
    },
    {
      step: "claim",
      label: t.sectionClaim!,
      value: claim.length > 0 ? claim : notRecorded,
      empty: claim.length === 0,
    },
  ]
}
