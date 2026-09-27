/** One step of a saved asset whose whole payload is its sealed fields. */
import type { Id } from "@workspace/backend/dataModel"
import { router } from "expo-router"

import { useSecureScreen } from "@/hooks/use-secure-screen"
import type { AssetType } from "@/lib/asset-types"
import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"
import { StepEditFrame } from "@/screens/assets/detail/step-edit-frame"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"
import type { FlowStep } from "@/screens/assets/flow/types"

export type SimpleStepEditProps<T extends object> = {
  assetId: Id<"assets">
  stepKey: string
  type: AssetType
  kicker: string
  empty: T
  parse: (source: EditSource) => T | null
  useSteps: (form: T, patch: (fields: Partial<T>) => void, onReveal: () => void) => FlowStep[]
  toPayload: (form: T) => EditPayload
  isValid: (form: T) => boolean
}

export function SimpleStepEdit<T extends object>({
  assetId,
  stepKey,
  type,
  kicker,
  empty,
  parse,
  useSteps,
  toPayload,
  isValid,
}: SimpleStepEditProps<T>) {
  useSecureScreen(`assets/edit/${type}`)
  const { load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const { form, patch, dirty } = useEditForm(load.status === "ready" ? load : null, parse)
  const steps = useSteps(form ?? empty, patch, noteReveal)

  async function onSave() {
    if (form === null || !isValid(form)) return
    if (await save(toPayload(form))) router.back()
  }

  return (
    <StepEditFrame
      load={load}
      readable={form !== null}
      step={steps.find((step) => step.key === stepKey)}
      kicker={kicker}
      onSave={() => void onSave()}
      saving={saving}
      error={error}
      dirty={dirty}
      onReveal={noteReveal}
    />
  )
}
