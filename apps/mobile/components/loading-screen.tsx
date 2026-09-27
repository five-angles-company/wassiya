import { Text } from "@workspace/ui-native/components/ui/text"
import { NATIVE_COLOR } from "@workspace/ui-native/lib/native-colors"
import type { Href } from "expo-router"
import { ActivityIndicator, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

/**
 * A whole screen waiting on its data. A screen that has a back control keeps
 * it while loading — a spinner with no way out is a dead end if the wait never
 * ends.
 */
export function LoadingScreen({ back, label }: { back?: true | Href; label?: string }) {
  const { t } = useStrings("common")
  return (
    <Screen scroll={false}>
      {back !== undefined ? (
        <BackButton label={t.back} fallbackHref={back === true ? undefined : back} />
      ) : null}
      <View className="flex-1 items-center justify-center gap-3">
        <ActivityIndicator color={NATIVE_COLOR.mutedForeground} />
        {label !== undefined ? <Text variant="meta">{label}</Text> : null}
      </View>
    </Screen>
  )
}
