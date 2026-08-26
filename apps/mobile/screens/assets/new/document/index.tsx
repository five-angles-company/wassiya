/**
 * ٤.٥ — a document.
 *
 * ## Pages, not a file
 *
 * A scanned deed is rarely one sheet, so the screen holds **pages** and
 * assembles them into a single PDF at Save. That is what lets the grid exist:
 * a screen that says "1 file · 2.1 MB" cannot tell you the scanner caught page
 * three twice and missed page two, and by the time it is a PDF nobody can look
 * inside it again.
 *
 * The dashed tile adds another page through the same scanner, so a document
 * grows a sheet at a time instead of being re-scanned from the top.
 *
 * ## One place where the model does branch
 *
 * The board says scanned and picked land in the same multi-page PDF, with no
 * branch. That holds for images — a picked photo of a certificate is a page
 * like any other. It cannot hold for a **picked PDF**: paginating one needs a
 * PDF renderer this app does not carry, so a chosen PDF is stored as it is and
 * shown as a single opaque file rather than pretending to be pages. Choosing
 * one replaces any pages, and scanning replaces a chosen PDF; the screen is
 * always describing exactly one document.
 *
 * ## The plaintext trail
 *
 * Scanner output is images in the cache, and the assembled PDF is another. Both
 * are deleted on every path that abandons them — a page removed, a PDF picked
 * over a scan, leaving the screen, and after a successful save. They are the
 * only artefacts on this screen the vault does not otherwise control.
 */
import { useEffect, useRef, useState } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { fmtNum } from "@workspace/ui-native/lib/format"
import * as DocumentPicker from "expo-document-picker"
import { router } from "expo-router"
import DocumentScanner, {
  ResponseType,
  ScanDocumentResponseStatus,
} from "react-native-document-scanner-plugin"
import { FileText, Plus, ScanLine } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { fileSize, readFileBytes } from "@/lib/asset-upload"
import { buildScannedPdf, discardScan } from "@/lib/scanned-pdf"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { PageTile } from "@/screens/assets/new/document/components/page-tile"
import { useAssetSubmit } from "@/screens/assets/new/use-asset-submit"

/**
 * Read-whole-then-encrypt holds the file in memory twice. 25 MB is comfortably
 * under what a mid-range handset tolerates and well above any deed or
 * certificate; the streaming path that would lift it is `encryptChunk`.
 */
const MAX_BYTES = 25 * 1024 * 1024

type Page = { uri: string; size: number }
type PickedPdf = { uri: string; name: string; size: number }

