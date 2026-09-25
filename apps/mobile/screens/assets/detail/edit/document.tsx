import { useEffect, useRef, useState } from "react"
import type { Id } from "@workspace/backend/dataModel"
import { fmtNum } from "@workspace/ui-native/lib/format"
import * as DocumentPicker from "expo-document-picker"
import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from "react-native-document-scanner-plugin"

import { useStrings } from "@/i18n/use-strings"
import { fileSize, readFileBytes } from "@/lib/asset-upload"
import { buildScannedPdf, discardScan } from "@/lib/scanned-pdf"
import { AssetEditFrame } from "@/screens/assets/detail/edit-frame"
import { DocumentFields } from "@/screens/assets/detail/forms/document-fields"
import {
  isDocumentValid,
  parseDocument,
  stripExtension,
  toDocumentPayload,
} from "@/screens/assets/detail/forms/document"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"

/**
 * Read-whole-then-encrypt holds the file in memory twice. The wizard's own
 * ceiling, repeated because a replacement is the same operation.
 */
const MAX_BYTES = 25 * 1024 * 1024

/**
 * ٤.٥ — a document, as the form that edits it.
 *
 * ## The stored file is never downloaded
 *
 * Fetching 25 MB every time someone opens the screen to fix a typo in the title
 * would be worse than useless. Everything the form shows comes from the sealed
 * label, the sealed secret and the row's plaintext `meta`.
 *
 * ## A scan's plaintext PDF must not outlive its ciphertext
 *
 * `buildScannedPdf` writes a real PDF to the cache directory. It is deleted on
 * every path that abandons it — a second scan, a picked file replacing it,
 * leaving the screen — and after a successful save. That is the one artefact on
 * this screen the vault does not otherwise control.
 */
export function DocumentEditScreen({ assetId }: { assetId: Id<"assets"> }) {
  const { t, locale } = useStrings("assets/detail")
  const { t: doc } = useStrings("assets/new/document")

  const { load, save, saving, error } = useAssetEditor(assetId)
  const { form, patch, dirty, commit, reset } = useEditForm(
    load.status === "ready" ? load : null,
    parseDocument
  )

  const [notice, setNotice] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  /** The scanner's own output, which is plaintext on disk until it is saved. */
  const generated = useRef<string | null>(null)

  function clearGenerated() {
    if (generated.current !== null) {
      discardScan(generated.current)
      generated.current = null
    }
  }

  // Leaving with a staged scan must not leave the PDF behind.
  useEffect(() => clearGenerated, [])

  const tooLarge = () =>
    setNotice(doc.tooLarge!.replace("{n}", fmtNum(MAX_BYTES / 1024 / 1024, locale)))

  const formatSize = (bytes: number) => {
    const mb = bytes / 1024 / 1024
    return `${fmtNum(Math.round(mb * 10) / 10, locale)} ${locale === "ar" ? "م.ب" : "MB"}`
  }

  async function pick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    if (asset === undefined) return

    const size = asset.size ?? 0
    if (size > MAX_BYTES) return tooLarge()

    setNotice(null)
    clearGenerated()
    patch({
      replacement: {
        uri: asset.uri,
        name: asset.name,
        size,
        mimeType: asset.mimeType ?? "application/octet-stream",
      },
      // Offer the file's own name, but never over a title that already exists.
      ...(form !== null && form.title.trim().length === 0
        ? { title: stripExtension(asset.name) }
        : null),
    })
  }

  async function scan() {
    setScanning(true)
    setNotice(null)
    try {
      const result = await DocumentScanner.scanDocument({
        responseType: ResponseType.ImageFilePath,
        croppedImageQuality: 90,
      })
      if (
        result.status === ScanDocumentResponseStatus.Cancel ||
        !result.scannedImages?.length
      ) {
        return
      }

      const uri = await buildScannedPdf(result.scannedImages)
      // Only after the new one exists — a failed assembly should leave the
      // previous scan intact rather than dropping both.
      clearGenerated()
      generated.current = uri

      const size = fileSize(uri)
      if (size > MAX_BYTES) {
        clearGenerated()
        return tooLarge()
      }

      patch({
        replacement: {
          uri,
          name: `${doc.scanNamePrefix}.pdf`,
          size,
          mimeType: "application/pdf",
        },
      })
    } catch {
      setNotice(doc.scanFailed!)
    } finally {
      setScanning(false)
    }
  }

  async function onSave() {
    if (form === null || load.status !== "ready") return
    const file = form.replacement
    const ok = await save({
      ...toDocumentPayload(form, formatSize),
      // Absent keeps the stored file; a replacement supersedes it.
      files:
        file === null
          ? undefined
          : [{ read: () => readFileBytes(file.uri), byteSize: file.size }],
    })
    if (ok) {
      clearGenerated()
      patch({
        replacement: null,
        current: {
          byteSize: file?.size ?? form.current.byteSize,
          mimeType: file?.mimeType ?? form.current.mimeType,
        },
      })
      commit()
    }
  }

  return (
    <AssetEditFrame
      assetId={assetId}
      load={load}
      saving={saving}
      error={error}
      dirty={dirty}
      canSave={form !== null && dirty && isDocumentValid(form) && !saving}
      onSave={() => void onSave()}
      onCancel={reset}
      kindLine={doc.title!}
    >
      {form === null ? null : (
        <DocumentFields
          value={form}
          onChange={patch}
          labels={t}
          document={doc}
          formatSize={formatSize}
          onPick={() => void pick()}
          onScan={() => void scan()}
          scanning={scanning}
          notice={notice}
        />
      )}
    </AssetEditFrame>
  )
}
