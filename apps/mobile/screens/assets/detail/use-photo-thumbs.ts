/**
 * The stored thumbnails of a photo album, decrypted for display.
 *
 * ٤.٦ uploads every original and then a small JPEG of each, so an album's
 * `storageIds` is `[...originals, ...thumbnails]` split at `meta.itemCount`.
 * This turns the second half into something `<Image>` can render, which is what
 * makes the edit grid usable at all: removing "photo 3" from a list of counts
 * is not a decision anyone can make.
 *
 * ## Nothing decrypted is written to disk
 *
 * The obvious route — decrypt to a cache file, point `<Image>` at `file://` —
 * would leave the owner's photographs sitting in plaintext in the cache
 * directory, which is the exact artefact `discardLocalFile` exists to sweep up.
 * These become `data:` URIs instead, so they live in JS memory and die with the
 * screen. Thumbnails are small by construction, which is what makes that
 * affordable; the originals are never fetched.
 *
 * ## Best-effort, exactly like the thumbnails themselves
 *
 * The wizard treats a failed resize as acceptable — *"a thumbnail is a
 * convenience; the album is not"* — so an album may carry fewer thumbnails than
 * photos, or none. Every failure here resolves to `null` for that slot and the
 * grid shows a placeholder, rather than one bad blob emptying the whole grid.
 */
import { useEffect, useRef, useState } from "react"
import { decryptAsset } from "@workspace/crypto/asset"
import { unwrap } from "@workspace/crypto/wrap"

import { downloadCiphertext } from "@/lib/asset-upload"
import { base64Encode } from "@/lib/base64"
import { useVault } from "@/stores/vault"

/** `undefined` while a slot is still loading; `null` once it has failed. */
export type ThumbUris = Record<number, string | null>

export function usePhotoThumbs(
  dekWrappedByMk: ArrayBuffer | undefined,
  /** The thumbnail URLs, in photo order. */
  urls: (string | null)[]
): ThumbUris {
  const mk = useVault((s) => s.mk)
  const [uris, setUris] = useState<ThumbUris>({})
  /** Keyed on the URL set, so a re-render does not re-download the album. */
  const done = useRef<string>("")

  useEffect(() => {
    if (dekWrappedByMk === undefined || mk === null || urls.length === 0) return
    const key = urls.join("|")
    if (done.current === key) return
    done.current = key

    let live = true
    void (async () => {
      const dek = unwrap(new Uint8Array(dekWrappedByMk), mk)
      try {
        // Sequential on purpose: twenty concurrent downloads, each decrypting
        // into its own buffer, is how a mid-range handset runs out of memory
        // on the one screen that was supposed to make an album manageable.
        for (const [index, url] of urls.entries()) {
          if (!live) return
          if (url === null) {
            setUris((current) => ({ ...current, [index]: null }))
            continue
          }
          try {
            const bytes = decryptAsset(await downloadCiphertext(url), dek)
            const uri = `data:image/jpeg;base64,${base64Encode(bytes)}`
            if (live) setUris((current) => ({ ...current, [index]: uri }))
          } catch {
            if (live) setUris((current) => ({ ...current, [index]: null }))
          }
        }
      } finally {
        dek.fill(0)
      }
    })()

    return () => {
      live = false
    }
  }, [dekWrappedByMk, mk, urls])

  return uris
}
