import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Printer } from "lucide-react-native"
import { View } from "react-native"

export type KitActionsProps = {
  printLabel: string
  saveLabel: string
  disabled: boolean
  onPrint: () => void
  onSave: () => void
  /** Present once a print or share intent returned: the footer then asks. */
  confirm?: {
    hint: string
    label: string
    againLabel: string
    busy: boolean
    onConfirm: () => void
    onAgain: () => void
  }
}

/**
 * The footer of a sheet screen: print it, or hand the PDF to the system sheet
 * — where "save to Files" and "share" both live, so they are one button.
 *
 * ⚠️ A returned intent proves only that a dialog opened: Android resolves
 * `printAsync` as soon as its print dialog shows, whether or not anything then
 * prints. So nothing is saved on the intent — the owner confirms the sheet is
 * in their hands, and only that retires the previous one.
 */
export function KitActions({
  printLabel,
  saveLabel,
  disabled,
  onPrint,
  onSave,
  confirm,
}: KitActionsProps) {
  if (confirm !== undefined) {
    return (
      <View className="gap-2.5">
        <Text variant="meta">{confirm.hint}</Text>
        <PrimaryCta label={confirm.label} onPress={confirm.onConfirm} busy={confirm.busy} />
        <PrimaryCta
          tone="quiet"
          label={confirm.againLabel}
          onPress={confirm.onAgain}
          disabled={confirm.busy}
        />
      </View>
    )
  }
  return (
    <View className="gap-2.5">
      <PrimaryCta icon={Printer} label={printLabel} onPress={onPrint} disabled={disabled} />
      <PrimaryCta tone="quiet" label={saveLabel} onPress={onSave} disabled={disabled} />
    </View>
  )
}
