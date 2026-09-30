/**
 * One step of a saved album. The grid shows decrypted thumbnails
 * (`use-photo-thumbs.ts`); an original is fetched only when the owner taps it
 * (`use-stored-files.ts`). Saving re-lists the stored items that survive plus
 * the new ones.
 */
import { useState } from "react"
import type { Id } from "@workspace/backend/dataModel"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { PhotoViewer } from "@/components/photo-viewer"
import { useStrings } from "@/i18n/use-strings"
import {
  isPhotosValid,
  mediaCount,
  parsePhotos,
  removeMedia,
  toPhotosPayload,
} from "@/screens/assets/detail/forms/photos"
import type { StoredMedia } from "@/screens/assets/detail/forms/photos"
import type { SourceFile } from "@/screens/assets/detail/forms/source"
import { StepEditFrame } from "@/screens/assets/detail/step-edit-frame"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"
import { usePhotoThumbs } from "@/screens/assets/detail/use-photo-thumbs"
import { useStoredFiles } from "@/screens/assets/detail/use-stored-files"
import { MAX_MEDIA, usePhotosSteps } from "@/screens/assets/flow/photos-steps"
import { useMediaPicker } from "@/screens/assets/flow/use-media-picker"

/** Stable, so the thumbnail hook does not see a new list on every render. */
const NO_FILES: SourceFile[] = []

export function PhotosStepEdit({ assetId, stepKey }: { assetId: Id<"assets">; stepKey: string }) {
  const { t, locale } = useStrings("assets/new/photos")
  const { t: types } = useStrings("assets/new-sheet")
  const { asset, load, save, saving, error, noteReveal } = useAssetEditor(assetId)
  const { form, patch, dirty } = useEditForm(load.status === "ready" ? load : null, parsePhotos)
  const picker = useMediaPicker()
  const thumbs = usePhotoThumbs(asset?.dekWrappedByMk, load.status === "ready" ? load.files : NO_FILES)
  const { t: detail } = useStrings("assets/detail")
  const stored = useStoredFiles(asset?.dekWrappedByMk)
  const [viewing, setViewing] = useState<string | null>(null)

  async function open(item: StoredMedia) {
    if (item.kind === "video") {
      await stored.share(item.file, item.mimeType ?? "video/mp4")
      return
    }
    const uri = await stored.photo(item.file, item.mimeType)
    if (uri !== null) setViewing(uri)
  }

  async function add() {
    if (form === null) return
    const room = MAX_MEDIA - mediaCount(form)
    const picked = await picker.pick(room)
    if (picked.length > 0) patch({ added: [...form.added, ...picked.slice(0, room)] })
  }

  const steps = usePhotosSteps({
    album: form?.album ?? "",
    onAlbumChange: (album) => patch({ album }),
    items:
      form === null
        ? []
        : [
            ...form.kept.map((item) => ({
              key: item.file.storageId as string,
              kind: item.kind,
              durationMs: item.durationMs,
              uri: thumbs[item.file.storageId as string] ?? null,
              onOpen: () => void open(item),
              opening: stored.busy === item.file.storageId,
            })),
            ...form.added.map((item, i) => ({
              key: `${item.uri}-${i}`,
              kind: item.kind,
              durationMs: item.durationMs,
              uri: item.thumbnailUri,
            })),
          ],
    onAdd: () => void add(),
    adding: picker.preparing,
    onRemove: (index) => {
      if (form !== null) patch(removeMedia(form, index))
    },
  })

  async function onSave() {
    if (form === null || !isPhotosValid(form)) return
    const ok = await save({
      ...toPhotosPayload(form, t, (n) => fmtNum(n, locale)),
      files: [
        ...form.kept.map((item) => ({ kept: item.file })),
        ...form.added.map((item) => ({
          uri: item.uri,
          thumbnailUri: item.thumbnailUri ?? undefined,
          byteSize: item.size,
        })),
      ],
    })
    if (ok) router.back()
  }

  return (
    <>
      <StepEditFrame
        load={load}
        readable={form !== null}
        step={steps.find((step) => step.key === stepKey)}
        kicker={types.photosName!}
        onSave={() => void onSave()}
        saving={saving || picker.preparing}
        error={error}
        dirty={dirty}
        onReveal={noteReveal}
        notice={stored.failed ? detail.openFailed : undefined}
      />
      <PhotoViewer
        uri={viewing}
        closeLabel={detail.closeViewer!}
        onClose={() => setViewing(null)}
      />
    </>
  )
}
