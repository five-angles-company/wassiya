import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { KeyRound } from "lucide-react-native"
import { View } from "react-native"

export type NewDeviceCardProps = {
  title: string
  body: string
}

/**
 * The "جهاز جديد؟" card on 1.5.
 *
 * Always visible, never conditional. Signing in on a new phone gets the user a
 * session but not a vault — the key is sealed in the handset they left behind —
 * and finding that out *after* the code has been verified reads as a failure.
 * Said up front, it reads as the security model working.
 */
export function NewDeviceCard({ title, body }: NewDeviceCardProps) {
  return (
    <View className="rounded-card gap-2.25 bg-card px-4.5 py-4">
      <View className="flex-row items-center gap-2.25">
        <View className="bg-terracotta-200 size-8.5 items-center justify-center rounded-full">
          <Icon as={KeyRound} className="text-terracotta-800 size-4.25" />
        </View>
        <Text className="font-heading-extrabold text-[16px]">{title}</Text>
      </View>
      <Text variant="meta" className="text-muted-foreground">
        {body}
      </Text>
    </View>
  )
}
