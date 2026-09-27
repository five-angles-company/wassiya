import { useState } from "react"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import {
  isCryptoValid,
  toCryptoPayload,
  type CryptoForm,
} from "@/screens/assets/detail/forms/crypto"
import { EMPTY_CRYPTO, useCryptoSteps } from "@/screens/assets/flow/crypto-steps"
import { StepFlow } from "@/screens/assets/flow/step-flow"
import { useHandoverStep } from "@/screens/assets/flow/use-handover-step"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

/** ٤.٣ — adding a crypto wallet. The steps are `crypto-steps.tsx`. */
export function NewCryptoScreen() {
  const { t, locale } = useStrings("assets/new/crypto")
  const { t: chrome } = useStrings("assets/new")
  useSecureScreen("assets/new/crypto")
  const { submit, submitting, error } = useAssetSubmit()

  const [form, setForm] = useState<CryptoForm>(EMPTY_CRYPTO)
  const patch = (fields: Partial<CryptoForm>) =>
    setForm((current) => ({ ...current, ...fields }))
  const steps = useCryptoSteps(form, patch, { editing: false })
  const handover = useHandoverStep()

  async function save() {
    if (!isCryptoValid(form)) return
    const payload = toCryptoPayload(
      form,
      t,
      (n) => fmtNum(n, locale),
      locale === "ar" ? "كلمة" : "words"
    )
    const saved = await submit({
      type: "crypto",
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
      dirty={JSON.stringify(form) !== JSON.stringify(EMPTY_CRYPTO)}
    />
  )
}
