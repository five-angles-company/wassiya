/**
 * ٤.٥ — a document.
 *
 * The board wants an in-app ML Kit scanner with multi-page capture, edge
 * detection, and pages assembled into one PDF client-side. That needs a native
 * scanner module this app does not have, so **the "من الملفات" half is built
 * and the scanner is not** — the button says so rather than pretending.
 *
 * What is real here is the part that matters most: the file is read, encrypted
 * on this device under the asset's own DEK, and only ciphertext is uploaded.
 * Adding the scanner later changes where the bytes come from, not what happens
 * to them.
 */
import { useState } from "react"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import * as DocumentPicker from "expo-document-picker"
import { router } from "expo-router"
import { FileText, ScanLine } from "lucide-react-native"
import { View } from "react-native"

import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import { readFileBytes } from "@/lib/asset-upload"
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
  const [notice, setNotice] = useState<string | null>(null)

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
    const bytes = await readFileBytes(file.uri)
    const saved = await submit({
      type: "document",
      label: {
        title: title.trim(),
        subtitle: `${describeType(file.mimeType)} · ${formatSize(file.size, locale)}`,
      },
      files: [{ bytes }],
      meta: {
        itemCount: 1,
        byteSize: file.size,
        mimeType: file.mimeType,
      },
    })
    if (saved) router.back()
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

          {/* Present but disabled, with the reason on the button's own line.
              Hiding it would leave the screen looking like it never intended
              to scan; a dead enabled button would be worse than both. */}
          <Button variant="outline" disabled onPress={() => undefined}>
            <Icon as={ScanLine} className="text-foreground size-4.5" />
            <Text>{t.scan}</Text>
          </Button>
          <Text variant="metaSm" className="text-muted-foreground text-center">
            {t.scanUnavailable}
          </Text>
        </View>

        {file !== null ? (
          <View className="rounded-row bg-card flex-row items-center gap-3 px-4 py-3.5">
            <Icon as={FileText} className="text-terracotta-700 size-4.5" />
            <View className="min-w-0 flex-1">
              <Text variant="rowTitle" numberOfLines={1}>
                {file.name}
              </Text>
              <Text variant="metaSm">{formatSize(file.size, locale)}</Text>
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

        <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
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
