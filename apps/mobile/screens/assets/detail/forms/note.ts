/**
 * The encrypted-note payload, in both directions.
 *
 * ⚠️ **This must never touch `stores/note-draft.ts`.** That store is persisted
 * to AsyncStorage in the clear and is scoped to a draft being typed; prefilling
 * it from an edit would write a decrypted note body to unencrypted device
 * storage. It is also one module-level singleton, so an edit would clobber a
 * half-written new note and either screen's `clear()` would wipe the other.
 *
 * The edit screen holds its note in local component state, and this module has
 * no import of that store and must never gain one.
 *
 * A note is written or spoken. `format` absent means text, which is every note
 * saved before ٤.٨ had a second composer — and the **format cannot be changed
 * by an edit**: swapping one for the other is discarding the note and writing a
 * different one, so the screen offers a new take or a new body, never a swap.
 * A voice note's recording is its one stored file.
 */
import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"

export type NoteKind = "instructions" | "whereabouts" | "wish"

export const NOTE_KINDS: NoteKind[] = ["instructions", "whereabouts", "wish"]

export type NoteFormat = "text" | "voice"

/**
 * A take recorded on the edit screen, staged rather than applied.
 *
 * It is deliberately **not** part of {@link NoteForm}: the recorder already
 * holds it, and copying it into the form would mean an effect syncing one into
 * the other. Save takes it as an argument instead, and the screen adds
 * "a take exists" to its own dirty check.
 */
export type StagedTake = {
  uri: string
  durationMs: number
  byteSize: number
}

export type NoteForm = {
  kind: NoteKind
  format: NoteFormat
  title: string
  body: string
  /** The stored take's length, until a new take supersedes it. */
  durationMs: number
  /** What the row currently holds, for the row that reports it. */
  current: { byteSize: number }
  /** A stored recording survives every edit that does not replace it. */
  hasRecording: boolean
}

export function parseNote({ secret, meta, files }: EditSource): NoteForm | null {
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(secret)
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null
    }
    data = parsed as Record<string, unknown>
  } catch {
    return null
  }

  if (!("body" in data) && !("title" in data)) return null

  const str = (key: string): string =>
    typeof data[key] === "string" ? (data[key] as string) : ""

  const kind = str("kind")
  // A stored file is what makes a note audible; the flag alone would leave the
  // screen offering a player over a recording that is not there.
  const format: NoteFormat =
    str("format") === "voice" && files.length > 0 ? "voice" : "text"

  return {
    kind: NOTE_KINDS.includes(kind as NoteKind)
      ? (kind as NoteKind)
      : "instructions",
    format,
    title: str("title"),
    body: str("body"),
    durationMs:
      typeof data.durationMs === "number" ? (data.durationMs as number) : 0,
    current: { byteSize: meta.byteSize ?? 0 },
    hasRecording: files.length > 0,
  }
}

/** The wizard's own count, so the subtitle does not drift between the two. */
export function wordCount(body: string): number {
  return body.trim().length === 0 ? 0 : body.trim().split(/\s+/u).length
}

/** How the two formats render the numbers in a subtitle. */
export type NoteFormatters = {
  count: (n: number) => string
  duration: (ms: number) => string
}

export function toNotePayload(
  form: NoteForm,
  labels: Record<string, string>,
  format: NoteFormatters,
  mimeType: string,
  /** A take recorded on this visit, which supersedes what is stored. */
  take: StagedTake | null = null
): EditPayload {
  const kind = kindLabel(form.kind, labels)

  if (form.format === "voice") {
    const durationMs = take?.durationMs ?? form.durationMs
    const byteSize = take?.byteSize ?? form.current.byteSize
    return {
      label: {
        title: form.title.trim(),
        subtitle: `${kind} · ${format.duration(durationMs)}`,
      },
      secret: JSON.stringify({
        kind: form.kind,
        title: form.title.trim(),
        format: "voice",
        durationMs,
        body: "",
      }),
      meta: { itemCount: 1, byteSize, mimeType },
    }
  }

  const words = wordCount(form.body)
  return {
    label: {
      title: form.title.trim(),
      subtitle: `${kind} · ${labels.words!.replace("{n}", format.count(words))}`,
    },
    secret: JSON.stringify({
      kind: form.kind,
      title: form.title.trim(),
      body: form.body,
    }),
    meta: { itemCount: words },
  }
}

export function kindLabel(
  kind: NoteKind,
  labels: Record<string, string>
): string {
  return {
    instructions: labels.kindInstructions!,
    whereabouts: labels.kindWhereabouts!,
    wish: labels.kindWish!,
  }[kind]
}

export function isNoteValid(form: NoteForm, take: StagedTake | null = null): boolean {
  if (form.title.trim().length === 0) return false
  return form.format === "voice"
    ? take !== null || form.hasRecording
    : form.body.trim().length > 0
}
