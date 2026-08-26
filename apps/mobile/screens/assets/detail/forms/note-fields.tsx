import { ChoiceRow } from "@workspace/ui-native/components/wassiya/choice-row"
import { EditableRow } from "@workspace/ui-native/components/wassiya/editable-row"
import type { Locale } from "@workspace/ui-native/lib/labels"

import {
  kindLabel,
  NOTE_KINDS,
  wordCount,
  type NoteForm,
  type NoteKind,
} from "@/screens/assets/detail/forms/note"

/**
 * ٤.٨'s fields, as rows.
 *
 * ## The body is open, and it is not masked
 *
 * A note is prose the owner wrote to be read. Collapsing it behind a word count
 * would make the screen hide the only thing on it, and putting an eye in front
 * of it would make re-reading your own letter a challenge to pass. Masking is
 * for credentials — a password, a phrase, a recovery code — where the value is
 * transcribed rather than read and a shoulder over yours is the threat.
 *
 * The whole screen is still under the screenshot guard, and the body is still
 * encrypted at rest under the asset's own DEK.
 *
 * ## The placeholder follows the kind
 *
 * Same three kinds and same three prompts the wizard uses. "Where the safe key
 * is" and "what I want done with my mother's things" are different pieces of
 * writing, and the prompt is what tells an owner which one this note is.
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

export function NoteFields({ value, onChange, note }: NoteFieldsProps) {
  const words = wordCount(value.body)

  return (
    <>
      <ChoiceRow
        label={note.title!}
        value={value.kind}
        onChange={(kind) => onChange({ kind: kind as NoteKind })}
        options={NOTE_KINDS.map((kind) => ({
          value: kind,
          label: kindLabel(kind, note),
        }))}
        divider
      />
      <EditableRow
        label={note.titleLabel!}
        value={value.title}
        onChangeText={(title) => onChange({ title })}
        placeholder={note.titlePlaceholder}
        divider
      />
      <EditableRow
        label={note.words!.replace("{n}", String(words))}
        value={value.body}
        onChangeText={(body) => onChange({ body })}
        placeholder={note[BODY_PLACEHOLDER[value.kind]]}
        expand
        defaultOpen
        editorClassName="min-h-52 leading-[1.9]"
        summary={words > 0 ? value.body : "—"}
      />
    </>
  )
}
