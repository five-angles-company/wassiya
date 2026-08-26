/**
 * What a type's parser gets to work with.
 *
 * The decrypted payload is not always enough on its own. A crypto wallet's
 * *name* lives only in the sealed label — the phrase blob is the phrase and
 * nothing else — and a legacy phrase's network survives only inside the
 * localised subtitle. So every parser receives the opened label alongside the
 * payload, and each decides what it needs.
 *
 * Uniform across all six types even where a type ignores two of the three
 * fields, because the alternative is six different parser signatures and a
 * `useEditForm` that cannot be generic over them.
 */
export type EditSource = {
  /** The decrypted payload blob. */
  secret: string
  /** `label.title` — for the types that keep their name only there. */
  title: string
  /** `label.subtitle` — carried forward verbatim where it cannot be rebuilt. */
  subtitle: string
  /**
   * The row's plaintext counters. The file types keep everything they can show
   * here — a count, a size, a mime type — because they have no payload to read
   * it out of.
   */
  meta: { itemCount?: number; byteSize?: number; mimeType?: string }
  /** The blobs currently on the row, in stored order. */
  storageIds: string[]
  /** Signed download URLs, index-parallel to {@link storageIds}. */
  urls: (string | null)[]
}

/** What a type's form turns back into. */
export type EditPayload = {
  /** Absent for the file types, which store files and no payload blob. */
  secret?: string
  label: { title: string; subtitle?: string }
  meta?: { itemCount?: number; byteSize?: number; mimeType?: string }
}
