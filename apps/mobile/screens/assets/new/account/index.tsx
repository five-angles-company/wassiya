import { useState } from "react"
import { router } from "expo-router"

import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import {
  EMPTY_DIGITAL,
  isDigitalValid,
  toDigitalPayload,
  type DigitalForm,
} from "@/screens/assets/detail/forms/digital"
import { useDigitalSteps } from "@/screens/assets/flow/digital-steps"
import { StepFlow } from "@/screens/assets/flow/step-flow"
import { useHandoverStep } from "@/screens/assets/flow/use-handover-step"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

/** ٤.٧ — adding a digital account. The steps are `digital-steps.tsx`. */
export function NewAccountScreen() {
  const { t } = useStrings("assets/new/account")
  const { t: chrome } = useStrings("assets/new")
  useSecureScreen("assets/new/account")
  const { submit, submitting, error } = useAssetSubmit()

  const [form, setForm] = useState<DigitalForm>(EMPTY_DIGITAL)
  const patch = (fields: Partial<DigitalForm>) =>
    setForm((current) => ({ ...current, ...fields }))
  const steps = useDigitalSteps(form, patch)
  const handover = useHandoverStep()

  async function save() {
    if (!isDigitalValid(form)) return
    const saved = await submit({
      type: "digital",
      ...toDigitalPayload(form, t),
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
      dirty={JSON.stringify(form) !== JSON.stringify(EMPTY_DIGITAL)}
    />
  )
}
