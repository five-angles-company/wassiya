import { useState } from "react"
import { router } from "expo-router"

import { useStrings } from "@/i18n/use-strings"
import { checkIban } from "@/lib/iban"
import { toBankPayload, type BankForm } from "@/screens/assets/detail/forms/bank"
import { EMPTY_BANK, useBankSteps } from "@/screens/assets/flow/bank-steps"
import { StepFlow } from "@/screens/assets/flow/step-flow"
import { useHandoverStep } from "@/screens/assets/flow/use-handover-step"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

/** ٤.٤ — adding a bank account. The steps are `bank-steps.tsx`. */
export function NewBankScreen() {
  const { t } = useStrings("assets/new/bank")
  const { t: chrome } = useStrings("assets/new")
  const { submit, submitting, error } = useAssetSubmit()

  const [form, setForm] = useState<BankForm>(EMPTY_BANK)
  const patch = (fields: Partial<BankForm>) =>
    setForm((current) => ({ ...current, ...fields }))
  const steps = useBankSteps(form, patch)
  const handover = useHandoverStep()

  async function save() {
    if (form.bank.trim().length === 0) return
    if (checkIban(form.iban, form.country).status !== "valid") return
    const payload = toBankPayload(form)
    const saved = await submit({
      type: "bank",
      label: payload.label,
      secret: payload.secret,
      meta: payload.meta,
      handOver: handover.handedOver,
    })
    if (saved !== null) {
      router.replace({ pathname: "/assets/[id]", params: { id: saved } })
    }
  }

  return (
    <StepFlow
      kicker={t.title!}
      steps={[...steps, handover.step]}
      finishLabel={chrome.saveAsset!}
      onFinish={() => void save()}
      busy={submitting}
      error={error}
      onExit={() => (router.canGoBack() ? router.back() : router.replace("/assets"))}
      dirty={JSON.stringify(form) !== JSON.stringify(EMPTY_BANK)}
    />
  )
}
