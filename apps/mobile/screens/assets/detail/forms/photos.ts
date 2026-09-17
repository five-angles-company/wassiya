/**
 * The photo-album "payload", which is a layout rather than a blob: ٤.٦ stores
 * `[...originals, ...thumbnails]` in one array, split at `meta.itemCount`, so
 * this codec reads the shape of `storageIds` where other types read a decrypted
 * string.
 *
 * **The split index is load-bearing** — get it wrong and an heir opens the album
 * to a gallery of thumbnails. Removing a photo must drop two ids, and adding
 * photos cannot simply append: new originals belong with the old originals,
 * ahead of every thumbnail. `toPhotosArrangement` is where that ordering lives.
 *
 * Thumbnails are best-effort and may not exist, so `storageIds.length` may be
 * `itemCount` rather than twice it. Every read here tolerates a short or missing
 * second half rather than assuming the pair.
 */
import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"

/** A photo chosen on this screen, not yet encrypted. */
export type PickedPhoto = { uri: string; size: number }

export type PhotosForm = {
  album: string
  /** Stored originals that survive this edit, in order. */
  keptOriginals: string[]
  /** Their thumbnails, index-parallel where one exists. */
  keptThumbs: (string | undefined)[]
  /** Bytes of the kept originals, for the storage counter. */
  keptBytes: number
  added: PickedPhoto[]
}

export function parsePhotos({ title, meta, storageIds }: EditSource): PhotosForm {
  const count = meta.itemCount ?? storageIds.length
  return {
    // The album's name lives in the sealed label, like every other type's.
    album: title,
    keptOriginals: storageIds.slice(0, count),
    keptThumbs: storageIds.slice(count),
    keptBytes: meta.byteSize ?? 0,
    added: [],
  }
}

/** How many photos the album will hold once saved. */
export function photoCount(form: PhotosForm): number {
  return form.keptOriginals.length + form.added.length
}

/** Drop one photo — and the thumbnail that belongs to it. */
export function removePhoto(form: PhotosForm, index: number): Partial<PhotosForm> {
  if (index < form.keptOriginals.length) {
    return {
      keptOriginals: form.keptOriginals.filter((_, i) => i !== index),
      keptThumbs: form.keptThumbs.filter((_, i) => i !== index),
    }
  }
  const addedIndex = index - form.keptOriginals.length
  return { added: form.added.filter((_, i) => i !== addedIndex) }
}

export function toPhotosPayload(
  form: PhotosForm,
  labels: Record<string, string>,
  formatCount: (n: number) => string
): EditPayload {
  const count = photoCount(form)
  const addedBytes = form.added.reduce((sum, photo) => sum + photo.size, 0)
  return {
    label: {
      title: form.album.trim(),
      subtitle: labels.selected!.replace("{n}", formatCount(count)),
    },
    meta: {
      itemCount: count,
      byteSize: form.keptBytes + addedBytes,
      mimeType: "image/*",
    },
  }
}

/**
 * Compose the final `storageIds` from the ids just uploaded.
 *
 * `uploaded` arrives as `[...newOriginals, ...newThumbnails]`, in the order the
 * files were handed to the uploader. The album needs every original first, so
 * the two halves are interleaved back into place here rather than appended —
 * see the note at the top of this file for what appending would cost.
 */
export function toPhotosArrangement(
  form: PhotosForm,
  uploaded: string[]
): string[] {
  const added = form.added.length
  const newOriginals = uploaded.slice(0, added)
  const newThumbs = uploaded.slice(added)
  return [
    ...form.keptOriginals,
    ...newOriginals,
    ...form.keptThumbs.filter((id): id is string => id !== undefined),
    ...newThumbs,
  ]
}

export function isPhotosValid(form: PhotosForm): boolean {
  return form.album.trim().length > 0 && photoCount(form) > 0
}
