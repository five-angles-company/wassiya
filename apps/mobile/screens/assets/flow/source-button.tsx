import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import type { LucideIcon } from "lucide-react-native"
import { Pressable, View } from "react-native"

/** A large, card-shaped way to bring a file in — scan leads, files follow. */
export function SourceButton({
  icon,
  label,
  onPress,
  disabled = false,
}: {
  icon: LucideIcon
  label: string
  onPress: () => void
  disabled?: boolean
}) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onPress}
      disabled={disabled}
      className="rounded-card bg-card flex-row items-center gap-3.5 px-4 py-4 active:opacity-85"
    >
      <View className="bg-background size-10.5 items-center justify-center rounded-full">
        <Icon as={icon} size={19} strokeWidth={2.5} className="text-foreground" />
      </View>
      <Text className="font-body-semibold flex-1 text-[15.5px]">{label}</Text>
    </Pressable>
  )
}
