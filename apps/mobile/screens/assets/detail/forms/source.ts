import type { Id } from "@workspace/backend/dataModel"

/** One stored file as `assets.get` hands it back. */
export type SourceFile = {
  storageId: Id<"_storage">
  thumbnailId: Id<"_storage"> | null
  url: string | null
  thumbnailUrl: string | null
}

/**
 * What a type's parser gets to work with.
 *
 * The secret is not always enough on its own. A crypto wallet's *name* lives
 * only in the sealed label, and the file types keep everything they can show in
 * `meta`. So every parser receives the opened label and the files alongside the
 * secret, and each decides what it needs.
 *
 * Uniform across all six types even where a type ignores some fields, because
 * the alternative is six different parser signatures and a `useEditForm` that
 * cannot be generic over them.
 */
export type EditSource = {
  /** The opened secret — the type's fields as JSON — or `""` for a type without one. */
  secret: string
  /** `label.title` — for the types that keep their name only there. */
  title: string
  /** `label.subtitle` — carried forward verbatim where it cannot be rebuilt. */
  subtitle: string
  /** The row's plaintext counters. */
  meta: { itemCount?: number; byteSize?: number; mimeType?: string }
  /** The stored files, in order. */
  files: SourceFile[]
}

/** What a type's form turns back into. */
export type EditPayload = {
  /** Absent for a type whose secret this form does not rewrite. */
  secret?: string
  label: { title: string; subtitle?: string }
  meta?: { itemCount?: number; byteSize?: number; mimeType?: string }
}
