/**
 * One step of a saved note.
 *
 * ⚠️ **No `useNoteDraft` here, ever.** That store persists to AsyncStorage in
 * the clear; prefilling it from a decrypted note would write plaintext to
 * device storage and clobber a half-written new note. The form lives in local
 * state — see `forms/note.ts`.
 *
 * A new take is **staged, not applied**: nothing uploads and nothing is deleted
 * until save. The stored recording is fetched only when the owner listens.
 */
import type { Id } from "@workspace/backend/dataModel"
import { fmtDuration, fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { useVoiceNote, VOICE_MIME_TYPE } from "@/hooks/use-voice-note"
import { useStrings } from "@/i18n/use-strings"
import {
  isNoteValid,
  parseNote,
  toNotePayload,
  type NoteForm,
} from "@/screens/assets/detail/forms/note"
import { StepEditFrame } from "@/screens/assets/detail/step-edit-frame"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"
import { useStoredFiles } from "@/screens/assets/detail/use-stored-files"
import { useStoredRecording } from "@/screens/assets/detail/use-stored-recording"
import { useNoteSteps } from "@/screens/assets/flow/note-steps"

const EMPTY_NOTE: NoteForm = {
  kind: "instructions",
  format: "text",
  title: "",
  body: "",
  durationMs: 0,
  current: { byteSize: 0 },
  hasRecording: false,
}

export function NoteStepEdit({ assetId, stepKey }: { assetId: Id<"assets">; stepKey: string }) {
  const { t, locale } = useStrings("assets/new/note")
  const { asset, load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const { form, patch, dirty } = useEditForm(load.status === "ready" ? load : null, parseNote)
  const voice = useVoiceNote()
  const value = form ?? EMPTY_NOTE
  const take = voice.take
  const { t: detail } = useStrings("assets/detail")
  const storedFiles = useStoredFiles(asset?.dekWrappedByMk)
  const recording = useStoredRecording(
    load.status === "ready" ? load.files[0] : undefined,
    storedFiles
  )

  const steps = useNoteSteps({
    value,
    onChange: patch,
    formatLocked: true,
    voice,
    stored:
      value.format === "voice" && value.hasRecording
        ? {
            durationMs: value.durationMs,
            byteSize: value.current.byteSize,
            playing: recording.playing,
            loading: recording.loading,
            onPlay: recording.play,
            onPause: recording.pause,
          }
        : null,
  })

  async function onSave() {
    if (form === null || !isNoteValid(form, take)) return
    const payload = toNotePayload(
      form,
      t,
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
          ? [{ uri: take.uri, byteSize: take.byteSize }]
          : undefined,
    })
    if (ok) {
      // The plaintext take must not outlive the ciphertext that replaced it.
      if (take !== null) voice.discard()
      router.back()
    }
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
      dirty={dirty || take !== null}
      onReveal={noteReveal}
      notice={storedFiles.failed ? detail.openFailed : undefined}
    />
  )
}
