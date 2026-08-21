import { ScrollView, View } from "react-native"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AuthDemo } from "@/src/components/auth-demo"

export default function Index() {
  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerClassName="gap-6 p-6"
      className="bg-background flex-1"
    >
      <View className="gap-1">
        <Text variant="h3">Auth test</Text>
        <Text variant="muted">React Native Reusables · Uniwind</Text>
      </View>
      <AuthDemo />
    </ScrollView>
  )
}
