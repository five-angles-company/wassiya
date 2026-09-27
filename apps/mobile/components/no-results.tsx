import { Text } from "@workspace/ui-native/components/ui/text"
import { Pressable, View } from "react-native"

/**
 * A search or a filter narrowed a list that is not empty. Different state,
 * different words: nothing is missing, the view is just narrow.
 */
export function NoResults({
  title,
  body,
  clearLabel,
  onClear,
}: {
  title: string
  body: string
  clearLabel: string
  onClear: () => void
}) {
  return (
    <View className="gap-2 pt-2">
      <Text variant="rowTitle">{title}</Text>
      <Text variant="proseSm">{body}</Text>
      <Pressable accessibilityRole="button" onPress={onClear} hitSlop={8} className="mt-1 self-start">
        <Text variant="action">{clearLabel}</Text>
      </Pressable>
    </View>
  )
}
