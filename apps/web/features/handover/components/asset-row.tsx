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
import { cn } from "@workspace/ui/lib/utils"

import { Button } from "@/components/button"
import { IconDisc } from "@/components/icon-disc"
import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t, type Resolved } from "@/lib/i18n/locale"
import {
  fetchAndDecrypt,
  type OpenedItem,
  type SecretField,
} from "@/features/handover/lib/open-handover"
import { ASSET_LABELS } from "@/features/handover/strings/asset-labels"

const ICON: Record<string, LucideIcon> = {
  crypto: CoinsIcon,
  bank: BanknoteIcon,
  document: FileTextIcon,
  photos: ImagesIcon,
  digital: MonitorSmartphoneIcon,
  note: StickyNoteIcon,
}

type Labels = Resolved<typeof ASSET_LABELS>

const TYPE_LABEL: Record<string, keyof typeof ASSET_LABELS> = {
  crypto: "typeCrypto",
  bank: "typeBank",
  document: "typeDocument",
  photos: "typePhotos",
  digital: "typeDigital",
  note: "typeNote",
}

const FIELD_LABEL: Record<string, keyof typeof ASSET_LABELS> = {
  phrase: "fieldPhrase",
  network: "fieldNetwork",
  kind: "fieldKind",
  devicePassword: "fieldDevicePassword",
  deviceLocation: "fieldDeviceLocation",
  account: "fieldAccount",
  password: "fieldPassword",
  twoFactor: "fieldTwoFactor",
  bank: "fieldBank",
  iban: "fieldIban",
  country: "fieldCountry",
  accountType: "fieldAccountType",
  currency: "fieldCurrency",
  branch: "fieldBranch",
  instructions: "fieldInstructions",
  service: "fieldService",
  username: "fieldUsername",
  recoveryCodes: "fieldRecoveryCodes",
  disposition: "fieldDisposition",
  body: "fieldBody",
}

/** The stored value is a key; the executor reads the word the owner chose. */
const VALUE_LABEL: Record<string, keyof typeof ASSET_LABELS> = {
  hardware: "valueHardware",
  software: "valueSoftware",
  exchange: "valueExchange",
  current: "valueCurrent",
  savings: "valueSavings",
  deed: "valueDeed",
  marriage: "valueMarriage",
  certificate: "valueCertificate",
  other: "valueOther",
  instructions: "valueInstructions",
  whereabouts: "valueWhereabouts",
  wish: "valueWish",
  handOver: "valueHandOver",
  delete: "valueDelete",
  memorialise: "valueMemorialise",
}

const ENUM_FIELDS = new Set(["kind", "accountType", "disposition"])

/** Values copied character by character: left-to-right, monospaced. */
const EXACT_FIELDS = new Set([
  "phrase",
  "devicePassword",
  "password",
  "twoFactor",
  "iban",
  "username",
  "recoveryCodes",
  "account",
])

/**
 * One handed-over item.
 *
 * The secret fields are shown as text — a seed phrase or a password is read,
 * not downloaded. Each file is its own download, fetched and decrypted in this
 * tab and handed to the browser as an object URL; the plaintext never leaves
 * the tab. The filename is the decrypted title, so a downloads folder can be
 * told apart and passed on.
 */
export function AssetRow({ item }: { item: OpenedItem }) {
  const locale = useLocale()
  const labels = t(ASSET_LABELS, locale)
  const [busy, setBusy] = useState<number | null>(null)
  const [error, setError] = useState<string | null>(null)

  const Icon = ICON[item.type] ?? FileTextIcon
  const typeKey = TYPE_LABEL[item.type]
  const typeName = typeKey === undefined ? item.type : labels[typeKey]
  const dek = item.dek

  async function download(index: number) {
    const fileUrl = item.fileUrls[index]
    if (dek === undefined || fileUrl === undefined) return
    setBusy(index)
    setError(null)
    let url: string | null = null
    try {
      const plaintext = await fetchAndDecrypt(fileUrl, dek)
      // `slice()` because the view can be a window onto a larger buffer, and
      // `Blob` would otherwise carry the whole thing.
      const blob = new Blob([plaintext.slice()], {
        type: item.mimeType ?? "application/octet-stream",
      })
      url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = filenameFor(item, typeName, index)
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
      setBusy(null)
    }
  }

  return (
    <li className="flex flex-col gap-4 px-5 py-5 md:px-6">
      <div className="flex items-start gap-4">
        <IconDisc icon={Icon} tone={item.title === null ? "attention" : "quiet"} />
        <div className="min-w-0 flex-1">
          <div className="font-heading text-[17px] font-extrabold">
            {item.title ?? labels.noKeyTitle}
          </div>
          <p className="text-muted-foreground mt-1 text-[14px] leading-[1.6]">
            {item.title === null
              ? labels.noKeyBody
              : [
                  item.subtitle,
                  typeName,
                  item.byteSize === undefined ? undefined : formatBytes(item.byteSize),
                ]
                  .filter((part) => part !== undefined && part.length > 0)
                  .join(" · ")}
          </p>
          {item.title === null && (
            <p dir="ltr" className="text-muted-foreground mt-2 font-mono text-[11.5px]">
              {item.assetId}
            </p>
          )}
        </div>
      </div>

      {item.fields.length > 0 && (
        <dl className="bg-card/70 border-border rounded-row grid gap-3 border p-4">
          {item.fields.map((field) => (
            <div key={field.key}>
              <dt className="text-muted-foreground text-[12.5px]">{fieldLabel(field.key, labels)}</dt>
              <dd
                dir={EXACT_FIELDS.has(field.key) ? "ltr" : undefined}
                className={cn(
                  "mt-0.5 text-[15px] leading-[1.7] font-semibold break-words whitespace-pre-wrap",
                  EXACT_FIELDS.has(field.key) && "font-mono text-[14px]"
                )}
              >
                {fieldValue(field, labels)}
              </dd>
            </div>
          ))}
        </dl>
      )}

      {dek !== undefined && item.fileUrls.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {item.fileUrls.map((_, index) => (
            <Button key={index} size="sm" variant="outline" onClick={() => void download(index)} disabled={busy !== null}>
              <DownloadIcon className="size-4" strokeWidth={2.4} aria-hidden />
              {busy === index
                ? labels.downloading
                : item.fileUrls.length === 1
                  ? labels.download
                  : labels.downloadNumbered.replace("{n}", fmtNumber(index + 1, locale))}
            </Button>
          ))}
        </div>
      )}

      {error !== null && <p className="text-tone-attention text-[13px]">{error}</p>}
    </li>
  )
}

function fieldLabel(key: string, labels: Labels): string {
  const labelKey = FIELD_LABEL[key]
  return labelKey === undefined ? key : labels[labelKey]
}

function fieldValue(field: SecretField, labels: Labels): string {
  if (!ENUM_FIELDS.has(field.key)) return field.value
  const valueKey = VALUE_LABEL[field.value]
  return valueKey === undefined ? field.value : labels[valueKey]
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
  const numbered = item.fileUrls.length > 1 ? `${name} ${index + 1}` : name
  return `${numbered}${EXTENSION[item.mimeType ?? ""] ?? ""}`
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
  "text/plain": ".txt",
  "application/zip": ".zip",
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}
