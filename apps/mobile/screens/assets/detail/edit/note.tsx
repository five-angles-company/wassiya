/**
 * One step of a saved note.
 *
 * ⚠️ **No `useNoteDraft` here, ever.** That store persists to AsyncStorage in
 * the clear; prefilling it from a decrypted note would write plaintext to
 * device storage and clobber a half-written new note. The form lives in local
 * state — see `forms/note.ts`.
 *
 * A new take is **staged, not applied**: nothing uploads and nothing is deleted
 * until save, and the stored recording is never downloaded.
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
  const { load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const { form, patch, dirty } = useEditForm(load.status === "ready" ? load : null, parseNote)
  const voice = useVoiceNote()
  const value = form ?? EMPTY_NOTE
  const take = voice.take

  const steps = useNoteSteps({
    value,
    onChange: patch,
    formatLocked: true,
    voice,
    stored:
      value.format === "voice" && value.hasRecording
        ? { durationMs: value.durationMs, byteSize: value.current.byteSize }
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
    />
  )
}
