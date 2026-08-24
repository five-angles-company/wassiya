/**
 * ٤.٨ — a note. The board's own subtitle is "a letter, not a text field".
 *
 * Everything that subtitle implies is here: the raised page, the three kind
 * pills that set the note's job and drive its placeholder, the formatting
 * toolbar, dictation, and a draft that survives leaving the screen.
 *
 * Two deliberate divergences from the board's drawing, both explained where
 * they live: formatting is **markdown markers in plain text** rather than a
 * rich-text editor (`NoteToolbar`), and dictation is **on-device only or
 * absent** (`useDictation`). The recipient strip is the one thing genuinely
 * missing, and it is waiting on section ٥ rather than on effort.
 */
import { useEffect, useState } from "react"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { TextInput, View } from "react-native"

import { Field } from "@/components/field"
import { useDictation } from "@/hooks/use-dictation"
import { useStrings } from "@/i18n/use-strings"
import { NoteToolbar } from "@/screens/assets/new/note/components/note-toolbar"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"
import { useNoteDraft } from "@/stores/note-draft"

/** `--color-muted-foreground`; RN takes placeholder colour as a prop. */
const MUTED_FOREGROUND = "#82796a"

type NoteKind = "instructions" | "whereabouts" | "wish"

export function NewNoteScreen() {
  const { t, locale } = useStrings("assets/new/note")
  const { t: chrome } = useStrings("assets/new")
  const { submit, submitting, error } = useAssetSubmit()

  // The draft is the source of truth, so a half-written letter survives a phone
  // call, a crash, or a wrong tap on the back button.
  const draft = useNoteDraft()
  const dictation = useDictation(locale)
  const [selection, setSelection] = useState({ start: 0, end: 0 })

  const kind = draft.kind as NoteKind
  const body = draft.body

  // Committed speech is appended at the end rather than at the caret: the user
  // was speaking, not pointing, and inserting mid-sentence where they last
  // tapped is rarely what they meant.
  useEffect(() => {
    if (dictation.transcript.length === 0) return
    draft.update({
      body: body.length > 0 ? `${body} ${dictation.transcript}` : dictation.transcript,
    })
    dictation.reset()
    // `body` is read through the store, which the update rewrites — depending
    // on it here would re-run this on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dictation.transcript])

  const words = body.trim().length === 0 ? 0 : body.trim().split(/\s+/u).length

  async function save() {
    const saved = await submit({
      type: "note",
      label: {
        title: draft.title.trim(),
        subtitle: `${KIND_LABEL(t)[kind]} · ${t.words.replace("{n}", fmtNum(words, locale))}`,
      },
      // The kind travels inside the ciphertext: it decides where the note sits
      // in the heir's release bundle, and that is not the server's business.
      secret: JSON.stringify({ kind, title: draft.title.trim(), body }),
      meta: { itemCount: words },
    })
    if (saved) {
      // The plaintext draft must not outlive its ciphertext.
      draft.clear()
      router.back()
    }
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={draft.title.trim().length > 0 && body.trim().length > 0}
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="gap-4">
        <OptionChips
          options={[
            { value: "instructions", label: t.kindInstructions },
            { value: "whereabouts", label: t.kindWhereabouts },
            { value: "wish", label: t.kindWish },
          ]}
          value={kind}
          onChange={(value) => draft.update({ kind: value })}
        />

        <Field
          label={t.titleLabel}
          placeholder={t.titlePlaceholder}
          value={draft.title}
          onChangeText={(title) => draft.update({ title })}
          hint={draft.savedAt === null ? undefined : savedAgo(draft.savedAt, t, locale)}
        />

        {/* The page. `neutral-100` raised on the sand ground, generous leading,
            and no visible field border — the board's "letter on paper" reading
            comes from the surface, not from the toolbar. */}
        <View className="rounded-card bg-neutral-100 gap-3 p-4">
          <TextInput
            value={body}
            onChangeText={(next) => draft.update({ body: next })}
            onSelectionChange={(event) =>
              setSelection(event.nativeEvent.selection)
            }
            placeholder={PLACEHOLDER(t)[kind]}
            placeholderTextColor={MUTED_FOREGROUND}
            multiline
            textAlignVertical="top"
            className="min-h-52 text-[16px] leading-[1.9] text-foreground"
          />

          <NoteToolbar
            value={body}
            selection={selection}
            onChange={(next, caret) => {
              draft.update({ body: next })
              setSelection({ start: caret, end: caret })
            }}
            // Hidden entirely where the device has no on-device recogniser —
            // see `useDictation` for why degrading to cloud STT is not an option.
            onDictate={
              dictation.available
                ? dictation.listening
                  ? dictation.stop
                  : dictation.start
                : null
            }
            dictating={dictation.listening}
            labels={t}
          />

          <View className="flex-row items-center justify-between">
            <Text variant="metaSm" className="text-muted-foreground">
              {t.words.replace("{n}", fmtNum(words, locale))}
            </Text>
            <Text variant="metaSm" className="text-muted-foreground">
              {t.readOnRelease}
            </Text>
          </View>
        </View>

        <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
          {t.draftNote}
        </Text>
        <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
          {chrome.encryptNote}
        </Text>

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800">
            {error}
          </Text>
        ) : null}
      </View>
    </WizardFrame>
  )
}

/** "محفوظة على جهازك الآن" / "… قبل ٣ دقيقة". Minutes only — a letter is
 *  written over minutes, and seconds would tick under the reader's eyes. */
function savedAgo(
  savedAt: number,
  t: Record<string, string>,
  locale: "ar" | "en"
): string {
  const minutes = Math.floor((Date.now() - savedAt) / 60_000)
  return minutes < 1
    ? t.draftJustNow!
    : t.draftAgo!.replace("{n}", fmtNum(minutes, locale))
}

/** The pills' whole purpose: each kind opens with a different prompt. */
const PLACEHOLDER = (t: Record<string, string>) =>
  ({
    instructions: t.bodyInstructions!,
    whereabouts: t.bodyWhereabouts!,
    wish: t.bodyWish!,
  }) satisfies Record<NoteKind, string>

const KIND_LABEL = (t: Record<string, string>) =>
  ({
    instructions: t.kindInstructions!,
    whereabouts: t.kindWhereabouts!,
    wish: t.kindWish!,
  }) satisfies Record<NoteKind, string>
