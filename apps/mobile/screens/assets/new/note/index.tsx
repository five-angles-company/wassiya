/**
 * ٤.٨ — a note: "a letter, not a text field".
 *
 * A note is **written or spoken, never both**. The tabs under the title swap
 * the composer and nothing else: the kind pills, the title and the promise at
 * the foot belong to the note, not to the medium.
 *
 * Two things the drawing does not have, both deliberate:
 *
 *  - **Plain text, no formatting, and no strip of controls under the body.**
 *    The body is a UTF-8 string with no markers and no editor behind it, so it
 *    encrypts, round-trips, and renders in an executor's browser with nothing at
 *    either end that has to understand it. The bold/italic/list row was
 *    removed at the owner's request and must not come back; what sits under
 *    the composer is one line of text, not buttons.
 *  - **The composer sits on `--color-surface`, in both formats.** That is the
 *    grammar's card-around-a-secret, not a boxed input: the note *is* the
 *    secret, and the recorder is the same card, so the tabs change what you do
 *    rather than where you are.
 *  - **Dictation is on-device or absent** (`useDictation`), and it writes into
 *    the text body. It is not the voice note — a dictated note is read, a
 *    voice note is heard — which is why it sits in the text tab's meta row
 *    under its own word rather than as a bare microphone glyph.
 *
 * The text draft survives leaving the screen; the recording does not, and
 * `use-voice-note.ts` says why.
 */
import { useEffect } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { VoiceRecorder } from "@workspace/ui-native/components/wassiya/voice-recorder"
import { fmtDuration, fmtNum } from "@workspace/ui-native/lib/format"
import { cn } from "@workspace/ui-native/lib/utils"
import { router } from "expo-router"
import { Mic, Square } from "lucide-react-native"
import { Pressable, TextInput, View } from "react-native"

