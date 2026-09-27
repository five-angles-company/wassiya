import type { Id } from "@workspace/backend/dataModel"
import { router } from "expo-router"

import { useStrings } from "@/i18n/use-strings"
import { checkIban } from "@/lib/iban"
import { parseBank, toBankPayload } from "@/screens/assets/detail/forms/bank"
import { StepEditFrame } from "@/screens/assets/detail/step-edit-frame"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"
import { EMPTY_BANK, useBankSteps } from "@/screens/assets/flow/bank-steps"

/** One step of a saved bank account. */
export function BankStepEdit({ assetId, stepKey }: { assetId: Id<"assets">; stepKey: string }) {
  const { t } = useStrings("assets/new/bank")
  const { load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const { form, patch, dirty } = useEditForm(load.status === "ready" ? load : null, parseBank)
  const steps = useBankSteps(form ?? EMPTY_BANK, patch)

  async function onSave() {
    if (form === null || form.bank.trim().length === 0) return
    if (checkIban(form.iban, form.country).status !== "valid") return
    if (await save(toBankPayload(form))) router.back()
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
