import type { Id } from "@workspace/backend/dataModel"

import { useStrings } from "@/i18n/use-strings"
import { AssetEditFrame } from "@/screens/assets/detail/edit-frame"
import { DigitalFields } from "@/screens/assets/detail/forms/digital-fields"
import {
  isDigitalValid,
  parseDigital,
  toDigitalPayload,
} from "@/screens/assets/detail/forms/digital"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"

/** ٤.٧ — a digital account, as the form that edits it. */
export function DigitalEditScreen({ assetId }: { assetId: Id<"assets"> }) {
  const { t } = useStrings("assets/detail")
  const { t: account } = useStrings("assets/new/account")

  const { load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const { form, patch, dirty, commit, reset } = useEditForm(
    load.status === "ready" ? load : null,
    parseDigital
  )

  async function onSave() {
    if (form === null) return
    if (await save(toDigitalPayload(form, account))) commit()
  }

  return (
    <AssetEditFrame
      assetId={assetId}
      load={load}
      saving={saving}
      error={error}
      dirty={dirty}
      canSave={form !== null && isDigitalValid(form) && !saving}
      onSave={() => void onSave()}
      onCancel={reset}
      kindLine={account.title!}
    >
      {form === null ? null : (
        <DigitalFields
          value={form}
          onChange={patch}
          labels={t}
          account={account}
          onReveal={noteReveal}
        />
      )}
    </AssetEditFrame>
  )
}
