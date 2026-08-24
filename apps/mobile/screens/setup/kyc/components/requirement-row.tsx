import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { View } from "react-native"

export type RequirementRowProps = {
  index: number
  label: string
  locale: Locale
}

/**
 * One numbered "what you'll need" row on 2.1.
 *
 * The number is shaped to the locale — ١٢٣ in Arabic — because it is prose,
 * not data. Codes and identifiers stay Latin; a step count does not.
 */
export function RequirementRow({ index, label, locale }: RequirementRowProps) {
  return (
    <View className="rounded-row flex-row items-center gap-3 bg-card px-4 py-3.5">
      <View className="size-7.5 shrink-0 items-center justify-center rounded-full bg-background">
        <Text variant="meta">{fmtNum(index, locale)}</Text>
      </View>
      <Text className="text-notice flex-1">{label}</Text>
    </View>
  )
}
