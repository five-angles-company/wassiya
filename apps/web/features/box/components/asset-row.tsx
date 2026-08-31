"use client"

import { useState } from "react"
import {
  BanknoteIcon,
  CoinsIcon,
  DownloadIcon,
  FileTextIcon,
  ImagesIcon,
  MonitorSmartphoneIcon,
  StickyNoteIcon,
  type LucideIcon,
} from "lucide-react"

import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { fetchAndDecrypt } from "@/features/box/lib/open-box"
import { HEIR_BOX } from "@/features/box/strings/heir-box"

const ICON: Record<string, LucideIcon> = {
  crypto: CoinsIcon,
  bank: BanknoteIcon,
  document: FileTextIcon,
  photos: ImagesIcon,
  digital: MonitorSmartphoneIcon,
  note: StickyNoteIcon,
}

const TYPE_LABEL: Record<string, keyof typeof HEIR_BOX> = {
  crypto: "typeCrypto",
  bank: "typeBank",
  document: "typeDocument",
  photos: "typePhotos",
  digital: "typeDigital",
  note: "typeNote",
}

export type BoxItem = {
  assetId: string
  type: string
  /** Opened client-side; `null` when this bundle carries no key for the row. */
  title: string | null
  subtitle?: string
  byteSize?: number
  mimeType?: string
  via: string
  contentUrls: readonly string[]
  hasInstructions: boolean
  /** The asset's DEK, or `undefined` when the bundle did not carry one. */
  dek?: Uint8Array
}

/**
 * One thing that was left to this heir.
 *
 * ## The download happens entirely in the browser
 *
 * The ciphertext is fetched from storage, concatenated in order, decrypted with
 * the DEK the bundle carried, and handed to the browser as an object URL. The
 * server sees a range request for a blob it cannot read; the plaintext exists
 * only in this tab.
 *
 * The filename is the **decrypted title**, not the asset id. That is the whole
 * difference between a page that technically works and one an heir can use: a
 * downloads folder holding `k97a3f…bin` three times over is not an inheritance.
 */
export function AssetRow({ item }: { item: BoxItem }) {
  const labels = t(HEIR_BOX, useLocale())
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const Icon = ICON[item.type] ?? FileTextIcon
  const typeKey = TYPE_LABEL[item.type]
  const typeName = typeKey === undefined ? item.type : labels[typeKey]
  const downloadable = item.contentUrls.length > 0 && item.dek !== undefined

  async function download() {
    if (item.dek === undefined) return
    setBusy(true)
    setError(null)
    let url: string | null = null
    try {
      const plaintext = await fetchAndDecrypt(item.contentUrls, item.dek)
      // `slice()` because the view can be a window onto a larger buffer, and
      // `Blob` would otherwise carry the whole thing.
      const blob = new Blob([plaintext.slice()], {
        type: item.mimeType ?? "application/octet-stream",
      })
      url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filenameFor(item, typeName)
      anchor.click()
    } catch {
      setError(labels.downloadFailed)
    } finally {
      // Revoked on the next frame: revoking synchronously after `click()` can
      // race the browser's own read of the URL in some engines.
      if (url !== null) {
        const revoke = url
        requestAnimationFrame(() => URL.revokeObjectURL(revoke))
      }
      setBusy(false)
    }
  }

  return (
    <li className="bg-card rounded-card flex flex-wrap items-start gap-4 p-4 md:p-5">
      <span
        aria-hidden
        className="bg-background text-muted-foreground grid size-11 shrink-0 place-items-center rounded-full"
      >
        <Icon className="size-5" strokeWidth={2.2} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="font-heading text-[16px] font-extrabold">
          {item.title ?? labels.noKeyTitle}
        </div>
        <p className="text-muted-foreground mt-1 text-[13.5px] leading-[1.6]">
          {item.title === null
            ? labels.noKeyBody
            : [
                item.subtitle,
                typeName,
                item.byteSize === undefined ? undefined : formatBytes(item.byteSize),
                item.via === "allHeirs" ? labels.viaAllHeirs : labels.viaDirect,
              ]
                .filter((part) => part !== undefined && part.length > 0)
                .join(" · ")}
        </p>
        {item.hasInstructions && item.title !== null && (
          <p className="text-olive-700 mt-2 text-[13px] leading-[1.6]">
            {labels.instructionsNote}
          </p>
        )}
        {item.title === null && (
          <p dir="ltr" className="text-muted-foreground mt-2 font-mono text-[11.5px]">
            {item.assetId}
          </p>
        )}
        {error !== null && (
          <p className="text-terracotta-800 mt-2 text-[13px]">{error}</p>
        )}
      </div>

      {downloadable ? (
        <Button size="sm" onClick={() => void download()} disabled={busy}>
          <DownloadIcon className="size-4" strokeWidth={2.4} aria-hidden />
          {busy ? labels.downloading : labels.download}
        </Button>
      ) : item.title !== null ? (
        <span className="text-muted-foreground shrink-0 self-center text-[13px]">
          {labels.noContent}
        </span>
      ) : null}
    </li>
  )
}

/**
 * A name the reader will recognise in their downloads folder.
 *
 * The characters stripped are the ones Windows rejects outright; Arabic titles
 * survive untouched, which matters because most of them will be Arabic.
 */
function filenameFor(item: BoxItem, typeName: string): string {
  const base = (item.title ?? typeName).replace(/[\\/:*?"<>|]/g, "").trim()
  const extension = EXTENSION[item.mimeType ?? ""] ?? ""
  return `${base.length > 0 ? base : item.assetId}${extension}`
}

const EXTENSION: Record<string, string> = {
  "application/pdf": ".pdf",
  "image/jpeg": ".jpg",
  "image/png": ".png",
  "image/heic": ".heic",
  "text/plain": ".txt",
  "application/zip": ".zip",
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
