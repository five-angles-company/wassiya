"use client"

import { useState } from "react"
import { DownloadIcon } from "lucide-react"

import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import {
  decryptToFile,
  fetchAndDecrypt,
  type OpenedItem,
} from "@/features/handover/lib/open-handover"
import { ASSET_LABELS } from "@/features/handover/strings/asset-labels"

type SaveFilePicker = (options: { suggestedName?: string }) => Promise<FileSystemFileHandle>

/**
 * One item's files, each its own download, fetched and decrypted in this tab;
 * the plaintext never leaves it except into the file the reader saves.
 *
 * A video goes through the browser's save dialog where there is one (Chromium
 * on a computer), so it streams to disk; everything else — and every browser
 * without the dialog — is assembled in memory and handed over as an object URL.
 * The filename is the decrypted title, so a downloads folder can be told apart
 * and passed on.
 */
export function AssetDownloads({ item, typeName }: { item: OpenedItem & { dek: Uint8Array }; typeName: string }) {
  const locale = useLocale()
  const labels = t(ASSET_LABELS, locale)
  const [busy, setBusy] = useState<number | null>(null)
  const [progress, setProgress] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  // One render per whole percent, not one per network chunk.
  const onProgress = (fraction: number | null) =>
    setProgress((previous) =>
      fraction !== null && previous !== null && Math.floor(previous * 100) === Math.floor(fraction * 100)
        ? previous
        : fraction
    )

  async function download(index: number) {
    const file = item.files[index]
    if (file === undefined) return
    const name = filenameFor(item, typeName, index)
    const type = file.mimeType ?? item.mimeType ?? "application/octet-stream"
    const picker = type.startsWith("video/") ? savePicker() : null

    setError(null)
    // The dialog must open inside the click, before anything is awaited.
    let handle: FileSystemFileHandle | null = null
    if (picker !== null) {
      try {
        handle = await picker({ suggestedName: name })
      } catch (cause) {
        if (cause instanceof DOMException && cause.name === "AbortError") return
        handle = null
      }
    }

    setBusy(index)
    setProgress(null)
    let url: string | null = null
    try {
      if (handle !== null) {
        await decryptToFile(file.url, item.dek, handle, onProgress)
      } else {
        const blob = await fetchAndDecrypt(file.url, item.dek, type, onProgress)
        url = URL.createObjectURL(blob)
        const anchor = document.createElement("a")
        anchor.href = url
        anchor.download = name
        anchor.click()
      }
    } catch {
      setError(labels.downloadFailed)
    } finally {
      // Revoked on the next frame: revoking synchronously after `click()` can
      // race the browser's own read of the URL in some engines.
      if (url !== null) {
        const revoke = url
        requestAnimationFrame(() => URL.revokeObjectURL(revoke))
      }
      setBusy(null)
      setProgress(null)
    }
  }

  const busyLabel =
    progress === null
      ? labels.downloading
      : labels.downloadingPercent.replace("{p}", fmtNumber(Math.floor(progress * 100), locale))

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-2">
        {item.files.map((_, index) => (
          <Button key={index} size="sm" variant="outline" onClick={() => void download(index)} disabled={busy !== null}>
            <DownloadIcon className="size-4" strokeWidth={2.4} aria-hidden />
            {busy === index
              ? busyLabel
              : item.files.length === 1
                ? labels.download
                : labels.downloadNumbered.replace("{n}", fmtNumber(index + 1, locale))}
          </Button>
        ))}
      </div>
      {error !== null && (
        <p role="alert" className="text-tone-attention text-[13px]">
          {error}
        </p>
      )}
    </div>
  )
}

function savePicker(): SaveFilePicker | null {
  const picker = (window as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker
  return typeof picker === "function" ? picker.bind(window) : null
}

/**
 * A name the reader will recognise in their downloads folder.
 *
 * The characters stripped are the ones Windows rejects outright; Arabic titles
 * survive untouched, which matters because most of them will be Arabic.
 */
function filenameFor(item: OpenedItem, typeName: string, index: number): string {
  const base = (item.title ?? typeName).replace(/[\\/:*?"<>|]/g, "").trim()
  const name = base.length > 0 ? base : item.assetId
  const numbered = item.files.length > 1 ? `${name} ${index + 1}` : name
  const mimeType = item.files[index]?.mimeType ?? item.mimeType ?? ""
  return `${numbered}${EXTENSION[mimeType] ?? ""}`
}

const EXTENSION: Record<string, string> = {
  // A spoken note. Without the extension the file lands with none at all and
  // Windows offers no player for it — the one asset whose whole point is that
  // it can be heard.
  "audio/mp4": ".m4a",
  "audio/m4a": ".m4a",
  "audio/mpeg": ".mp3",
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/heic": ".heic",
  "image/heif": ".heif",
  "image/webp": ".webp",
  "video/mp4": ".mp4",
  "video/quicktime": ".mov",
  "video/3gpp": ".3gp",
  "video/webm": ".webm",
  "text/plain": ".txt",
  "application/zip": ".zip",
}
