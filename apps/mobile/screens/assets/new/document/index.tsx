/**
 * ٤.٥ — a document.
 *
 * Both halves the board asks for: the in-app scanner (ML Kit on Android,
 * VisionKit on iOS, via `react-native-document-scanner-plugin`) with multi-page
 * capture and edge detection, and the file picker for something already saved.
 *
 * Scanned pages are assembled into **one PDF on this device** — see
 * `lib/scanned-pdf` — because a deed photographed in three parts is one
 * document, and three loose images would leave an heir to work out the order.
 * No OCR, and nothing fetched: the assembly happens in a local print WebView.
 *
 * The plaintext PDF that assembly produces is the one file on this screen that
 * must not linger. It is deleted as soon as the encrypted copy exists, and on
 * every path that abandons it — a new scan, a picked file replacing it, or
 * leaving the screen.
 */
import { useEffect, useRef, useState } from "react"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import * as DocumentPicker from "expo-document-picker"
import { router } from "expo-router"
import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from "react-native-document-scanner-plugin"
import { FileText, ScanLine } from "lucide-react-native"
import { View } from "react-native"

import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import { fileSize, readFileBytes } from "@/lib/asset-upload"
import { buildScannedPdf, discardScan } from "@/lib/scanned-pdf"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

/**
 * Read-whole-then-encrypt holds the file in memory twice. 25 MB is comfortably
 * under what a mid-range handset tolerates and well above any deed or
 * certificate; the streaming path that would lift it is `encryptChunk`, which
 * belongs with the scanner work.
 */
const MAX_BYTES = 25 * 1024 * 1024

export function NewDocumentScreen() {
  const { t, locale } = useStrings("assets/new/document")
  const { t: chrome } = useStrings("assets/new")
  const { submit, submitting, error } = useAssetSubmit()

  const [title, setTitle] = useState("")
  const [kind, setKind] = useState("deed")
  const [file, setFile] = useState<{
    uri: string
    name: string
    size: number
    mimeType: string
  } | null>(null)
  const [pageCount, setPageCount] = useState(0)
  const [scanning, setScanning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  /**
   * The generated PDF's uri, when the current file came from the scanner.
   * A ref rather than state so the unmount cleanup sees the latest value
   * rather than the one captured when the effect was created.
   */
  const generated = useRef<string | null>(null)

  /** Drop a previously generated PDF before it is replaced or abandoned. */
  function clearGenerated() {
    if (generated.current !== null) {
      discardScan(generated.current)
      generated.current = null
    }
  }

  // Leaving mid-run must not leave a plaintext scan in the cache.
  useEffect(() => () => clearGenerated(), [])

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
        setNotice(
          t.tooLarge.replace("{n}", fmtNum(MAX_BYTES / 1024 / 1024, locale))
        )
        return
      }

      setPageCount(result.scannedImages.length)
      setFile({
        uri,
        name: `${t.scanNamePrefix}.pdf`,
        size,
        mimeType: "application/pdf",
      })
    } catch {
      setNotice(t.scanFailed)
    } finally {
      setScanning(false)
    }
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
    if (size > MAX_BYTES) {
      setNotice(t.tooLarge.replace("{n}", fmtNum(MAX_BYTES / 1024 / 1024, locale)))
      return
    }
    setNotice(null)
    clearGenerated()
    setPageCount(0)
    setFile({
      uri: asset.uri,
      name: asset.name,
      size,
      mimeType: asset.mimeType ?? "application/octet-stream",
    })
    // Offer the file's own name as the title, but never overwrite a typed one.
    if (title.trim().length === 0) setTitle(stripExtension(asset.name))
  }

  async function save() {
    if (file === null) return
    const saved = await submit({
      type: "document",
      label: {
        title: title.trim(),
        subtitle: `${describeType(file.mimeType)} · ${formatSize(file.size, locale)}`,
      },
      files: [{ read: () => readFileBytes(file.uri), byteSize: file.size }],
      meta: {
        itemCount: 1,
        byteSize: file.size,
        mimeType: file.mimeType,
      },
    })
    if (saved) {
      // The ciphertext is stored; the plaintext PDF has no further use.
      clearGenerated()
      router.replace({
      pathname: "/assets/[id]/recipients",
      params: { id: saved, step: "2" },
    })
    }
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={title.trim().length > 0 && file !== null}
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="gap-4">
        <View className="gap-2">
          <Button variant="outline" onPress={() => void pick()}>
            <Icon as={FileText} className="text-foreground size-4.5" />
            <Text>{file === null ? t.fromFiles : t.replaceFile}</Text>
          </Button>

          <Button
            variant="outline"
            onPress={() => void scan()}
            disabled={scanning}
          >
            <Icon as={ScanLine} className="text-foreground size-4.5" />
            <Text>{scanning ? t.scanning : t.scan}</Text>
          </Button>
        </View>

        {file !== null ? (
          <View className="rounded-row bg-card flex-row items-center gap-3 px-4 py-3.5">
            <Icon as={FileText} className="text-terracotta-700 size-4.5" />
            <View className="min-w-0 flex-1">
              <Text variant="rowTitle" numberOfLines={1}>
                {file.name}
              </Text>
              <Text variant="metaSm">
                {pageCount > 0
                  ? `${t.pages.replace("{n}", fmtNum(pageCount, locale))} · ${formatSize(file.size, locale)}`
                  : formatSize(file.size, locale)}
              </Text>
            </View>
          </View>
        ) : null}

        {notice !== null ? (
          <Text variant="meta" className="text-terracotta-800">
            {notice}
          </Text>
        ) : null}

        <Field
          label={t.titleLabel}
          placeholder={t.titlePlaceholder}
          value={title}
          onChangeText={setTitle}
        />

        <OptionChips
          label={t.typeLabel}
          options={[
            { value: "deed", label: t.typeDeed },
            { value: "marriage", label: t.typeMarriage },
            { value: "certificate", label: t.typeCertificate },
            { value: "other", label: t.typeOther },
          ]}
          value={kind}
          onChange={setKind}
        />

        <Text variant="footnote">
          {chrome.encryptNote}
        </Text>

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800">
            {error}
          </Text>
        ) : null}
      </View>
    </WizardFrame>
  )
}

function stripExtension(name: string): string {
  return name.replace(/\.[^./\\]+$/, "")
}

function describeType(mimeType: string): string {
  if (mimeType === "application/pdf") return "PDF"
  if (mimeType.startsWith("image/")) return mimeType.slice(6).toUpperCase()
  return "FILE"
}

/** Megabytes to one decimal, in the locale's numerals. */
function formatSize(bytes: number, locale: "ar" | "en"): string {
  const mb = bytes / 1024 / 1024
  const unit = locale === "ar" ? "م.ب" : "MB"
  return `${fmtNum(Math.round(mb * 10) / 10, locale)} ${unit}`
}
