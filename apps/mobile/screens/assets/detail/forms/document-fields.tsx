import { useState } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { FileText, ScanLine, Upload } from "lucide-react-native"
import { Pressable, View } from "react-native"

import {
  describeType,
  DOCUMENT_KINDS,
  type DocumentForm,
} from "@/screens/assets/detail/forms/document"

/** Chip labels, keyed flat so the strings table stays flat. */
export const KIND_KEY: Record<string, string> = {
  deed: "typeDeed",
  marriage: "typeMarriage",
  certificate: "typeCertificate",
  other: "typeOther",
}

/**
 * ٤.٥'s fields.
 *
 * ## The file is a row, not a preview
 *
 * The stored document is ciphertext this app has no viewer for. A thumbnail or
 * an "open" button would promise something the screen cannot deliver, so the
 * row states what is there — type and size — and offers the two things it can
 * do: replace it from Files, or scan a new one.
 *
 * Scan leads because it is the harder path and the one people forget exists.
 * Both land in the same PDF, so there is no scanned-versus-picked branch
 * anywhere below this screen.
 *
 * ## A replacement is staged, not applied
 *
 * Nothing uploads and nothing is deleted until Save. Backing out of a mis-pick
 * costs nothing, and the row says which of the two files it is currently
 * describing.
 */
export type DocumentFieldsProps = {
  value: DocumentForm
  onChange: (patch: Partial<DocumentForm>) => void
  /** The `assets/detail` dictionary. */
  labels: Record<string, string>
  /** The `assets/new/document` dictionary. */
  document: Record<string, string>
  formatSize: (bytes: number) => string
  onPick: () => void
  onScan: () => void
  scanning: boolean
  notice: string | null
}

export function DocumentFields({
  value,
  onChange,
  labels,
  document,
  formatSize,
  onPick,
  onScan,
  scanning,
  notice,
}: DocumentFieldsProps) {
  const [focused, setFocused] = useState(false)
  const staged = value.replacement
  const mimeType = staged?.mimeType ?? value.current.mimeType
  const byteSize = staged?.size ?? value.current.byteSize

  return (
    <>
      <FieldRow
        label={document.titleLabel!}
        divider
        active={focused}
      >
        <FieldValue
          value={value.title}
          onChangeText={(title) => onChange({ title })}
          placeholder={document.titlePlaceholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </FieldRow>

      <View className={focused ? "opacity-45" : undefined}>
        <View className="py-[13px]">
          <Text className="mb-2 text-[12px] opacity-50">{document.typeLabel}</Text>
          <ChipRow
            options={DOCUMENT_KINDS.map((k) => ({
              value: k,
              label: document[KIND_KEY[k]!]!,
            }))}
            value={value.kind.length > 0 ? value.kind : null}
            onChange={(kind) => onChange({ kind })}
          />
        </View>
        <View className="bg-border h-px" />

        <View className="py-3.5">
          <Text className="mb-[7px] text-[12px] opacity-50">
            {labels.filesRowLabel}
          </Text>

          <View className="flex-row items-center gap-3">
            <View className="bg-card size-[42px] shrink-0 items-center justify-center rounded-[14px]">
              <Icon
                as={FileText}
                size={20}
                strokeWidth={2.75}
                className="text-terracotta-800"
              />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                numberOfLines={1}
                className="font-body-semibold text-foreground text-[16px]"
              >
                {staged?.name ?? `${describeType(mimeType)}`}
              </Text>
              <Text numberOfLines={1} className="mt-0.5 text-[11.5px] opacity-50">
                {`${describeType(mimeType)} · ${formatSize(byteSize)}`}
                {staged !== null ? ` · ${labels.pendingReplace}` : ""}
              </Text>
            </View>
          </View>

          <View className="mt-3.5 flex-row gap-2.5">
            <Pressable
              accessibilityRole="button"
              onPress={onScan}
              disabled={scanning}
              className="bg-card h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
            >
              <Icon as={ScanLine} size={16} strokeWidth={2.75} className="text-foreground" />
              <Text className="font-body-semibold text-[13.5px]">
                {scanning ? document.scanning : document.scan}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              onPress={onPick}
              className="bg-card h-11 flex-1 flex-row items-center justify-center gap-2 rounded-full active:opacity-80"
            >
              <Icon as={Upload} size={16} strokeWidth={2.75} className="text-foreground" />
              <Text className="font-body-semibold text-[13.5px]">
                {document.replaceFile}
              </Text>
            </Pressable>
          </View>

          {notice !== null ? (
            <Text className="text-terracotta-800 mt-2.5 text-[11.5px] leading-[1.6]">
              {notice}
            </Text>
          ) : null}
        </View>
      </View>
    </>
  )
}
