/**
 * The stored thumbnails of a photo album, decrypted for display and keyed by
 * the photo's `storageId`, so removing a photo cannot shift another's picture.
 *
 * **Nothing decrypted is written to disk.** Decrypting to a cache file and
 * pointing `<Image>` at `file://` would leave the owner's photographs in
 * plaintext in the cache directory, so these become `data:` URIs that live in JS
 * memory and die with the screen. Thumbnails are small by construction, which is
 * what makes that affordable; originals are never fetched.
 *
 * Best-effort, like the thumbnails themselves — a photo may have none. Each
 * failure resolves to `null` for that photo so one bad blob cannot empty the
 * grid.
 */
import { useEffect, useRef, useState } from "react"
import { decryptAsset } from "@workspace/crypto/asset"
import { unwrap } from "@workspace/crypto/wrap"

import { downloadCiphertext } from "@/lib/asset-upload"
import { base64Encode } from "@/lib/base64"
import type { SourceFile } from "@/screens/assets/detail/forms/source"
import { useVault } from "@/stores/vault"

/** By `storageId`: `undefined` while loading, `null` once it has failed. */
export type ThumbUris = Record<string, string | null>

export function usePhotoThumbs(
  dekWrappedByMk: ArrayBuffer | undefined,
  files: SourceFile[]
): ThumbUris {
  const mk = useVault((s) => s.mk)
  const [uris, setUris] = useState<ThumbUris>({})
  /** Keyed on the file set, so a re-render does not re-download the album. */
  const done = useRef<string>("")

  useEffect(() => {
    if (dekWrappedByMk === undefined || mk === null || files.length === 0) return
    const key = files.map((file) => file.storageId).join("|")
    if (done.current === key) return
    done.current = key

    let live = true
    void (async () => {
      const dek = unwrap(new Uint8Array(dekWrappedByMk), mk)
      try {
        // Sequential on purpose: twenty concurrent downloads, each decrypting
        // into its own buffer, is how a mid-range handset runs out of memory
        // on the one screen that was supposed to make an album manageable.
        for (const file of files) {
          if (!live) return
          const id = file.storageId as string
          if (file.thumbnailUrl === null) {
            setUris((current) => ({ ...current, [id]: null }))
            continue
          }
          try {
            const bytes = decryptAsset(await downloadCiphertext(file.thumbnailUrl), dek)
            const uri = `data:image/jpeg;base64,${base64Encode(bytes)}`
            if (live) setUris((current) => ({ ...current, [id]: uri }))
          } catch {
            if (live) setUris((current) => ({ ...current, [id]: null }))
          }
        }
      } finally {
        dek.fill(0)
      }
    })()

    return () => {
      live = false
    }
  }, [dekWrappedByMk, mk, files])

  return uris
}