export function NewDocumentScreen() {
  const { t, locale } = useStrings("assets/new/document")
  const { t: chrome } = useStrings("assets/new")
  const { submit, submitting, error } = useAssetSubmit()

  const [title, setTitle] = useState("")
  const [kind, setKind] = useState("deed")
  const [pages, setPages] = useState<Page[]>([])
  const [pdf, setPdf] = useState<PickedPdf | null>(null)
  const [scanning, setScanning] = useState(false)
  const [notice, setNotice] = useState<string | null>(null)
  /** The assembled PDF, which is plaintext on disk until its ciphertext exists. */
  const built = useRef<string | null>(null)

  const num = (n: number) => fmtNum(n, locale)
  const totalBytes =
    pdf?.size ?? pages.reduce((sum, page) => sum + page.size, 0)
  const has = pages.length > 0 || pdf !== null

  function clearBuilt() {
    if (built.current !== null) {
      discardScan(built.current)
      built.current = null
    }
  }

  /** Scanner output is plaintext too, and outlives nothing. */
  function dropPages(list: Page[]) {
    for (const page of list) discardScan(page.uri)
  }

  /**
   * Leaving with pages staged must not leave them in the cache.
   *
   * Two effects, in this order and not one: the first keeps a ref pointing at
   * the current list after every commit, and the second's cleanup — which runs
   * only at unmount — reads it. Capturing `pages` in the unmount effect
   * directly would delete whatever was staged at *mount*, which is nothing.
   */
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
    setNotice(t.tooLarge!.replace("{n}", num(MAX_BYTES / 1024 / 1024)))

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
      // A scan supersedes a chosen PDF: the screen describes one document.
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
    if (size > MAX_BYTES) return tooLarge()
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

    // Offer the file's own name, but never over a title that already exists.
    if (title.trim().length === 0) setTitle(stripExtension(asset.name))
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

  async function save() {
    if (!has) return

    let uri: string
    let size: number
    let mimeType: string

    if (pages.length > 0) {
      try {
        const assembled = await buildScannedPdf(pages.map((page) => page.uri))
        clearBuilt()
        built.current = assembled
        uri = assembled
        size = fileSize(assembled)
        mimeType = "application/pdf"
      } catch {
        setNotice(t.scanFailed!)
        return
      }
    } else if (pdf !== null) {
      uri = pdf.uri
      size = pdf.size
      mimeType = "application/pdf"
    } else {
      return
    }

    // Enforced on the assembled file, which is the thing that gets encrypted —
    // checking the pages individually would let ten small ones through.
    if (size > MAX_BYTES) {
      clearBuilt()
      return tooLarge()
    }

    const saved = await submit({
      type: "document",
      label: {
        title: title.trim(),
        subtitle: `${describeType(mimeType)} · ${formatSize(size, locale)}`,
      },
      // The kind, as a payload blob ahead of the file — see `forms/document.ts`.
      secret: JSON.stringify({ kind }),
      files: [{ read: () => readFileBytes(uri), byteSize: size }],
      meta: { itemCount: 1, byteSize: size, mimeType },
    })

    if (saved) {
      clearBuilt()
      dropPages(pages)
      setPages([])
      router.replace({
        pathname: "/assets/[id]/recipients",
        params: { id: saved, step: "2" },
      })
    }
  }

  return (
    <WizardFrame
      title={t.title}
      canSubmit={title.trim().length > 0 && has}
      submitting={submitting}
      onSubmit={() => void save()}
    >
      <View className="mb-auto">
        <FieldRow label={t.titleLabel!} divider>
          <FieldValue
            value={title}
            onChangeText={setTitle}
            placeholder={t.titlePlaceholder}
          />
        </FieldRow>

        <View className="py-[13px]">
          <Text className="mb-2 text-[12px] opacity-50">{t.typeLabel}</Text>
          <ChipRow
            options={[
              { value: "deed", label: t.typeDeed! },
              { value: "marriage", label: t.typeMarriage! },
              { value: "certificate", label: t.typeCertificate! },
              { value: "other", label: t.typeOther! },
            ]}
            value={kind}
            onChange={setKind}
          />
        </View>
        <View className="bg-border h-px" />

        <View className="mb-2.5 mt-[13px] flex-row items-baseline gap-[9px]">
          <Text className="flex-1 text-[12px] opacity-50">{t.fileLabel}</Text>
          {has ? (
            <Text className="text-[12px] opacity-50">
              {pdf !== null
                ? formatSize(totalBytes, locale)
                : `${t.pages!.replace("{n}", num(pages.length))} · ${formatSize(totalBytes, locale)}`}
            </Text>
          ) : null}
        </View>

        {/* Pages, in the order they will be assembled. A picked PDF has no
            inside this app can see, so it shows as one opaque card. */}
        <View className="mb-3.5 flex-row flex-wrap gap-[9px]">
          {pdf === null ? (
            pages.map((page, i) => (
              <PageTile
                key={page.uri}
                uri={page.uri}
                label={num(i + 1)}
                onMoveBack={i > 0 ? () => move(i, i - 1) : undefined}
                onMoveForward={
                  i < pages.length - 1 ? () => move(i, i + 1) : undefined
                }
                onRemove={() => removePage(i)}
                moveBackLabel={t.movePageBack!}
                moveForwardLabel={t.movePageForward!}
                removeLabel={t.removePage!}
              />
            ))
          ) : (
            <View className="bg-card h-[92px] flex-1 flex-row items-center gap-3 rounded-[14px] px-4">
              <Icon
                as={FileText}
                size={20}
                strokeWidth={2.75}
                className="text-terracotta-800 shrink-0"
              />
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
              className="border-sand-400 h-[92px] w-[72px] items-center justify-center rounded-[14px] border-[1.5px] border-dashed active:opacity-70"
            >
              <Icon as={Plus} size={19} strokeWidth={2.75} className="text-foreground opacity-55" />
            </Pressable>
          ) : null}
        </View>

        {/* Scan leads: it is the harder path and the one people forget exists. */}
        <View className="flex-row gap-[9px]">
          <Pressable
            accessibilityRole="button"
            onPress={() => void scan()}
            disabled={scanning}
            className="bg-card h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
          >
            <Icon as={ScanLine} size={16} strokeWidth={2.75} className="text-foreground" />
            <Text className="text-[13.5px]">
              {scanning ? t.scanning : pages.length > 0 ? t.addPage : t.scan}
            </Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => void pick()}
            className="bg-card h-[46px] flex-1 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
          >
            <Icon as={FileText} size={16} strokeWidth={2.75} className="text-foreground" />
            <Text className="text-[13.5px]">{t.fromFiles}</Text>
          </Pressable>
        </View>

        {notice !== null ? (
          <Text className="text-terracotta-800 mt-2.5 text-[11.5px] leading-[1.6]">
            {notice}
          </Text>
        ) : null}

        <Text className="mt-[18px] text-[11px] leading-[1.7] opacity-45">
          {chrome.encryptNote}
        </Text>

        {error !== null ? (
          <Text variant="meta" className="text-terracotta-800 mt-3">
            {error}
          </Text>
        ) : null}
      </View>
    </WizardFrame>
  )
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

function stripExtension(name: string): string {
  const dot = name.lastIndexOf(".")
  return dot > 0 ? name.slice(0, dot) : name
}
