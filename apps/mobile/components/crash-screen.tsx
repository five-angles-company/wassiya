import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import type { ErrorBoundaryProps } from "expo-router"
import { View } from "react-native"

import { resolveLocale } from "@/i18n/locale"
import { COMMON } from "@/i18n/strings/common"

/**
 * What a render error shows instead of a dead app. It sits above every
 * provider, so it reads nothing from Convex or Clerk — the default language
 * picks the words — and "try again" re-mounts the tree.
 */
export function CrashScreen({ retry }: ErrorBoundaryProps) {
  const locale = resolveLocale(undefined)
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-background px-6">
      <Text variant="dialogTitle" className="text-center">
        {COMMON.crashTitle[locale]}
      </Text>
      <Text variant="proseSm" className="max-w-80 text-center">
        {COMMON.crashBody[locale]}
      </Text>
      <PrimaryCta
        label={COMMON.crashRetry[locale]}
        onPress={() => void retry()}
        className="mt-4 self-stretch"
      />
    </View>
  )
}