import { useDictation } from "@/hooks/use-dictation"
import { MAX_VOICE_MS, useVoiceNote, VOICE_MIME_TYPE } from "@/hooks/use-voice-note"
import { useStrings } from "@/i18n/use-strings"
import { readFileBytes } from "@/lib/asset-upload"
import { NoteFormatTabs } from "@/screens/assets/new/note/components/note-format-tabs"
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
  const voice = useVoiceNote()

  const kind = draft.kind as NoteKind
  const format = draft.format
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
  const take = voice.take
  const titled = draft.title.trim().length > 0
  const composed = format === "voice" ? take !== null : body.trim().length > 0

  async function save() {
    const subtitle =
      format === "voice" && take !== null
        ? `${KIND_LABEL(t)[kind]} · ${fmtDuration(take.durationMs / 1000, locale)}`
        : `${KIND_LABEL(t)[kind]} · ${t.words.replace("{n}", fmtNum(words, locale))}`

    const saved = await submit({
      type: "note",
      label: { title: draft.title.trim(), subtitle },
      // The kind and the format travel inside the ciphertext: they decide how
      // the note is read out, and that is not the server's business. `body`
      // stays present and empty on a voice note so a reader written for the
      // text shape never meets an absent field.
      secret: JSON.stringify(
        format === "voice"
          ? {
              kind,
              title: draft.title.trim(),
              format: "voice",
              durationMs: take?.durationMs ?? 0,
              body: "",
            }
          : { kind, title: draft.title.trim(), body }
      ),
      ...(format === "voice" && take !== null
        ? {
            files: [
              { read: () => readFileBytes(take.uri), byteSize: take.byteSize },
            ],
            meta: {
              itemCount: 1,
              byteSize: take.byteSize,
              mimeType: VOICE_MIME_TYPE,
            },
          }
        : { meta: { itemCount: words } }),
    })

    if (saved) {
      // Neither plaintext copy may outlive its ciphertext.
      draft.clear()
      voice.clear()
      router.replace({
        pathname: "/assets/[id]",
        params: { id: saved },
      })
    }
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={titled && composed}
      blockedLabel={
        !titled
          ? t.needsTitle
          : format === "voice"
            ? t.needsVoice
            : t.needsBody
      }
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="gap-4">
        <OptionChips
          options={[
            { value: "instructions", label: t.kindInstructions! },
            { value: "whereabouts", label: t.kindWhereabouts! },
            { value: "wish", label: t.kindWish! },
          ]}
          value={kind}
          onChange={(value) => draft.update({ kind: value })}
          className="mb-5"
        />

        {/* No labels from here down. A title, a rule, and prose — this is the
            one asset a family will *read* rather than use, and a labelled form
            around a letter turns it back into paperwork. */}
        <TextInput
          value={draft.title}
          onChangeText={(title) => draft.update({ title })}
          placeholder={t.titlePlaceholder}
          placeholderTextColor={MUTED_FOREGROUND}
          className="font-heading-extrabold text-foreground p-0 text-[22px] leading-[1.3]"
        />

        <NoteFormatTabs
          value={format}
          onChange={(next) => draft.update({ format: next })}
          textLabel={t.formatText!}
          voiceLabel={t.formatVoice!}
          // Switching mid-take would orphan the recording that is running.
          disabled={voice.state === "recording"}
          className="mb-4 mt-3.5"
        />

        {format === "text" ? (
          <>
            {/* The page is the letter's paper. Both composers sit on the same
                surface so switching tabs changes what you do, not where you
                are — and a written note is a secret, which is the one thing
                the vault's grammar does put a card around. */}
            <View className="rounded-card bg-card p-4">
              <TextInput
                value={body}
                onChangeText={(next) => draft.update({ body: next })}
                placeholder={PLACEHOLDER(t)[kind]}
                placeholderTextColor={MUTED_FOREGROUND}
                multiline
                textAlignVertical="top"
                className="text-foreground min-h-52 p-0 text-[15.5px] leading-[2.05]"
              />
            </View>

            {/* One line of text under the paper, never a strip of buttons. The
                count is never a limit either — nobody writing their last
                instructions should be counted down. */}
            <View className="mb-auto mt-3.5 flex-row items-center justify-between gap-3">
              <Text className="text-[11.5px] opacity-45">
                {`${t.words!.replace("{n}", fmtNum(words, locale))}${
                  draft.savedAt === null
                    ? ""
                    : ` · ${savedAgo(draft.savedAt, t, locale)}`
                }`}
              </Text>

              {/* Hidden entirely where the device has no on-device recogniser —
                  see `useDictation` for why degrading to cloud STT is not an
                  option. */}
              {dictation.available ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={dictation.listening ? dictation.stop : dictation.start}
                  className="flex-row items-center gap-1.5 active:opacity-60"
                >
                  <Icon
                    as={dictation.listening ? Square : Mic}
                    size={13}
                    className={cn(
                      dictation.listening
                        ? "text-terracotta-700"
                        : "text-muted-foreground"
                    )}
                  />
                  <Text
                    className={cn(
                      "font-body-semibold text-[11.5px]",
                      dictation.listening
                        ? "text-terracotta-700"
                        : "text-muted-foreground"
                    )}
                  >
                    {dictation.listening ? t.dictateStop : t.dictate}
                  </Text>
                </Pressable>
              ) : null}
            </View>

            <Text className="mt-4 text-[11px] leading-[1.7] opacity-45">
              {`${t.draftNote} · ${chrome.encryptNote}`}
            </Text>
          </>
        ) : (
          <View className="mb-auto">
            <VoiceRecorder
              state={voice.state}
              durationMs={voice.durationMs}
              levels={voice.levels}
              playing={voice.playing}
              onRecord={voice.start}
              onStop={voice.stop}
              onPlay={voice.play}
              onPause={voice.pause}
              onRerecord={voice.start}
              hint={t.voiceHint!.replace(
                "{n}",
                fmtNum(MAX_VOICE_MS / 60_000, locale)
              )}
              locale={locale}
            />

            {voice.error !== null ? (
              <Text className="text-terracotta-800 mt-3 text-[11.5px] leading-[1.7]">
                {voice.error === "permission" ? t.micDenied : t.micFailed}
              </Text>
            ) : null}

            <Text className="mt-4 text-[11px] leading-[1.7] opacity-45">
              {t.voiceNote}
            </Text>
          </View>
        )}

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800 mt-3">
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
