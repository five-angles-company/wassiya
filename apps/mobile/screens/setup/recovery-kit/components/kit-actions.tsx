import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Printer } from "lucide-react-native"
import { View } from "react-native"

export type KitActionsProps = {
  printLabel: string
  savePdfLabel: string
  shareLabel: string
  disabled: boolean
  onPrint: () => void
  onSavePdf: () => void
  onShare: () => void
}

/**
 * The three ways off 2.4 — print, save a PDF, hand it to another app.
 *
 * All three count equally as the kit milestone. It is deliberate that
 * there is no confirmation step after this screen, so whichever intent
 * succeeds is what marks the sheet printed; insisting on a physical printer
 * would strand every user who saves to a file and prints it at work.
 */
export function KitActions({
  printLabel,
  savePdfLabel,
  shareLabel,
  disabled,
  onPrint,
  onSavePdf,
  onShare,
}: KitActionsProps) {
  return (
    <View className="gap-2.5">
      <PrimaryCta icon={Printer} label={printLabel} onPress={onPrint} disabled={disabled} />
      <View className="flex-row gap-2.5">
        <PrimaryCta
          tone="quiet"
          className="flex-1"
          label={savePdfLabel}
          onPress={onSavePdf}
          disabled={disabled}
        />
        <PrimaryCta
          tone="quiet"
          className="flex-1"
          label={shareLabel}
          onPress={onShare}
          disabled={disabled}
        />
      </View>
    </View>
  )
}
