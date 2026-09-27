/**
 * Thumbnails for an encrypted album — generated here, encrypted under the same
 * DEK as their photo, stored as their own blob.
 *
 * ٤.٦: *"thumbnails are generated locally then encrypted too, so the grid in 4.9
 * needs decryption to render."* The second half is the point: uploading
 * plaintext thumbnails so our own grid drew quickly would hand the server a
 * legible, searchable index of every photo the vault holds — smaller pictures of
 * exactly the thing the originals are encrypted to hide.
 *
 * The intermediate JPEG `expo-image-manipulator` writes to the cache is
 * plaintext, so callers must delete it once the ciphertext exists.
 */
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"
import { getThumbnailAsync } from "expo-video-thumbnails"

import { discardLocalFile } from "@/lib/asset-upload"

/** Long edge in points. Large enough for a retina grid cell, small enough that
 *  twenty of them are a rounding error next to one original. */
const THUMB_EDGE = 320

/** Lossy on purpose: a thumbnail is a pointer, not a copy. */
const THUMB_QUALITY = 0.6

export type Thumbnail = {
  /** Local uri of the generated JPEG. Plaintext — delete after encrypting. */
  uri: string
}

export async function makeThumbnail(imageUri: string): Promise<Thumbnail> {
  const context = ImageManipulator.manipulate(imageUri)
  // Only the width is given: the manipulator preserves aspect ratio, and
  // pinning both edges would distort every photo that is not square.
  context.resize({ width: THUMB_EDGE })
  const image = await context.renderAsync()
  const saved = await image.saveAsync({
    format: SaveFormat.JPEG,
    compress: THUMB_QUALITY,
  })
  return { uri: saved.uri }
}

/**
 * A frame from about a second in — the very first is often black — shrunk the
 * same way. The full-size frame the extractor writes is plaintext too, and is
 * deleted as soon as the small one exists.
 */
export async function makeVideoThumbnail(videoUri: string, durationMs?: number): Promise<Thumbnail> {
  const time = durationMs === undefined ? 1000 : Math.min(1000, Math.floor(durationMs / 2))
  // Some encoders report a duration their last frame falls short of; the
  // opening frame always exists.
  const frame = await getThumbnailAsync(videoUri, { time }).catch(() =>
    getThumbnailAsync(videoUri, { time: 0 })
  )
  try {
    return await makeThumbnail(frame.uri)
  } finally {
    discardLocalFile(frame.uri)
  }
}
