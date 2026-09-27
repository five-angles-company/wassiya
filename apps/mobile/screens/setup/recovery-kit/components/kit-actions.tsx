import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Printer } from "lucide-react-native"
import { View } from "react-native"

export type KitActionsProps = {
  printLabel: string
  saveLabel: string
  disabled: boolean
  onPrint: () => void
  onSave: () => void
}

/**
 * The two ways off a sheet screen: print it, or hand the PDF to the system
 * sheet — where "save to Files" and "share" both live, so they are one button.
 *
 * Either counts as the milestone. There is no confirmation step after this
 * screen, so whichever intent succeeds marks the sheet printed; insisting on a
 * physical printer would strand every user who saves a file and prints it at
 * work.
 */
export function KitActions({ printLabel, saveLabel, disabled, onPrint, onSave }: KitActionsProps) {
  return (
    <View className="gap-2.5">
      <PrimaryCta icon={Printer} label={printLabel} onPress={onPrint} disabled={disabled} />
      <PrimaryCta tone="quiet" label={saveLabel} onPress={onSave} disabled={disabled} />
    </View>
  )
}
