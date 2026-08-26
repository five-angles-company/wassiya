/**
 * The encrypted-note payload, in both directions.
 *
 * ## ⚠️ This must never touch `stores/note-draft.ts`
 *
 * The wizard keeps a note-in-progress in a **persisted Zustand store**, backed
 * by AsyncStorage in the clear. That store's own header scopes it to a draft
 * being typed and says so plainly: *"A seed phrase or a password draft would
 * not be acceptable here."*
 *
 * Prefilling it from an edit would write a **decrypted note body to unencrypted
 * device storage** — the exact thing it excludes. It would also collide: it is
 * one module-level singleton, so opening an edit would clobber a half-written
 * new note, and either screen's `clear()` on save would wipe the other.
 *
 * So the edit screen holds its note in local component state, and this module
 * has no import of that store and must never gain one.
 */
import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"

export type NoteKind = "instructions" | "whereabouts" | "wish"

export const NOTE_KINDS: NoteKind[] = ["instructions", "whereabouts", "wish"]

export type NoteForm = {
  kind: NoteKind
  title: string
  body: string
}

export function parseNote({ secret }: EditSource): NoteForm | null {
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
  return {
    kind: NOTE_KINDS.includes(kind as NoteKind)
      ? (kind as NoteKind)
      : "instructions",
    title: str("title"),
    body: str("body"),
  }
}

/** The wizard's own count, so the subtitle does not drift between the two. */
export function wordCount(body: string): number {
  return body.trim().length === 0 ? 0 : body.trim().split(/\s+/u).length
}

export function toNotePayload(
  form: NoteForm,
  labels: Record<string, string>,
  formatCount: (n: number) => string
): EditPayload {
  const words = wordCount(form.body)
  return {
    label: {
      title: form.title.trim(),
      subtitle: `${kindLabel(form.kind, labels)} · ${labels.words!.replace("{n}", formatCount(words))}`,
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

export function isNoteValid(form: NoteForm): boolean {
  return form.title.trim().length > 0 && form.body.trim().length > 0
}
