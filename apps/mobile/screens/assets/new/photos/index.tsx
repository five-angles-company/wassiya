/**
 * ٤.٦ — an encrypted album.
 *
 * Uses the system Photo Picker, so no `READ_MEDIA_IMAGES` permission is ever
 * requested: the OS shows the grid and the app receives only what was chosen.
 *
 * Each photo is encrypted separately under the asset's DEK and uploaded as its
 * own object. **Thumbnails are encrypted too** — uploading plaintext ones so our
 * own grid drew faster would hand the server a legible index of every photo the
 * vault holds — which is why ٤.٩'s grid needs decryption to render.
 *
 * Each stored file is one photo with its thumbnail beside it.
 *
 * Still missing and needing native work: a foreground service with resumable
 * upload. `expo-file-system`'s `UploadTask` has no pause/resume, so a
 * backgrounded album can be killed mid-upload. The count is capped low enough
 * that the window is short, and the failure leaves orphaned ciphertext rather
 * than a broken asset.
 */
import { useState } from "react"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { cn } from "@workspace/ui-native/lib/utils"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import * as ImagePicker from "expo-image-picker"
import { router } from "expo-router"
import { Plus } from "lucide-react-native"
import { Pressable, View } from "react-native"


import { useStrings } from "@/i18n/use-strings"
import { discardLocalFile, readFileBytes } from "@/lib/asset-upload"
import { makeThumbnail } from "@/lib/thumbnail"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { PhotoTile } from "@/screens/assets/new/photos/components/photo-tile"
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
  const [preparing, setPreparing] = useState(false)
  /**
   * Fraction uploaded, per photo.
   *
   * Per file rather than per album, and the reasoning matters: with
   * twenty photos on a weak connection one bar hides *which* file is stuck.
   * Keyed by index into `photos`, because the uploader reports the same index.
   */
  const [progress, setProgress] = useState<Record<number, number>>({})
  /** The photo the last attempt died on, so the grid can point at it. */
  const [failedAt, setFailedAt] = useState<number | null>(null)

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
    setProgress({})
    setFailedAt(null)
    const reached: Record<number, number> = {}

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
    const files = photos.map((photo, i) => {
      const thumbUri = thumbUris[i]
      return {
        read: () => readFileBytes(photo.uri),
        readThumbnail:
          thumbUri === undefined ? undefined : () => readFileBytes(thumbUri),
        byteSize: photo.size,
      }
    })

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
      onProgress: (index, sent) => {
        const fraction =
          sent.totalBytes > 0 ? sent.bytesSent / sent.totalBytes : 0
        // Tracked locally as well as in state: the state read below happens
        // inside this same async call, where a `setState` from a moment ago is
        // not visible yet.
        reached[index] = fraction
        setProgress((current) => ({ ...current, [index]: fraction }))
      },
    })
    // The plaintext thumbnails have done their job either way — encrypted
    // copies are stored, or the save failed and they are stale.
    for (const uri of thumbUris) discardLocalFile(uri)

    if (saved) {
      router.replace({
        pathname: "/assets/[id]/recipients",
        params: { id: saved, step: "2" },
      })
      return
    }

    // Point at the file it died on: the first photo that never finished.
    // `submit` swallows the throw and returns null, so this is the only signal
    // available — and "which one" is the whole reason the rings exist. All
    // complete means the upload was fine and `assets.create` was not, which is
    // not a per-tile failure and gets the screen's error line instead.
    const stalled = photos.findIndex((_, i) => (reached[i] ?? 0) < 1)
    setFailedAt(stalled === -1 ? null : stalled)
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={album.trim().length > 0 && photos.length > 0}
      submitting={submitting || preparing}
      onSubmit={() => void save()}
    >
      <View className="mb-auto">
        <FieldRow label={t.albumLabel!} divider>
          <FieldValue
            value={album}
            onChangeText={setAlbum}
            placeholder={t.albumPlaceholder}
          />
        </FieldRow>

        {/* The count sits in the label line, "٦ من ٢٠" — a ceiling stated
            once, rather than an error raised at the twenty-first tap. */}
        <View className="mb-2.5 mt-[13px] flex-row items-baseline gap-[9px]">
          <Text className="flex-1 text-[12px] opacity-50">{t.title}</Text>
          <Text className="text-[12px] opacity-50">
            {`${fmtNum(photos.length, locale)} ${chrome.stepSeparator} ${fmtNum(MAX_PHOTOS, locale)}`}
          </Text>
        </View>

        <View className="flex-row flex-wrap gap-[9px]">
          {photos.map((photo, i) => (
            <PhotoTile
              key={photo.uri}
              uri={photo.uri}
              // A done tile is simply clean, deliberately: a finished
              // photo needs no decoration, so only in-flight and failed are
              // marked at all.
              progress={submitting ? (progress[i] ?? 0) : 1}
              failed={failedAt === i}
              busy={submitting}
              onRemove={() =>
                setPhotos((current) => current.filter((_, j) => j !== i))
              }
              onRetry={() => void save()}
              removeLabel={t.removePhoto ?? ""}
              retryLabel={t.retry ?? ""}
            />
          ))}

          {photos.length < MAX_PHOTOS ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={photos.length === 0 ? t.choose : t.chooseMore}
              onPress={() => void pick()}
              className="bg-terracotta-100 size-[72px] items-center justify-center rounded-[16px] active:opacity-80"
            >
              <Icon as={Plus} size={20} strokeWidth={2.75} className="text-terracotta-900" />
            </Pressable>
          ) : null}
        </View>

        {photos.length > 0 ? (
          <Text
            className={cn(
              "mt-3 text-[11.5px] leading-[1.6]",
              failedAt === null ? "opacity-50" : "text-terracotta-800"
            )}
          >
            {failedAt !== null
              ? t.uploadFailedOne
              : preparing
                ? t.preparing
                : submitting
                  ? t.uploadingNow
                  : t.encryptNote!.replace(
                      "{size}",
                      formatSize(totalBytes, locale)
                    )}
          </Text>
        ) : null}

        <Text className="mt-[18px] text-[11px] leading-[1.7] opacity-45">
          {chrome.encryptNote}
        </Text>

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800 mt-3">
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
