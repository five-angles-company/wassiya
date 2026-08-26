import type { Id } from "@workspace/backend/dataModel"

import { useStrings } from "@/i18n/use-strings"
import { checkIban } from "@/lib/iban"
import { AssetEditFrame } from "@/screens/assets/detail/edit-frame"
import { BankFields } from "@/screens/assets/detail/forms/bank-fields"
import { parseBank, toBankPayload } from "@/screens/assets/detail/forms/bank"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"

/** ٤.٤ — a bank account, as the form that edits it. */
export function BankEditScreen({ assetId }: { assetId: Id<"assets"> }) {
  const { t, locale } = useStrings("assets/detail")
  const { t: bank } = useStrings("assets/new/bank")

  const { load, save, saving, error } = useAssetEditor(assetId)
  const { form, patch, dirty, commit, reset } = useEditForm(
    load.status === "ready" ? load : null,
    parseBank
  )

  async function onSave() {
    if (form === null) return
    if (await save(toBankPayload(form))) commit()
  }

  // The wizard's own gate, so an edit cannot save what a create would refuse —
  // and, more to the point, cannot overwrite a valid IBAN with an invalid one.
  const valid =
    form !== null &&
    form.bank.trim().length > 0 &&
    checkIban(form.iban, form.country).status === "valid"

  return (
    <AssetEditFrame
      assetId={assetId}
      load={load}
      saving={saving}
      error={error}
      dirty={dirty}
      canSave={valid && dirty && !saving}
      onSave={() => void onSave()}
      onCancel={reset}
      kindLine={bank.title!}
    >
      {form === null ? null : (
        <BankFields
          value={form}
          onChange={patch}
          labels={t}
          bank={bank}
          locale={locale}
        />
      )}
    </AssetEditFrame>
  )
}
