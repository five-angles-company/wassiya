/**
 * ٤.٨ — adding a note: "a letter, not a text field".
 *
 * ⚠️ The **text draft survives leaving the screen** — `stores/note-draft.ts`
 * keeps it on the device so a half-written letter outlives a phone call — and
 * is cleared the moment it is saved. The recording does not survive; see
 * `use-voice-note.ts` for why.
 */
import { fmtDuration, fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { useVoiceNote, VOICE_MIME_TYPE } from "@/hooks/use-voice-note"
import { useStrings } from "@/i18n/use-strings"
import {
  isNoteValid,
  toNotePayload,
  type NoteKind,
} from "@/screens/assets/detail/forms/note"
import { useNoteSteps } from "@/screens/assets/flow/note-steps"
import { StepFlow } from "@/screens/assets/flow/step-flow"
import { useHandoverStep } from "@/screens/assets/flow/use-handover-step"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"
import { useNoteDraft } from "@/stores/note-draft"

export function NewNoteScreen() {
  const { t, locale } = useStrings("assets/new/note")
  const { t: chrome } = useStrings("assets/new")
  const { submit, submitting, error } = useAssetSubmit()
  const draft = useNoteDraft()
  const voice = useVoiceNote()

  const value = {
    kind: draft.kind as NoteKind,
    title: draft.title,
    format: draft.format,
    body: draft.body,
  }

  const steps = useNoteSteps({
    value,
    onChange: (patch) => draft.update(patch),
    formatLocked: false,
    voice,
    stored: null,
    draftLine: draft.savedAt === null ? undefined : savedAgo(draft.savedAt, t, locale),
  })
  const handover = useHandoverStep()

  async function save() {
    const take = voice.take
    const form = {
      ...value,
      durationMs: take?.durationMs ?? 0,
      current: { byteSize: take?.byteSize ?? 0 },
      hasRecording: false,
    }
    if (!isNoteValid(form, take)) return

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
    const saved = await submit({
      type: "note",
      label: payload.label,
      secret: payload.secret,
      meta: payload.meta,
      files:
        value.format === "voice" && take !== null
          ? [{ uri: take.uri, byteSize: take.byteSize }]
          : undefined,
      handOver: handover.handedOver,
    })

    if (saved !== null) {
      // Neither plaintext copy may outlive its ciphertext.
      draft.clear()
      voice.clear()
      router.replace({ pathname: "/assets/[id]", params: { id: saved } })
    }
  }

  return (
    <StepFlow
      kicker={t.title!}
      steps={[...steps, handover.step]}
      finishLabel={chrome.saveAsset!}
      onFinish={() => void save()}
      busy={submitting}
      error={error}
      // The text draft is kept, so leaving loses nothing but a recording.
      onExit={() => (router.canGoBack() ? router.back() : router.replace("/assets"))}
      dirty={voice.take !== null}
    />
  )
}

/** Minutes only — a letter is written over minutes, and seconds would tick. */
function savedAgo(savedAt: number, t: Record<string, string>, locale: "ar" | "en"): string {
  const minutes = Math.floor((Date.now() - savedAt) / 60_000)
  return minutes < 1 ? t.draftJustNow! : t.draftAgo!.replace("{n}", fmtNum(minutes, locale))
}
