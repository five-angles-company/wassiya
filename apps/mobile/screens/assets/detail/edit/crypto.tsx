import type { Id } from "@workspace/backend/dataModel"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import {
  isCryptoValid,
  parseCrypto,
  toCryptoPayload,
} from "@/screens/assets/detail/forms/crypto"
import { StepEditFrame } from "@/screens/assets/detail/step-edit-frame"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"
import { EMPTY_CRYPTO, useCryptoSteps } from "@/screens/assets/flow/crypto-steps"

/** One step of a saved crypto wallet. The phrase step is guarded. */
export function CryptoStepEdit({ assetId, stepKey }: { assetId: Id<"assets">; stepKey: string }) {
  const { t, locale } = useStrings("assets/new/crypto")
  useSecureScreen("assets/edit/crypto")
  const { load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const { form, patch, dirty } = useEditForm(load.status === "ready" ? load : null, parseCrypto)
  const steps = useCryptoSteps(form ?? EMPTY_CRYPTO, patch, {
    editing: true,
    onReveal: noteReveal,
  })

  async function onSave() {
    if (form === null || !isCryptoValid(form)) return
    const payload = toCryptoPayload(
      form,
      t,
      (n) => fmtNum(n, locale),
      locale === "ar" ? "كلمة" : "words"
    )
    if (await save(payload)) router.back()
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
