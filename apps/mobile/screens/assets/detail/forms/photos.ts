/**
 * The album form: photos and videos. Each item is a file with its thumbnail
 * beside it, so removing one removes one entry and adding appends entries.
 *
 * The secret is `{ items }`, one entry per file **in file order** — what each
 * file is, which the executor's browser needs to name a download. Every edit
 * that reorders or drops a file must move its entry with it; an album saved
 * before videos has no secret, and every item in it is a photo.
 */
import { readSecretObject } from "@/screens/assets/detail/forms/secret-json"
import type {
  EditPayload,
  EditSource,
  SourceFile,
} from "@/screens/assets/detail/forms/source"

export type MediaKind = "photo" | "video"

/** What the sealed secret records about one file. */
export type MediaItem = { kind: MediaKind; mimeType?: string; durationMs?: number }

/** A stored item that survives this edit. */
export type StoredMedia = MediaItem & { file: SourceFile }

/**
 * An item chosen on this screen, not yet encrypted. `thumbnailUri` is a
 * plaintext JPEG in the cache — whoever made it deletes it.
 */
export type PickedMedia = MediaItem & { uri: string; size: number; thumbnailUri: string | null }

export type PhotosForm = {
  album: string
  kept: StoredMedia[]
  /** Bytes of the stored items, for the storage counter. */
  keptBytes: number
  added: PickedMedia[]
}

const PHOTO: MediaItem = { kind: "photo" }

export function parsePhotos({ secret, title, meta, files }: EditSource): PhotosForm | null {
  const items = secret === "" ? [] : readItems(secret)
  if (items === null) return null
  return {
    // The album's name lives in the sealed label, like every other type's.
    album: title,
    kept: files.map((file, i) => ({ ...(items[i] ?? PHOTO), file })),
    keptBytes: meta.byteSize ?? 0,
    added: [],
  }
}

function readItems(secret: string): MediaItem[] | null {
  const raw = readSecretObject(secret, ["items"])?.items
  if (!Array.isArray(raw)) return null
  return raw.map((entry: unknown): MediaItem => {
    if (typeof entry !== "object" || entry === null) return PHOTO
    const { kind, mimeType, durationMs } = entry as Record<string, unknown>
    return {
      kind: kind === "video" ? "video" : "photo",
      mimeType: typeof mimeType === "string" ? mimeType : undefined,
      durationMs: typeof durationMs === "number" && Number.isFinite(durationMs) ? durationMs : undefined,
    }
  })
}

/** How many items the album will hold once saved. */
export function mediaCount(form: PhotosForm): number {
  return form.kept.length + form.added.length
}

/** Drop one item, counting stored ones first and then added ones. */
export function removeMedia(form: PhotosForm, index: number): Partial<PhotosForm> {
  if (index < form.kept.length) {
    return { kept: form.kept.filter((_, i) => i !== index) }
  }
  const addedIndex = index - form.kept.length
  return { added: form.added.filter((_, i) => i !== addedIndex) }
}

export function toPhotosPayload(
  form: PhotosForm,
  labels: Record<string, string>,
  formatCount: (n: number) => string
): EditPayload {
  const count = mediaCount(form)
  const addedBytes = form.added.reduce((sum, item) => sum + item.size, 0)
  const items: MediaItem[] = [...form.kept, ...form.added].map(
    ({ kind, mimeType, durationMs }) => ({ kind, mimeType, durationMs })
  )
  return {
    secret: JSON.stringify({ items }),
    label: {
      title: form.album.trim(),
      subtitle: labels.selected!.replace("{n}", formatCount(count)),
    },
    meta: {
      itemCount: count,
      byteSize: form.keptBytes + addedBytes,
      mimeType: albumMimeType(items),
    },
  }
}

function albumMimeType(items: MediaItem[]): string {
  if (items.every((item) => item.kind === "photo")) return "image/*"
  if (items.every((item) => item.kind === "video")) return "video/*"
  return "multipart/mixed"
}

export function isPhotosValid(form: PhotosForm): boolean {
  return form.album.trim().length > 0 && mediaCount(form) > 0
}
