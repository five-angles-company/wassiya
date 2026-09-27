/**
 * Replacing the one stored file of a saved document.
 *
 * The stored file is never downloaded: the card describes it from the row's
 * plaintext `meta`. ⚠️ A scan's plaintext PDF must not outlive its ciphertext —
 * it is deleted on a second scan, a picked file replacing it, leaving the
 * screen, and `release` after a successful save.
 */
import { useEffect, useRef, useState, type ReactNode } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import * as DocumentPicker from "expo-document-picker"
import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from "react-native-document-scanner-plugin"
import { FileText, ScanLine } from "lucide-react-native"
import { View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { fileSize } from "@/lib/asset-upload"
import { buildScannedPdf, discardScan } from "@/lib/scanned-pdf"
import type { PickedFile } from "@/screens/assets/detail/forms/document"
import { SourceButton } from "@/screens/assets/flow/source-button"
import { MAX_DOCUMENT_BYTES } from "@/screens/assets/flow/use-document-pages"

export function useDocumentReplacement({
  replacement,
  current,
  onReplace,
}: {
  replacement: PickedFile | null
  /** How the stored file reads — "PDF · ٢٫١ م.ب" — or `null` when there is none. */
  current: string | null
  onReplace: (file: PickedFile) => void
}): { content: ReactNode; release: () => void } {
  const { t, locale } = useStrings("assets/new/document")
  const { t: detail } = useStrings("assets/detail")
  const [notice, setNotice] = useState<string | null>(null)
  const [scanning, setScanning] = useState(false)
  /** The scanner's own output, plaintext on disk until it is saved. */
  const generated = useRef<string | null>(null)

  function release() {
    if (generated.current !== null) {
      discardScan(generated.current)
      generated.current = null
    }
  }
  useEffect(() => release, [])

  const tooLarge = () =>
    setNotice(t.tooLarge!.replace("{n}", fmtNum(MAX_DOCUMENT_BYTES / 1024 / 1024, locale)))

  async function pick() {
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      copyToCacheDirectory: true,
    })
    if (result.canceled) return
    const asset = result.assets[0]
    if (asset === undefined) return
    const size = asset.size ?? 0
    if (size > MAX_DOCUMENT_BYTES) return tooLarge()
    setNotice(null)
    release()
    onReplace({
      uri: asset.uri,
      name: asset.name,
      size,
      mimeType: asset.mimeType ?? "application/octet-stream",
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
      if (result.status === ScanDocumentResponseStatus.Cancel || !result.scannedImages?.length) {
        return
      }
      const uri = await buildScannedPdf(result.scannedImages)
      // Only after the new one exists, so a failed assembly keeps the last.
      release()
      generated.current = uri
      const size = fileSize(uri)
      if (size > MAX_DOCUMENT_BYTES) {
        release()
        return tooLarge()
      }
      onReplace({ uri, name: `${t.scanNamePrefix}.pdf`, size, mimeType: "application/pdf" })
    } catch {
      setNotice(t.scanFailed!)
    } finally {
      setScanning(false)
    }
  }

  const shown = replacement?.name ?? current
  const content = (
    <View className="gap-3.5">
      {shown !== null ? (
        <View className="rounded-card bg-card flex-row items-center gap-3 px-4 py-4">
          <Icon as={FileText} size={20} strokeWidth={2.75} className="text-terracotta-800 shrink-0" />
          <View className="min-w-0 flex-1">
            <Text numberOfLines={2} className="font-body-semibold text-[15px]">
              {shown}
            </Text>
            {replacement !== null ? (
              <Text variant="metaSm" className="text-terracotta-800 mt-0.5">
                {detail.pendingReplace}
              </Text>
            ) : null}
          </View>
        </View>
      ) : null}
      <SourceButton
        icon={ScanLine}
        label={scanning ? t.scanning! : t.scan!}
        onPress={() => void scan()}
        disabled={scanning}
      />
      <SourceButton icon={FileText} label={t.fromFiles!} onPress={() => void pick()} />
      {notice !== null ? (
        <Text className="text-terracotta-800 text-[12px] leading-[1.6]">{notice}</Text>
      ) : null}
    </View>
  )

  return { content, release }
}
