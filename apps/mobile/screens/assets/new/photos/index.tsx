/**
 * ٤.٦ — an encrypted album.
 *
 * Uses the **system Photo Picker**, which is the board's own requirement
 * ("no `READ_MEDIA_IMAGES` permission"): the OS shows the grid, the app
 * receives only what was chosen, and no gallery permission is ever requested.
 * `expo-image-picker` routes to the platform picker on Android 13+ and to
 * `PHPicker` on iOS, so that property holds on both.
 *
 * Each photo is encrypted separately under the asset's DEK and uploaded as its
 * own object, with per-file progress. **Thumbnails are encrypted too**, which
 * is the board's actual requirement and the reason 4.9's grid will need
 * decryption to draw: uploading plaintext thumbnails so our own grid rendered
 * faster would hand the server a legible index of every photo the vault holds.
 *
 * Layout of `storageIds`: all originals, then all thumbnails, with
 * `meta.itemCount` as the split. A reader takes `slice(itemCount)` for the
 * grid and indexes originals directly.
 *
 * Still missing, and it needs native work rather than more JS: a foreground
 * service with **resumable** upload. `expo-file-system`'s `UploadTask` has no
 * pause/resume — only `DownloadTask` does — so a backgrounded album can be
 * killed mid-upload. The count is capped low enough that the window is short,
 * and the failure leaves orphaned ciphertext rather than a broken asset (see
 * `useCreateAsset` on why uploads precede the row).
 */
import { useState } from "react"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"
import { Images } from "lucide-react-native"
import { Image, View } from "react-native"

import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import { discardLocalFile, readFileBytes } from "@/lib/asset-upload"
import { makeThumbnail } from "@/lib/thumbnail"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

/** Without resumable upload, a long album is a long window to be killed in. */
const MAX_PHOTOS = 20

type Picked = { uri: string; size: number }

export function NewPhotosScreen() {
  const { t, locale } = useStrings("assets/new/photos")
  const { t: chrome } = useStrings("assets/new")
  const { submit, submitting, error } = useAssetSubmit()

  const [album, setAlbum] = useState("")
  const [photos, setPhotos] = useState<Picked[]>([])
  const [done, setDone] = useState(0)
  const [preparing, setPreparing] = useState(false)

  const totalBytes = photos.reduce((sum, photo) => sum + photo.size, 0)

  async function pick() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - photos.length,
      // The picker would otherwise hand back a downscaled JPEG; an album meant
      // to outlive its owner should keep what they actually took.
      quality: 1,
      exif: false,
    })
    if (result.canceled) return
    setPhotos((current) =>
      [
        ...current,
        ...result.assets.map((asset) => ({
          uri: asset.uri,
          size: asset.fileSize ?? 0,
        })),
      ].slice(0, MAX_PHOTOS)
    )
  }

  async function save() {
    if (photos.length === 0) return
    setDone(0)

    // Thumbnails are generated up front rather than inside the upload loop:
    // `expo-image-manipulator` writes each one to the cache, and those files
    // have to be tracked so they can be deleted whatever happens next.
    setPreparing(true)
    const thumbUris: string[] = []
    try {
      for (const photo of photos) {
        thumbUris.push((await makeThumbnail(photo.uri)).uri)
      }
    } catch {
      // A thumbnail is a convenience; the album is not. Losing them costs a
      // slower grid later, so the save proceeds without them rather than
      // failing over a resize.
      thumbUris.length = 0
    } finally {
      setPreparing(false)
    }

    // Thunks, not bytes: the pipeline reads each file immediately before it
    // encrypts and uploads it, so one plaintext buffer is alive at a time
    // rather than the whole album. See `AssetPayload`.
    const files = [
      ...photos.map((photo) => ({
        read: () => readFileBytes(photo.uri),
        byteSize: photo.size,
      })),
      ...thumbUris.map((uri) => ({ read: () => readFileBytes(uri) })),
    ]

    const saved = await submit({
      type: "photos",
      label: {
        title: album.trim(),
        subtitle: t.selected.replace("{n}", fmtNum(photos.length, locale)),
      },
      files,
      meta: {
        itemCount: photos.length,
        byteSize: totalBytes,
        mimeType: "image/*",
      },
      onProgress: (index) => setDone(index + 1),
    })
    // The plaintext thumbnails have done their job either way — encrypted
    // copies are stored, or the save failed and they are stale.
    for (const uri of thumbUris) discardLocalFile(uri)
    if (saved) router.replace({
      pathname: "/assets/[id]/recipients",
      params: { id: saved, step: "2" },
    })
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={album.trim().length > 0 && photos.length > 0}
      submitting={submitting || preparing}
      onSubmit={() => void save()}
    >
      <View className="gap-4">
        <Field
          label={t.albumLabel}
          placeholder={t.albumPlaceholder}
          value={album}
          onChangeText={setAlbum}
        />

        <Button
          variant="outline"
          onPress={() => void pick()}
          disabled={photos.length >= MAX_PHOTOS}
        >
          <Icon as={Images} className="text-foreground size-4.5" />
          <Text>{photos.length === 0 ? t.choose : t.chooseMore}</Text>
        </Button>

        {photos.length === 0 ? (
          <Text variant="metaSm" className="text-muted-foreground text-center">
            {t.none}
          </Text>
        ) : (
          <View className="gap-2">
            <View className="flex-row flex-wrap gap-2">
              {photos.map((photo) => (
                <Image
                  key={photo.uri}
                  source={{ uri: photo.uri }}
                  className="rounded-box size-18"
                  // Local previews of what the user just picked. These are the
                  // originals, not the encrypted copies — 4.9 will need real
                  // decryption to render its grid.
                  accessibilityIgnoresInvertColors
                />
              ))}
            </View>
            <Text variant="metaSm" className="text-muted-foreground">
              {`${t.selected.replace("{n}", fmtNum(photos.length, locale))} · ${t.encryptNote.replace("{size}", formatSize(totalBytes, locale))}`}
            </Text>
            {preparing ? (
              <Text variant="metaSm" className="text-muted-foreground">
                {t.preparing}
              </Text>
            ) : submitting ? (
              <Text variant="metaSm" className="text-muted-foreground">
                {t.uploading
                  .replace("{done}", fmtNum(done, locale))
                  .replace("{total}", fmtNum(photos.length, locale))}
              </Text>
            ) : null}
          </View>
        )}

        <Text variant="footnote">
          {chrome.encryptNote}
        </Text>

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800">
            {error}
          </Text>
        ) : null}
      </View>
    </WizardFrame>
  )
}

function formatSize(bytes: number, locale: "ar" | "en"): string {
  const mb = bytes / 1024 / 1024
  const unit = locale === "ar" ? "م.ب" : "MB"
  return `${fmtNum(Math.round(mb * 10) / 10, locale)} ${unit}`
}
