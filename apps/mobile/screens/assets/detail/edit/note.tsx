import type { Id } from "@workspace/backend/dataModel"
import { fmtDuration, fmtNum } from "@workspace/ui-native/lib/format"

import { useVoiceNote, VOICE_MIME_TYPE } from "@/hooks/use-voice-note"
import { useStrings } from "@/i18n/use-strings"
import { readFileBytes } from "@/lib/asset-upload"
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
 *
 * A new take is **staged, not applied**: nothing uploads and nothing is deleted
 * until Save, so backing out of a mis-tap costs the owner nothing. The recorder
 * is the only thing holding it, which is why a take counts towards `canSave`
 * beside `dirty` rather than being copied into the form. The stored recording
 * is never downloaded — `forms/note-fields.tsx` says why.
 */
export function NoteEditScreen({ assetId }: { assetId: Id<"assets"> }) {
  const { t, locale } = useStrings("assets/detail")
  const { t: note } = useStrings("assets/new/note")

  const { load, save, saving, error } = useAssetEditor(assetId)
  const { form, patch, dirty, commit, reset } = useEditForm(
    load.status === "ready" ? load : null,
    parseNote
  )
  const voice = useVoiceNote()
  const take = voice.take

  const formatSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024
    return `${fmtNum(Math.round(mb * 10) / 10, locale)} ${locale === "ar" ? "م.ب" : "MB"}`
  }

  async function onSave() {
    if (form === null) return
    const payload = toNotePayload(
      form,
      note,
      {
        count: (n) => fmtNum(n, locale),
        duration: (ms) => fmtDuration(ms / 1000, locale),
      },
      VOICE_MIME_TYPE,
      take
    )

    const ok = await save({
      ...payload,
      // Absent keeps the stored recording; a new take supersedes it.
      files:
        form.format === "voice" && take !== null
          ? [{ read: () => readFileBytes(take.uri), byteSize: take.byteSize }]
          : undefined,
    })

    if (ok) {
      if (take !== null) {
        // The plaintext take must not outlive the ciphertext that replaced it,
        // and the row now describes the new recording.
        patch({
          durationMs: take.durationMs,
          current: { byteSize: take.byteSize },
        })
        voice.discard()
      }
      commit()
    }
  }

  return (
    <AssetEditFrame
      assetId={assetId}
      load={load}
      saving={saving}
      error={error}
      dirty={dirty || take !== null}
      canSave={
        form !== null &&
        (dirty || take !== null) &&
        isNoteValid(form, take) &&
        !saving
      }
      onSave={() => void onSave()}
      onCancel={() => {
        voice.discard()
        reset()
      }}
      kindLine={note.title!}
    >
      {form === null ? null : (
        <NoteFields
          value={form}
          onChange={patch}
          note={note}
          labels={t}
          locale={locale}
          formatSize={formatSize}
          voice={
            form.format === "voice"
              ? {
                  state: voice.state,
                  durationMs: voice.durationMs,
                  levels: voice.levels,
                  playing: voice.playing,
                  staged: take !== null,
                  onRecord: voice.start,
                  onStop: voice.stop,
                  onPlay: voice.play,
                  onPause: voice.pause,
                }
              : undefined
          }
          notice={
            voice.error === "permission"
              ? note.micDenied!
              : voice.error === "failed"
                ? note.micFailed!
                : null
          }
        />
      )}
    </AssetEditFrame>
  )
}
