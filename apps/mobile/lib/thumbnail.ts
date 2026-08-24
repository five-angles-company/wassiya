/**
 * Thumbnails for an encrypted album.
 *
 * 4.6: *"thumbnails are generated locally then encrypted too, so the grid in
 * 4.9 needs decryption to render."* The second half is the point. A vault that
 * uploaded plaintext thumbnails so its own grid could render quickly would have
 * handed the server a legible, searchable index of every photo it holds —
 * smaller pictures of exactly the thing the originals are encrypted to hide.
 *
 * So a thumbnail is just another payload: generated here, encrypted under the
 * same DEK as its photo, stored as its own blob. It costs one extra object per
 * photo and buys a grid that can be drawn without pulling multi-megabyte
 * originals over the network.
 *
 * The resize happens before the encrypt, obviously — and the intermediate JPEG
 * that `expo-image-manipulator` writes to the cache is plaintext, so callers
 * must delete it once the ciphertext exists.
 */
import { ImageManipulator, SaveFormat } from "expo-image-manipulator"

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
