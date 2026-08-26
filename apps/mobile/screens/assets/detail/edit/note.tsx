import type { Id } from "@workspace/backend/dataModel"
import { fmtNum } from "@workspace/ui-native/lib/format"

import { useStrings } from "@/i18n/use-strings"
import { AssetEditFrame } from "@/screens/assets/detail/edit-frame"
import { NoteFields } from "@/screens/assets/detail/forms/note-fields"
import {
  isNoteValid,
  parseNote,
  toNotePayload,
} from "@/screens/assets/detail/forms/note"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"

/**
 * ٤.٨ — an encrypted note, as the form that edits it.
 *
 * ⚠️ **No `useNoteDraft` here, ever.** That store persists to AsyncStorage in
 * the clear and is scoped to a note being composed; prefilling it from a
 * decrypted note would write plaintext to device storage, and it is a single
 * singleton so it would also clobber a half-written new note. The form lives in
 * local state — see `forms/note.ts`.
 */
export function NoteEditScreen({ assetId }: { assetId: Id<"assets"> }) {
  const { locale } = useStrings("assets/detail")
  const { t: note } = useStrings("assets/new/note")

  const { load, save, saving, error } = useAssetEditor(assetId)
  const { form, patch, dirty, commit, reset } = useEditForm(
    load.status === "ready" ? load : null,
    parseNote
  )

  async function onSave() {
    if (form === null) return
    const payload = toNotePayload(form, note, (n) => fmtNum(n, locale))
    if (await save(payload)) commit()
  }

  return (
    <AssetEditFrame
      assetId={assetId}
      load={load}
      saving={saving}
      error={error}
      dirty={dirty}
      canSave={form !== null && dirty && isNoteValid(form) && !saving}
      onSave={() => void onSave()}
      onCancel={reset}
      kindLine={note.title!}
    >
      {form === null ? null : (
        <NoteFields value={form} onChange={patch} note={note} locale={locale} />
      )}
    </AssetEditFrame>
  )
}
