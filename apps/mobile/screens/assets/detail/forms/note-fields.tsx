import { Text } from "@workspace/ui-native/components/ui/text"
import { ChoiceField } from "@workspace/ui-native/components/wassiya/choice-field"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { TextInput, View } from "react-native"

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
 * for a value, and here they are reading a sentence someone wrote to them.
 *
 * The word count sits quietly at the end and is never a limit. Nobody writing
 * their last instructions should be counted down.
 *
 * The **kind** keeps a labelled row, because it is metadata about the letter
 * rather than part of it, and it changes the placeholder — which is the only
 * guidance this screen offers about what to write.
 */
export type NoteFieldsProps = {
  value: NoteForm
  onChange: (patch: Partial<NoteForm>) => void
  /** The `assets/new/note` dictionary. */
  note: Record<string, string>
  locale: Locale
}

const BODY_PLACEHOLDER: Record<NoteKind, string> = {
  instructions: "bodyInstructions",
  whereabouts: "bodyWhereabouts",
  wish: "bodyWish",
}

export function NoteFields({ value, onChange, note, locale }: NoteFieldsProps) {
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

      <TextInput
        value={value.body}
        onChangeText={(body) => onChange({ body })}
        placeholder={note[BODY_PLACEHOLDER[value.kind]]}
        placeholderTextColor="#82796a"
        multiline
        textAlignVertical="top"
        className="text-foreground min-h-52 p-0 text-[15.5px] leading-[2.05]"
      />

      <Text className="mb-[22px] mt-4 text-[11.5px] opacity-45">
        {note.words!.replace("{n}", fmtNum(words, locale))}
      </Text>

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
