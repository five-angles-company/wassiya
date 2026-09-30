/**
 * Opening an asset's stored files, for its owner.
 *
 * A photo opens in memory, as a `data:` URI that dies with the viewer.
 * Anything a player or another app has to read is decrypted into `opened/`
 * (`lib/opened-files.ts`), and every file this screen opened is deleted when it
 * closes — the launch sweep catches whatever a crash leaves.
 */
import { useCallback, useEffect, useRef, useState } from "react"
import { decryptAsset } from "@workspace/crypto/asset"
import { unwrap } from "@workspace/crypto/wrap"
import type { File } from "expo-file-system"
import * as Sharing from "expo-sharing"

import { downloadCiphertext } from "@/lib/asset-upload"
import { base64Encode } from "@/lib/base64"
import { decryptToFile, discardOpened } from "@/lib/opened-files"
import type { SourceFile } from "@/screens/assets/detail/forms/source"
import { useVault } from "@/stores/vault"

const UTI: Record<string, string> = {
  "application/pdf": "com.adobe.pdf",
  "image/jpeg": "public.jpeg",
  "image/png": "public.png",
  "video/mp4": "public.mpeg-4",
  "video/quicktime": "com.apple.quicktime-movie",
  "audio/mp4": "public.mpeg-4-audio",
}

export function useStoredFiles(dekWrappedByMk: ArrayBuffer | undefined) {
  const mk = useVault((s) => s.mk)
  const opened = useRef<File[]>([])
  /** The file being decrypted, by `storageId`. */
  const [busy, setBusy] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(
    () => () => {
      for (const file of opened.current) discardOpened(file)
      opened.current = []
    },
    []
  )

  const withDek = useCallback(
    async <T>(
      file: SourceFile,
      run: (dek: Uint8Array, url: string) => Promise<T>
    ) => {
      if (dekWrappedByMk === undefined || mk === null || file.url === null) {
        setFailed(true)
        return null
      }
      setBusy(file.storageId)
      setFailed(false)
      let dek: Uint8Array | null = null
      try {
        dek = unwrap(new Uint8Array(dekWrappedByMk), mk)
        return await run(dek, file.url)
      } catch {
        setFailed(true)
        return null
      } finally {
        dek?.fill(0)
        setBusy(null)
      }
    },
    [dekWrappedByMk, mk]
  )

  /** Decrypt to a file this screen deletes when it closes. */
  const toFile = useCallback(
    (file: SourceFile, mimeType: string) =>
      withDek(file, async (dek, url) => {
        const out = await decryptToFile(url, dek, mimeType)
        opened.current.push(out)
        return out
      }),
    [withDek]
  )

  /** Hand the file to the system sheet: preview, open in another app, save. */
  const share = useCallback(
    async (file: SourceFile, mimeType: string) => {
      const out = await toFile(file, mimeType)
      if (out === null) return
      try {
        await Sharing.shareAsync(out.uri, { mimeType, UTI: UTI[mimeType] })
      } catch {
        setFailed(true)
      }
    },
    [toFile]
  )

  /** A photo's original, in memory only. */
  const photo = useCallback(
    (file: SourceFile, mimeType = "image/jpeg") =>
      withDek(file, async (dek, url) => {
        const bytes = decryptAsset(await downloadCiphertext(url), dek)
        try {
          return `data:${mimeType};base64,${base64Encode(bytes)}`
        } finally {
          bytes.fill(0)
        }
      }),
    [withDek]
  )

  return { toFile, share, photo, busy, failed }
}
