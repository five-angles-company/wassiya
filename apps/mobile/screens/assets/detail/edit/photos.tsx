import { useState } from "react"
import type { Id } from "@workspace/backend/dataModel"
import { fmtNum } from "@workspace/ui-native/lib/format"
import * as ImagePicker from "expo-image-picker"

import { useStrings } from "@/i18n/use-strings"
import { discardLocalFile, readFileBytes } from "@/lib/asset-upload"
import { makeThumbnail } from "@/lib/thumbnail"
import { AssetEditFrame } from "@/screens/assets/detail/edit-frame"
import { PhotosFields } from "@/screens/assets/detail/forms/photos-fields"
import type { SourceFile } from "@/screens/assets/detail/forms/source"
import {
  isPhotosValid,
  parsePhotos,
  photoCount,
  removePhoto,
  toPhotosPayload,
} from "@/screens/assets/detail/forms/photos"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"
import { usePhotoThumbs } from "@/screens/assets/detail/use-photo-thumbs"

/** ٤.٦'s ceiling, repeated because an edit adds by the same rules a create does. */
const MAX_PHOTOS = 20

/** Stable, so the thumbnail hook does not see a new list on every render. */
const NO_FILES: SourceFile[] = []

/**
 * ٤.٦ — an album, as the form that edits it.
 *
 * ## The originals are never downloaded
 *
 * Only the thumbnails are fetched — see `use-photo-thumbs.ts`. Pulling twenty
 * full-resolution photographs back over the wire so the owner can rename the
 * album would be absurd, and the thumbnails exist precisely so it never has to
 * happen.
 */
export function PhotosEditScreen({ assetId }: { assetId: Id<"assets"> }) {
  const { t, locale } = useStrings("assets/detail")
  const { t: photos } = useStrings("assets/new/photos")

  const { asset, load, save, saving, error } = useAssetEditor(assetId)
  const { form, patch, dirty, commit, reset } = useEditForm(
    load.status === "ready" ? load : null,
    parsePhotos
  )
  const [preparing, setPreparing] = useState(false)

  const thumbs = usePhotoThumbs(
    asset?.dekWrappedByMk,
    load.status === "ready" ? load.files : NO_FILES
  )

  async function add() {
    if (form === null) return
    const room = MAX_PHOTOS - photoCount(form)
    if (room <= 0) return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: room,
      quality: 1,
      exif: false,
    })
    if (result.canceled) return
    patch({
      added: [
        ...form.added,
        ...result.assets.map((a) => ({ uri: a.uri, size: a.fileSize ?? 0 })),
      ].slice(0, room + form.added.length),
    })
  }

  async function onSave() {
    if (form === null) return
    setPreparing(true)
    const thumbUris: string[] = []
    try {
      for (const photo of form.added) {
        thumbUris.push((await makeThumbnail(photo.uri)).uri)
      }
    } catch {
      // A thumbnail is a convenience; the album is not. Losing them costs a
      // slower grid later, so the save proceeds without them.
      thumbUris.length = 0
    } finally {
      setPreparing(false)
    }

    const ok = await save({
      ...toPhotosPayload(form, photos, (n) => fmtNum(n, locale)),
      files: [
        ...form.kept.map((file) => ({ kept: file })),
        ...form.added.map((photo, i) => {
          const thumbUri = thumbUris[i]
          return {
            read: () => readFileBytes(photo.uri),
            readThumbnail:
              thumbUri === undefined ? undefined : () => readFileBytes(thumbUri),
            byteSize: photo.size,
          }
        }),
      ],
    })

    // The plaintext thumbnails have done their job either way.
    for (const uri of thumbUris) discardLocalFile(uri)
    if (ok) commit()
  }

  return (
    <AssetEditFrame
      assetId={assetId}
      load={load}
      saving={saving || preparing}
      error={error}
      dirty={dirty}
      canSave={form !== null && isPhotosValid(form) && !saving}
      onSave={() => void onSave()}
      onCancel={reset}
      kindLine={photos.title!}
    >
      {form === null ? null : (
        <PhotosFields
          value={form}
          onChange={patch}
          thumbs={thumbs}
          labels={t}
          photos={photos}
          onAdd={() => void add()}
          onRemove={(i) => patch(removePhoto(form, i))}
          max={MAX_PHOTOS}
        />
      )}
    </AssetEditFrame>
  )
}
