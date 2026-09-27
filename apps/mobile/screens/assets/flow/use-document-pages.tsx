/**
 * A new document's pages, assembled into one PDF at save.
 *
 * A picked PDF cannot be paginated without a renderer this app does not
 * carry, so it is kept as-is and shown as one opaque file. Picking replaces
 * scanned pages and scanning replaces a picked PDF: one document at a time.
 *
 * ⚠️ Scanner output and the assembled PDF are plaintext in the cache — the only
 * artefacts here the vault does not otherwise control. Both are deleted on
 * every path that abandons them: a page removed, a PDF picked over a scan,
 * leaving the screen, and `release` after a successful save.
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
import { FileText, Plus, ScanLine } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { fileSize } from "@/lib/asset-upload"
import { buildScannedPdf, discardScan } from "@/lib/scanned-pdf"
import { SourceButton } from "@/screens/assets/flow/source-button"
import { PageTile } from "@/screens/assets/new/document/components/page-tile"

/**
 * Read-whole-then-encrypt holds the file in memory twice. 25 MB is comfortably
 * under what a mid-range handset tolerates and well above any deed.
 */
export const MAX_DOCUMENT_BYTES = 25 * 1024 * 1024

type Page = { uri: string; size: number }
type PickedPdf = { uri: string; name: string; size: number }

export type AssembledDocument = { uri: string; size: number; mimeType: string }

export function useDocumentPages(options: {
  /** A picked file's own name, offered where the host wants it. */
  onPickedName?: (name: string) => void
} = {}): {
  has: boolean
  content: ReactNode
  /** The one file to encrypt, or `null` when it could not be built (a notice says why). */
  assemble: () => Promise<AssembledDocument | null>
  /** After a successful save: nothing plaintext may outlive the ciphertext. */
  release: () => void
  assembling: boolean
} {
  const { t, locale } = useStrings("assets/new/document")
  const [pages, setPages] = useState<Page[]>([])
  const [pdf, setPdf] = useState<PickedPdf | null>(null)
  const [scanning, setScanning] = useState(false)
  const [assembling, setAssembling] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  const built = useRef<string | null>(null)

  const num = (n: number) => fmtNum(n, locale)
  const formatSize = (bytes: number) =>
    `${fmtNum(Math.round((bytes / 1024 / 1024) * 10) / 10, locale)} ${locale === "ar" ? "م.ب" : "MB"}`
  const totalBytes = pdf?.size ?? pages.reduce((sum, page) => sum + page.size, 0)
  const has = pages.length > 0 || pdf !== null

  function clearBuilt() {
    if (built.current !== null) {
      discardScan(built.current)
      built.current = null
    }
  }

  function dropPages(list: Page[]) {
    for (const page of list) discardScan(page.uri)
  }

  // A ref kept current after every commit, read by the unmount cleanup:
  // capturing `pages` there directly would delete what was staged at mount.
  const staged = useRef<Page[]>([])
  useEffect(() => {
    staged.current = pages
  })
  useEffect(
    () => () => {
      clearBuilt()
      dropPages(staged.current)
    },
    []
  )

  const tooLarge = () =>
    setNotice(t.tooLarge!.replace("{n}", num(MAX_DOCUMENT_BYTES / 1024 / 1024)))

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
      setPdf(null)
      setPages((current) => [
        ...current,
        ...result.scannedImages!.map((uri) => ({ uri, size: fileSize(uri) })),
      ])
    } catch {
      setNotice(t.scanFailed!)
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
    if (size > MAX_DOCUMENT_BYTES) return tooLarge()
    setNotice(null)

    // An image is a page like any other; a PDF cannot be paginated here.
    if ((asset.mimeType ?? "").startsWith("image/")) {
      setPdf(null)
      setPages((current) => [...current, { uri: asset.uri, size }])
    } else {
      dropPages(pages)
      setPages([])
      setPdf({ uri: asset.uri, name: asset.name, size })
    }
    options.onPickedName?.(asset.name)
  }

  function move(from: number, to: number) {
    setPages((current) => {
      if (to < 0 || to >= current.length) return current
      const next = [...current]
      const [moved] = next.splice(from, 1)
      next.splice(to, 0, moved!)
      return next
    })
  }

  function removePage(index: number) {
    const page = pages[index]
    if (page !== undefined) discardScan(page.uri)
    setPages((current) => current.filter((_, i) => i !== index))
  }

  async function assemble(): Promise<AssembledDocument | null> {
    let result: AssembledDocument
    if (pages.length > 0) {
      setAssembling(true)
      try {
        const assembled = await buildScannedPdf(pages.map((page) => page.uri))
        clearBuilt()
        built.current = assembled
        result = { uri: assembled, size: fileSize(assembled), mimeType: "application/pdf" }
      } catch {
        setNotice(t.scanFailed!)
        return null
      } finally {
        setAssembling(false)
      }
    } else if (pdf !== null) {
      result = { uri: pdf.uri, size: pdf.size, mimeType: "application/pdf" }
    } else {
      return null
    }
    // On the assembled file, the thing that gets encrypted: checking pages one
    // by one would let ten small ones through.
    if (result.size > MAX_DOCUMENT_BYTES) {
      clearBuilt()
      tooLarge()
      return null
    }
    return result
  }

  function release() {
    clearBuilt()
    dropPages(pages)
    setPages([])
  }

  const content = (
    <View className="gap-3.5">
      {has ? (
        <Text variant="meta" className="text-muted-foreground">
          {pdf !== null
            ? formatSize(totalBytes)
            : `${t.pages!.replace("{n}", num(pages.length))} · ${formatSize(totalBytes)}`}
        </Text>
      ) : null}

      {has ? (
        <View className="gap-row flex-row flex-wrap">
          {pdf === null ? (
            pages.map((page, i) => (
              <PageTile
                key={page.uri}
                uri={page.uri}
                label={num(i + 1)}
                onMoveBack={i > 0 ? () => move(i, i - 1) : undefined}
                onMoveForward={i < pages.length - 1 ? () => move(i, i + 1) : undefined}
                onRemove={() => removePage(i)}
                moveBackLabel={t.movePageBack!}
                moveForwardLabel={t.movePageForward!}
                removeLabel={t.removePage!}
              />
            ))
          ) : (
            <View className="bg-card rounded-box h-23 flex-1 flex-row items-center gap-3 px-4">
              <Icon as={FileText} size={20} strokeWidth={2.75} className="text-terracotta-800 shrink-0" />
              <Text numberOfLines={2} className="font-body-semibold flex-1 text-[14px]">
                {pdf.name}
              </Text>
            </View>
          )}
          {pdf === null ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t.addPage!}
              onPress={() => void scan()}
              disabled={scanning}
              className="border-sand-400 rounded-box h-23 w-18 items-center justify-center border-[1.5px] border-dashed active:opacity-70"
            >
              <Icon as={Plus} size={19} strokeWidth={2.75} className="text-foreground opacity-55" />
            </Pressable>
          ) : null}
        </View>
      ) : null}

      <SourceButton
        icon={ScanLine}
        label={scanning ? t.scanning! : pages.length > 0 ? t.addPage! : t.scan!}
        onPress={() => void scan()}
        disabled={scanning}
      />
      <SourceButton icon={FileText} label={t.fromFiles!} onPress={() => void pick()} />

      {notice !== null ? (
        <Text className="text-terracotta-800 text-[12px] leading-[1.6]">{notice}</Text>
      ) : null}
    </View>
  )

  return { has, content, assemble, release, assembling }
}

