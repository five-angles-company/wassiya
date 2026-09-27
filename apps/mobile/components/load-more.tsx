import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pressable } from "react-native"

/** "Show more" under a paginated list — a text action, never a button. */
export function LoadMore({
  label,
  onPress,
  className,
}: {
  label: string
  onPress: () => void
  className?: string
}) {
  return (
    <Pressable
      accessibilityRole="button"
      hitSlop={8}
      onPress={onPress}
      className={cn("items-center py-3 active:opacity-70", className)}
    >
      <Text variant="action">{label}</Text>
    </Pressable>
  )
}
