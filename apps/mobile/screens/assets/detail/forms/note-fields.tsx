import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChoiceField } from "@workspace/ui-native/components/wassiya/choice-field"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { VoiceRecorder } from "@workspace/ui-native/components/wassiya/voice-recorder"
import { fmtDuration, fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { AudioLines, Mic } from "lucide-react-native"
import { Pressable, TextInput, View } from "react-native"

import type { VoiceNoteState } from "@/hooks/use-voice-note"
import {
  kindLabel,
  NOTE_KINDS,
  wordCount,
  type NoteForm,
  type NoteKind,
} from "@/screens/assets/detail/forms/note"

/**
 * ٤.٨ — the one screen in the vault with **no field labels at all**.
 *
 * A title in Cairo 800, a rule, and prose. It should feel like paper, because
 * this is the one asset a family will *read* rather than use — a letter, not a
 * record. Labels over a letter would turn it back into a form.
 *
 * The body runs at 15.5px on 2.05 line-height, which is looser than anything
 * else in the app. That is deliberate: everywhere else the reader is scanning
 * for a value, and here they are reading a sentence someone wrote to them. It
 * sits on `--color-surface` — the grammar's card-around-a-secret, matching the
 * wizard and the recorder, not a boxed input.
 *
 * ## A stored recording is a row, not a player
 *
 * The saved take is ciphertext, and decrypting it for playback would put the
 * owner's voice in the cache as a plain `.m4a` with nothing owning its
 * deletion — the same reason ٤.٦ never fetches an original. So the row states
 * what is there and offers the one thing this screen can do honestly: record a
 * new take, which *is* playable, because it has not been sealed yet.
 *
 * **The format is fixed.** A note is written or spoken from the moment it is
 * saved; turning one into the other is writing a different note, so there is no
 * switch here.
 */
export type NoteFieldsProps = {
  value: NoteForm
  onChange: (patch: Partial<NoteForm>) => void
  /** The `assets/new/note` dictionary. */
  note: Record<string, string>
  /** The `assets/detail` dictionary. */
  labels: Record<string, string>
  locale: Locale
  formatSize: (bytes: number) => string
  /** Present only while the note is a voice note. */
  voice?: {
    state: VoiceNoteState
    durationMs: number
    levels: number[]
    playing: boolean
    /** A new take is waiting for Save. */
    staged: boolean
    onRecord: () => void
    onStop: () => void
    onPlay: () => void
    onPause: () => void
  }
  notice: string | null
}

const BODY_PLACEHOLDER: Record<NoteKind, string> = {
  instructions: "bodyInstructions",
  whereabouts: "bodyWhereabouts",
  wish: "bodyWish",
}

export function NoteFields({
  value,
  onChange,
  note,
  labels,
  locale,
  formatSize,
  voice,
  notice,
}: NoteFieldsProps) {
  const words = wordCount(value.body)

  return (
    <>
      {/* The title is the letter's own heading, so it is set like one. */}
      <TextInput
        value={value.title}
        onChangeText={(title) => onChange({ title })}
        placeholder={note.titlePlaceholder}
        placeholderTextColor="#82796a"
        className="font-heading-extrabold text-foreground p-0 text-[22px] leading-[1.3]"
      />

      <View className="bg-border mb-4 mt-3.5 h-px" />

      {value.format === "voice" ? (
        <VoiceSection
          value={value}
          note={note}
          labels={labels}
          locale={locale}
          formatSize={formatSize}
          voice={voice}
          notice={notice}
        />
      ) : (
        <>
          <View className="rounded-card bg-card p-4">
            <TextInput
              value={value.body}
              onChangeText={(body) => onChange({ body })}
              placeholder={note[BODY_PLACEHOLDER[value.kind]]}
              placeholderTextColor="#82796a"
              multiline
              textAlignVertical="top"
              className="text-foreground min-h-52 p-0 text-[15.5px] leading-[2.05]"
            />
          </View>

          <Text className="mb-[22px] mt-3.5 text-[11.5px] opacity-45">
            {note.words!.replace("{n}", fmtNum(words, locale))}
          </Text>
        </>
      )}

      <View className="bg-border h-px" />

      <FieldRow label={note.title!}>
        <ChoiceField
          label={note.title!}
          value={value.kind}
          onChange={(kind) => onChange({ kind: kind as NoteKind })}
          options={NOTE_KINDS.map((kind) => ({
            value: kind,
            label: kindLabel(kind, note),
          }))}
        />
      </FieldRow>
    </>
  )
}

function VoiceSection({
  value,
  note,
  labels,
  locale,
  formatSize,
  voice,
  notice,
}: Pick<
  NoteFieldsProps,
  "value" | "note" | "labels" | "locale" | "formatSize" | "voice" | "notice"
>) {
  const staged = voice?.staged ?? false

  return (
    <View className="mb-[22px]">
      {voice !== undefined && voice.state !== "idle" ? (
        <VoiceRecorder
          state={voice.state}
          durationMs={voice.durationMs}
          levels={voice.levels}
          playing={voice.playing}
          onRecord={voice.onRecord}
          onStop={voice.onStop}
          onPlay={voice.onPlay}
          onPause={voice.onPause}
          onRerecord={voice.onRecord}
          locale={locale}
        />
      ) : (
        <View className="flex-row items-center gap-3">
          <View className="bg-card size-[42px] shrink-0 items-center justify-center rounded-[14px]">
            <Icon
              as={AudioLines}
              size={20}
              strokeWidth={2.75}
              className="text-terracotta-800"
            />
          </View>
          <View className="min-w-0 flex-1">
            <Text className="font-body-semibold text-foreground text-[16px]">
              {fmtDuration(value.durationMs / 1000, locale)}
            </Text>
            <Text numberOfLines={1} className="mt-0.5 text-[11.5px] opacity-50">
              {`${labels.recordingRowLabel} · ${formatSize(value.current.byteSize)}`}
            </Text>
          </View>
        </View>
      )}

      {staged ? (
        <Text className="text-terracotta-800 mt-2.5 text-[11.5px] leading-[1.6]">
          {labels.pendingReplace}
        </Text>
      ) : null}

      {voice !== undefined && voice.state === "idle" ? (
        <Pressable
          accessibilityRole="button"
          onPress={voice.onRecord}
          className="bg-card mt-3.5 h-11 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
        >
          <Icon as={Mic} size={16} strokeWidth={2.75} className="text-foreground" />
          <Text className="font-body-semibold text-[13.5px]">
            {note.rerecord}
          </Text>
        </Pressable>
      ) : null}

      {notice !== null ? (
        <Text className="text-terracotta-800 mt-2.5 text-[11.5px] leading-[1.6]">
          {notice}
        </Text>
      ) : null}

      <Text className="mt-3.5 text-[11px] leading-[1.7] opacity-45">
        {note.voiceStoredNote}
      </Text>
    </View>
  )
}
