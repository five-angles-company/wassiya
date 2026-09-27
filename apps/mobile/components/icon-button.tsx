import { Icon } from "@workspace/ui-native/components/ui/icon"
import type { LucideIcon } from "lucide-react-native"
import { Pressable } from "react-native"

/** A 40px round action in a header — drawn exactly like the back control. */
export function IconButton({
  icon,
  label,
  onPress,
}: {
  icon: LucideIcon
  label: string
  onPress: () => void
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="bg-card size-10 shrink-0 items-center justify-center rounded-full active:opacity-70"
    >
      <Icon as={icon} size={19} strokeWidth={2.75} className="text-foreground" />
    </Pressable>
  )
}
