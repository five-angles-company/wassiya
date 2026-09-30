/**
 * ٤.٨ — a note, as steps: what kind and its title, then the note itself.
 *
 * - **Plain text, no formatting.** The body is a UTF-8 string with no markers,
 *   so it encrypts, round-trips and renders in an executor's browser with
 *   nothing at either end that has to understand it. A formatting toolbar was
 *   removed at the owner's request and must not come back.
 * - **Written or spoken, never both,** and the format is fixed once saved:
 *   swapping one for the other is writing a different note.
 * - **Dictation is on-device or absent** (`useDictation`) and writes into the
 *   text. It is not the voice note — a dictated note is read, a voice note is
 *   heard.
 */
import { useEffect } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { NATIVE_COLOR } from "@workspace/ui-native/lib/native-colors"
import { VoiceRecorder } from "@workspace/ui-native/components/wassiya/voice-recorder"
import { fmtDuration, fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { cn } from "@workspace/ui-native/lib/utils"
import {
  AudioLines,
  Heart,
  ListChecks,
  MapPin,
  Mic,
  Pause,
  Play,
  Square,
} from "lucide-react-native"
import { Pressable, TextInput, View } from "react-native"

import { Field } from "@/components/field"
import { useDictation } from "@/hooks/use-dictation"
import { MAX_VOICE_MS, type useVoiceNote } from "@/hooks/use-voice-note"
import { useStrings } from "@/i18n/use-strings"
import {
  kindLabel,
  wordCount,
  type NoteFormat,
  type NoteKind,
} from "@/screens/assets/detail/forms/note"
import { ChoiceCards } from "@/screens/assets/flow/choice-cards"
import type { AssetSection, FlowStep } from "@/screens/assets/flow/types"
import { NoteFormatTabs } from "@/screens/assets/new/note/components/note-format-tabs"

export type NoteValue = {
  kind: NoteKind
  title: string
  format: NoteFormat
  body: string
}

export function useNoteSteps({
  value,
  onChange,
  formatLocked,
  voice,
  stored,
  draftLine,
}: {
  value: NoteValue
  onChange: (patch: Partial<NoteValue>) => void
  /** A saved note keeps its format. */
  formatLocked: boolean
  voice: ReturnType<typeof useVoiceNote>
  /** The saved recording, which stays until a new take replaces it. */
  stored: {
    durationMs: number
    byteSize: number
    playing: boolean
    loading: boolean
    onPlay: () => void
    onPause: () => void
  } | null
  /** Where an unsaved draft lives — creating only. */
  draftLine?: string
}): FlowStep[] {
  const { t, locale } = useStrings("assets/new/note")
  const { t: detail } = useStrings("assets/detail")
  const dictation = useDictation(locale)

  // Committed speech goes at the end, not the caret: the owner was speaking,
  // not pointing.
  useEffect(() => {
    if (dictation.transcript.length === 0) return
    onChange({
      body:
        value.body.length > 0
          ? `${value.body} ${dictation.transcript}`
          : dictation.transcript,
    })
    dictation.reset()
    // Reads the body of the render that saw the transcript; depending on it
    // would re-run this on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dictation.transcript])

  const words = wordCount(value.body)
  const showStored = stored !== null && voice.state === "idle"
  const composed =
    value.format === "voice"
      ? voice.take !== null || stored !== null
      : value.body.trim().length > 0

  const formatSize = (bytes: number) =>
    `${fmtNum(Math.round((bytes / 1024 / 1024) * 10) / 10, locale)} ${locale === "ar" ? "م.ب" : "MB"}`

  const placeholder = {
    instructions: t.bodyInstructions!,
    whereabouts: t.bodyWhereabouts!,
    wish: t.bodyWish!,
  }[value.kind]

  return [
    {
      key: "about",
      question: t.qAbout!,
      blocked: value.title.trim().length === 0 ? t.needsTitle! : null,
      content: (
        <View className="gap-5">
          <ChoiceCards<NoteKind>
            options={[
              { value: "instructions", title: t.kindInstructions!, detail: t.kindInstructionsDetail, icon: ListChecks },
              { value: "whereabouts", title: t.kindWhereabouts!, detail: t.kindWhereaboutsDetail, icon: MapPin },
              { value: "wish", title: t.kindWish!, detail: t.kindWishDetail, icon: Heart },
            ]}
            value={value.kind}
            onChange={(kind) => onChange({ kind })}
          />
          <Field
            label={t.titleLabel!}
            placeholder={t.titlePlaceholder}
            value={value.title}
            onChangeText={(title) => onChange({ title })}
          />
        </View>
      ),
    },
    {
      key: "body",
      question: t.qBody!,
      blocked: composed ? null : value.format === "voice" ? t.needsVoice! : t.needsBody!,
      content: (
        <View className="gap-3.5">
          {formatLocked ? null : (
            <NoteFormatTabs
              value={value.format}
              onChange={(format) => onChange({ format })}
              textLabel={t.formatText!}
              voiceLabel={t.formatVoice!}
              // Switching mid-take would orphan the recording that is running.
              disabled={voice.state === "recording"}
            />
          )}

          {value.format === "text" ? (
            <>
              <View className="rounded-box border-border bg-card border p-4">
                <TextInput
                  value={value.body}
                  onChangeText={(body) => onChange({ body })}
                  placeholder={placeholder}
                  placeholderTextColor={NATIVE_COLOR.mutedForeground}
                  multiline
                  textAlignVertical="top"
                  className="text-foreground min-h-56 p-0 text-[15.5px] leading-[2.05]"
                />
              </View>
              {/* One line under the paper, never a strip of buttons, and the
                  count is never a limit. */}
              <View className="flex-row items-center justify-between gap-3">
                <Text variant="metaSm">
                  {[t.words!.replace("{n}", fmtNum(words, locale)), draftLine]
                    .filter((part) => part !== undefined && part.length > 0)
                    .join(" · ")}
                </Text>
                {dictation.available ? (
                  <Pressable
                    accessibilityRole="button"
                    onPress={dictation.listening ? dictation.stop : dictation.start}
                    className="flex-row items-center gap-1.5 active:opacity-60"
                  >
                    <Icon
                      as={dictation.listening ? Square : Mic}
                      size={13}
                      className={dictation.listening ? "text-terracotta-700" : "text-muted-foreground"}
                    />
                    <Text
                      className={cn(
                        "font-body-semibold text-[11.5px]",
                        dictation.listening ? "text-terracotta-700" : "text-muted-foreground"
                      )}
                    >
                      {dictation.listening ? t.dictateStop : t.dictate}
                    </Text>
                  </Pressable>
                ) : null}
              </View>
            </>
          ) : showStored ? (
            <View className="gap-3.5">
              <View className="rounded-card bg-card flex-row items-center gap-3 px-4 py-4">
                <View className="bg-background size-10.5 shrink-0 items-center justify-center rounded-full">
                  <Icon as={AudioLines} size={20} strokeWidth={2.75} className="text-terracotta-800" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="font-body-semibold text-[16px]">
                    {fmtDuration(stored.durationMs / 1000, locale)}
                  </Text>
                  <Text variant="metaSm" numberOfLines={1} className="mt-0.5">
                    {`${detail.recordingRowLabel} · ${formatSize(stored.byteSize)}`}
                  </Text>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={stored.playing ? detail.pauseListening : detail.listen}
                  onPress={stored.playing ? stored.onPause : stored.onPlay}
                  disabled={stored.loading}
                  className={cn(
                    "bg-background size-10.5 shrink-0 items-center justify-center rounded-full active:opacity-70",
                    stored.loading && "opacity-50"
                  )}
                >
                  <Icon
                    as={stored.playing ? Pause : Play}
                    size={18}
                    strokeWidth={2.75}
                    className="text-foreground"
                  />
                </Pressable>
              </View>
              <Pressable
                accessibilityRole="button"
                onPress={() => {
                  stored.onPause()
                  voice.start()
                }}
                className="bg-card h-11.5 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
              >
                <Icon as={Mic} size={16} strokeWidth={2.75} className="text-foreground" />
                <Text className="font-body-semibold text-[13.5px]">{t.rerecord}</Text>
              </Pressable>
              <Text variant="footnote">{t.voiceStoredNote}</Text>
            </View>
          ) : (
            <>
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
                hint={t.voiceHint!.replace("{n}", fmtNum(MAX_VOICE_MS / 60_000, locale))}
                locale={locale}
              />
              {stored !== null && voice.take !== null ? (
                <Text variant="metaSm" className="text-terracotta-800">
                  {detail.pendingReplace}
                </Text>
              ) : null}
              <Text variant="footnote">{t.voiceNote}</Text>
            </>
          )}

          {voice.error !== null && value.format === "voice" ? (
            <Text className="text-terracotta-800 text-[11.5px] leading-[1.7]">
              {voice.error === "permission" ? t.micDenied : t.micFailed}
            </Text>
          ) : null}
        </View>
      ),
    },
  ]
}

export function noteSections(
  form: NoteValue & { durationMs: number },
  t: Record<string, string>,
  locale: Locale
): AssetSection[] {
  const firstLine = form.body.trim().split(/\n/u)[0] ?? ""
  return [
    {
      step: "about",
      label: t.sectionAbout!,
      value: `${kindLabel(form.kind, t)} · ${form.title.trim()}`,
    },
    {
      step: "body",
      label: t.sectionBody!,
      value:
        form.format === "voice"
          ? t.voiceSummary!.replace("{d}", fmtDuration(form.durationMs / 1000, locale))
          : firstLine.length > 80
            ? `${firstLine.slice(0, 80)}…`
            : firstLine,
      secret: true,
    },
  ]
}
