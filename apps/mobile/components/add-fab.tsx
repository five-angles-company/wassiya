import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Plus } from "lucide-react-native"
import { Pressable } from "react-native"

/**
 * The round add button on a list tab, passed to `Screen`'s `float` so it paints
 * over the list instead of shortening it.
 */
export function AddFab({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="bg-primary active:bg-terracotta-600 size-14 items-center justify-center rounded-full shadow-md"
    >
      <Icon as={Plus} size={26} strokeWidth={2.75} className="text-background" />
    </Pressable>
  )
}
