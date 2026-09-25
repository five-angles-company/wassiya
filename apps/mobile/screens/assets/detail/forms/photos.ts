/**
 * The photo-album form. An album has no secret: it is its files, each a photo
 * with its thumbnail beside it, so removing a photo removes one entry and
 * adding photos appends entries.
 */
import type {
  EditPayload,
  EditSource,
  SourceFile,
} from "@/screens/assets/detail/forms/source"

/** A photo chosen on this screen, not yet encrypted. */
export type PickedPhoto = { uri: string; size: number }

export type PhotosForm = {
  album: string
  /** Stored photos that survive this edit, in order. */
  kept: SourceFile[]
  /** Bytes of the stored photos, for the storage counter. */
  keptBytes: number
  added: PickedPhoto[]
}

export function parsePhotos({ title, meta, files }: EditSource): PhotosForm {
  return {
    // The album's name lives in the sealed label, like every other type's.
    album: title,
    kept: files,
    keptBytes: meta.byteSize ?? 0,
    added: [],
  }
}

/** How many photos the album will hold once saved. */
export function photoCount(form: PhotosForm): number {
  return form.kept.length + form.added.length
}

/** Drop one photo, counting stored ones first and then added ones. */
export function removePhoto(form: PhotosForm, index: number): Partial<PhotosForm> {
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

export function isPhotosValid(form: PhotosForm): boolean {
  return form.album.trim().length > 0 && photoCount(form) > 0
}
