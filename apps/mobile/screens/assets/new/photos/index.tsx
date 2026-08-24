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
 * own object, with per-file progress. Two things the board asks for are **not**
 * here: encrypted thumbnails (which need an image-resize step before the
 * encrypt) and a foreground service with resumable upload. Without the service,
 * a backgrounded upload can be killed mid-album — so the count is capped low
 * enough that the window is short, and the failure leaves orphaned ciphertext
 * rather than a broken asset (see `useCreateAsset` on why uploads precede the
 * row).
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
import { readFileBytes } from "@/lib/asset-upload"
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
    // Read sequentially rather than with Promise.all: twenty full-resolution
    // photos resolved at once is twenty decoded buffers alive simultaneously,
    // which is where a mid-range phone runs out of memory.
    const files = []
    for (const photo of photos) {
      files.push({ bytes: await readFileBytes(photo.uri), byteSize: photo.size })
    }

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
    if (saved) router.back()
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={album.trim().length > 0 && photos.length > 0}
      submitting={submitting}
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
            {submitting ? (
              <Text variant="metaSm" className="text-muted-foreground">
                {t.uploading
                  .replace("{done}", fmtNum(done, locale))
                  .replace("{total}", fmtNum(photos.length, locale))}
              </Text>
            ) : null}
          </View>
        )}

        <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
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
