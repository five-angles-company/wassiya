import { Icon } from "@workspace/ui-native/components/ui/icon"
import { cn } from "@workspace/ui-native/lib/utils"
import type { LucideIcon } from "lucide-react-native"
import { View } from "react-native"

/**
 * One tab's glyph, and the pill that marks the tab you are on.
 *
 * ## Why a pill
 *
 * Selection already has a shape in this product. The board states it for the
 * wizards — *"Chips are pills on `--color-surface`; the selected one is solid
 * terracotta"* — and ٤.١'s filter row and ٤.٣'s network chips both follow it.
 * The bar was the one place that said "selected" with colour alone, which made
 * it the only control whose active state you had to notice rather than see.
 *
 * ## The icon on the pill is `background`, not `primary-foreground`
 *
 * #f5ead8, the page ground. That is the board's own rule for anything drawn on
 * terracotta and it is *not* the same as `primary-foreground` (#fff2eb) — the
 * two differ by enough to read as a slightly dirty white on a saturated fill.
 */
export type TabBarIconProps = {
  icon: LucideIcon
  focused: boolean
}

export function TabBarIcon({ icon, focused }: TabBarIconProps) {
  return (
    <View
      className={cn(
        // 28, not 32: the bar is 49dp and the label takes the bottom third,
        // so the icon slot is about 30dp. A taller pill renders clipped along
        // its top edge against the bar's own border.
        "h-7 w-12 items-center justify-center rounded-full",
        focused && "bg-primary"
      )}
    >
      <Icon
        as={icon}
        size={19}
        // The heavier stroke is what keeps the glyph legible once it is sitting
        // on a saturated fill rather than on the bar.
        strokeWidth={focused ? 2.5 : 2}
        className={focused ? "text-background" : "text-muted-foreground"}
      />
    </View>
  )
}
