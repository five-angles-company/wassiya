import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
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
 * All three count equally as the kit milestone. The board is explicit that
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
    <View className="gap-2.25">
      <Button disabled={disabled} onPress={onPrint}>
        {/* Matches the label beside it — both are content on terracotta,
            which the board sets in `background`. */}
        <Icon as={Printer} className="text-background size-5" />
        <Text>{printLabel}</Text>
      </Button>
      <View className="flex-row gap-2.5">
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={disabled}
          onPress={onSavePdf}
        >
          <Text>{savePdfLabel}</Text>
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1"
          disabled={disabled}
          onPress={onShare}
        >
          <Text>{shareLabel}</Text>
        </Button>
      </View>
    </View>
  )
}
