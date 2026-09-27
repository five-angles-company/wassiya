/**
 * Adding an asset whose whole payload is its sealed fields — no files. The
 * type brings its own steps and payload; this runs them and saves.
 */
import { useState } from "react"
import { router } from "expo-router"

import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import type { AssetType } from "@/lib/asset-types"
import type { EditPayload } from "@/screens/assets/detail/forms/source"
import { StepFlow } from "@/screens/assets/flow/step-flow"
import type { FlowStep } from "@/screens/assets/flow/types"
import { useHandoverStep } from "@/screens/assets/flow/use-handover-step"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

export type SimpleCreateProps<T extends object> = {
  type: AssetType
  kicker: string
  empty: T
  useSteps: (form: T, patch: (fields: Partial<T>) => void) => FlowStep[]
  toPayload: (form: T) => EditPayload
  isValid: (form: T) => boolean
}

export function SimpleCreateScreen<T extends object>({
  type,
  kicker,
  empty,
  useSteps,
  toPayload,
  isValid,
}: SimpleCreateProps<T>) {
  const { t: chrome } = useStrings("assets/new")
  useSecureScreen(`assets/new/${type}`)
  const { submit, submitting, error } = useAssetSubmit()

  const [form, setForm] = useState<T>(empty)
  const patch = (fields: Partial<T>) => setForm((current) => ({ ...current, ...fields }))
  const steps = useSteps(form, patch)
  const handover = useHandoverStep()

  async function save() {
    if (!isValid(form)) return
    const payload = toPayload(form)
    const saved = await submit({
      type,
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
      kicker={kicker}
      steps={[...steps, handover.step]}
      finishLabel={chrome.saveAsset!}
      onFinish={() => void save()}
      busy={submitting}
      error={error}
      onExit={() => (router.canGoBack() ? router.back() : router.replace("/assets"))}
      dirty={JSON.stringify(form) !== JSON.stringify(empty)}
    />
  )
}
