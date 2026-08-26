import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { EditableRow } from "@workspace/ui-native/components/wassiya/editable-row"
import { FileText, ScanLine } from "lucide-react-native"
import { View } from "react-native"

import {
  describeType,
  type DocumentForm,
} from "@/screens/assets/detail/forms/document"

/**
 * ٤.٥'s fields, as rows.
 *
 * ## What the file row shows, and why it is not a preview
 *
 * The stored document is ciphertext this app has no viewer for. Pretending
 * otherwise — a thumbnail, an "open" button — would promise something the
 * screen cannot deliver. So it states what is there (type and size) and offers
 * the two things it *can* do: replace it from Files, or scan a new one.
 *
 * A replacement is staged, not applied. Nothing is uploaded and nothing is
 * deleted until the owner saves, so backing out of a mis-pick costs nothing.
 * The row says which of the two it is currently showing.
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
  const staged = value.replacement
  const mimeType = staged?.mimeType ?? value.current.mimeType
  const byteSize = staged?.size ?? value.current.byteSize

  return (
    <>
      <EditableRow
        label={document.titleLabel ?? labels.fieldService!}
        value={value.title}
        onChangeText={(title) => onChange({ title })}
        divider
      />

      <View className="gap-3 py-3.5">
        <View className="flex-row items-center gap-3">
          <View className="bg-sand-300 size-10 items-center justify-center rounded-full">
            <Icon as={FileText} size={18} className="text-sand-900" />
          </View>
          <View className="min-w-0 flex-1 gap-0.5">
            <Text variant="rowTitle" numberOfLines={1}>
              {staged?.name ?? labels.filesRowLabel!}
            </Text>
            <Text variant="metaSm" numberOfLines={1}>
              {`${describeType(mimeType)} · ${formatSize(byteSize)}`}
              {staged !== null ? ` · ${labels.pendingReplace!}` : ""}
            </Text>
          </View>
        </View>

        <View className="flex-row gap-2">
          <Button variant="secondary" className="flex-1" onPress={onPick}>
            <Text>{document.replaceFile ?? document.fromFiles}</Text>
          </Button>
          <Button
            variant="secondary"
            className="flex-1"
            onPress={onScan}
            disabled={scanning}
          >
            <Icon as={ScanLine} size={16} />
            <Text>{scanning ? document.scanning : document.scan}</Text>
          </Button>
        </View>

        {notice !== null ? (
          <Text variant="metaSm" className="text-terracotta-800">
            {notice}
          </Text>
        ) : null}
      </View>
    </>
  )
}
