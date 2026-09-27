/**
 * Choosing album items — photos and videos — through the system picker, so no
 * gallery permission is ever requested. Each item's thumbnail is made as it
 * arrives: the grid needs a video's frame before anything is saved, and the
 * save then encrypts the same file.
 *
 * ⚠️ This leaves plaintext on disk while the screen is open: the thumbnails it
 * makes and the picker's own copy of every chosen file. All of it is deleted
 * when the screen goes, saved or not — only the ciphertext outlives it.
 */
import { useEffect, useRef, useState } from "react"
import * as ImagePicker from "expo-image-picker"

import { discardCachedCopy, discardLocalFile, fileSize } from "@/lib/asset-upload"
import { makeThumbnail, makeVideoThumbnail } from "@/lib/thumbnail"
import type { PickedMedia } from "@/screens/assets/detail/forms/photos"

export function useMediaPicker(): {
  pick: (room: number) => Promise<PickedMedia[]>
  preparing: boolean
} {
  const [preparing, setPreparing] = useState(false)
  const thumbnails = useRef<string[]>([])
  const copies = useRef<string[]>([])

  useEffect(() => {
    const madeThumbnails = thumbnails.current
    const pickedCopies = copies.current
    return () => {
      for (const uri of madeThumbnails) discardLocalFile(uri)
      for (const uri of pickedCopies) discardCachedCopy(uri)
    }
  }, [])

  async function pick(room: number): Promise<PickedMedia[]> {
    if (room <= 0) return []
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images", "videos"],
      allowsMultipleSelection: true,
      selectionLimit: room,
      // An album meant to outlive its owner keeps what they actually took.
      quality: 1,
      exif: false,
    })
    if (result.canceled) return []

    setPreparing(true)
    try {
      const picked: PickedMedia[] = []
      for (const asset of result.assets.slice(0, room)) {
        copies.current.push(asset.uri)
        const kind = asset.type === "video" ? "video" : "photo"
        const durationMs = kind === "video" ? (asset.duration ?? undefined) : undefined
        let thumbnailUri: string | null = null
        try {
          const thumbnail =
            kind === "video"
              ? await makeVideoThumbnail(asset.uri, durationMs)
              : await makeThumbnail(asset.uri)
          thumbnails.current.push(thumbnail.uri)
          thumbnailUri = thumbnail.uri
        } catch {
          // A thumbnail is a convenience; the album is not.
        }
        picked.push({
          kind,
          mimeType: asset.mimeType ?? undefined,
          durationMs,
          uri: asset.uri,
          size: asset.fileSize ?? fileSize(asset.uri),
          thumbnailUri,
        })
      }
      return picked
    } finally {
      setPreparing(false)
    }
  }

  return { pick, preparing }
}
