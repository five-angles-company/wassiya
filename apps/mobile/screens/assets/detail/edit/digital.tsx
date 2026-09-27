import type { Id } from "@workspace/backend/dataModel"
import { router } from "expo-router"

import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import {
  EMPTY_DIGITAL,
  isDigitalValid,
  parseDigital,
  toDigitalPayload,
} from "@/screens/assets/detail/forms/digital"
import { StepEditFrame } from "@/screens/assets/detail/step-edit-frame"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"
import { useDigitalSteps } from "@/screens/assets/flow/digital-steps"

/** One step of a saved digital account. */
export function DigitalStepEdit({ assetId, stepKey }: { assetId: Id<"assets">; stepKey: string }) {
  const { t } = useStrings("assets/new/account")
  useSecureScreen("assets/edit/digital")
  const { load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const { form, patch, dirty } = useEditForm(load.status === "ready" ? load : null, parseDigital)
  const steps = useDigitalSteps(form ?? EMPTY_DIGITAL, patch, noteReveal)

  async function onSave() {
    if (form === null || !isDigitalValid(form)) return
    if (await save(toDigitalPayload(form, t))) router.back()
  }

  return (
    <StepEditFrame
      load={load}
      readable={form !== null}
      step={steps.find((step) => step.key === stepKey)}
      kicker={t.title!}
      onSave={() => void onSave()}
      saving={saving}
      error={error}
      dirty={dirty}
      onReveal={noteReveal}
    />
  )
}
