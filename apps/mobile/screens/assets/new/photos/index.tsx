/**
 * ٤.٦ — adding an encrypted album of photos and videos.
 *
 * Each item is encrypted separately under the asset's DEK and uploaded as its
 * own object. **Thumbnails are encrypted too** — plaintext ones would hand the
 * server a legible index of every photo and video the vault holds.
 */
import { useState } from "react"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { useStrings } from "@/i18n/use-strings"
import { toPhotosPayload, type PickedMedia } from "@/screens/assets/detail/forms/photos"
import { MAX_MEDIA, usePhotosSteps } from "@/screens/assets/flow/photos-steps"
import { StepFlow } from "@/screens/assets/flow/step-flow"
import { useHandoverStep } from "@/screens/assets/flow/use-handover-step"
import { useMediaPicker } from "@/screens/assets/flow/use-media-picker"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

export function NewPhotosScreen() {
  const { t, locale } = useStrings("assets/new/photos")
  const { t: chrome } = useStrings("assets/new")
  const { t: types } = useStrings("assets/new-sheet")
  const { submit, submitting, error } = useAssetSubmit()
  const picker = useMediaPicker()

  const [album, setAlbum] = useState("")
  const [items, setItems] = useState<PickedMedia[]>([])
  /** Files fully uploaded so far, for the one status line. */
  const [uploaded, setUploaded] = useState(0)

  async function add() {
    const picked = await picker.pick(MAX_MEDIA - items.length)
    if (picked.length > 0) setItems((current) => [...current, ...picked].slice(0, MAX_MEDIA))
  }

  const steps = usePhotosSteps({
    album,
    onAlbumChange: setAlbum,
    items: items.map((item, i) => ({
      key: `${item.uri}-${i}`,
      kind: item.kind,
      durationMs: item.durationMs,
      uri: item.thumbnailUri,
    })),
    onAdd: () => void add(),
    adding: picker.preparing,
    onRemove: (index) => setItems((current) => current.filter((_, i) => i !== index)),
  })
  const handover = useHandoverStep()

  async function save() {
    if (album.trim().length === 0 || items.length === 0) return
    setUploaded(0)
    const done = new Set<number>()
    const payload = toPhotosPayload(
      { album, kept: [], keptBytes: 0, added: items },
      t,
      (n) => fmtNum(n, locale)
    )
    const saved = await submit({
      type: "photos",
      label: payload.label,
      secret: payload.secret,
      meta: payload.meta,
      files: items.map((item) => ({
        uri: item.uri,
        thumbnailUri: item.thumbnailUri ?? undefined,
        byteSize: item.size,
      })),
      onProgress: (index, sent) => {
        if (sent.totalBytes > 0 && sent.bytesSent >= sent.totalBytes && !done.has(index)) {
          done.add(index)
          setUploaded(done.size)
        }
      },
      handOver: handover.handedOver,
    })
    if (saved !== null) {
      router.replace({ pathname: "/assets/[id]", params: { id: saved } })
    }
  }

  const status = submitting
    ? t
        .uploading!.replace("{done}", fmtNum(uploaded, locale))
        .replace("{total}", fmtNum(items.length, locale))
    : null

  return (
    <StepFlow
      kicker={types.photosName!}
      steps={[...steps, handover.step]}
      finishLabel={chrome.saveAsset!}
      onFinish={() => void save()}
      busy={submitting || picker.preparing}
      error={error}
      status={status}
      onExit={() => (router.canGoBack() ? router.back() : router.replace("/assets"))}
      dirty={album.trim().length > 0 || items.length > 0}
    />
  )
}
