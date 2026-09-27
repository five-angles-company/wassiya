import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import type { LucideIcon } from "lucide-react-native"
import { View } from "react-native"

/**
 * A short state that fills the space under the header instead of leaving it
 * empty — waiting, locked, nothing to show. The screen's button stays pinned
 * in its footer; this only centres what is said.
 */
export function CenteredNote({
  icon,
  title,
  body,
}: {
  icon: LucideIcon
  title?: string
  body: string
}) {
  return (
    <View className="flex-1 items-center justify-center gap-3 py-8">
      <View className="bg-card size-16 items-center justify-center rounded-full">
        <Icon as={icon} size={28} strokeWidth={2.75} className="text-foreground" />
      </View>
      {title !== undefined ? (
        <Text variant="dialogTitle" className="mt-2 text-center">
          {title}
        </Text>
      ) : null}
      <Text variant="proseSm" className="max-w-80 text-center">
        {body}
      </Text>
    </View>
  )
}
