import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { View } from "react-native"

export type NumberedRowProps = {
  index: number
  label: string
  /** A quieter second line under the label. */
  body?: string
  locale: Locale
}

/**
 * One numbered step — "what you'll need" on 2.1, "how it works" on an empty
 * list. A card like every other row in the app.
 *
 * The number is shaped to the locale — ١٢٣ in Arabic — because it is prose,
 * not data. Codes and identifiers stay Latin; a step count does not.
 */
export function NumberedRow({ index, label, body, locale }: NumberedRowProps) {
  return (
    <View className="rounded-card bg-card flex-row items-center gap-3 px-4 py-3.5">
      <View className="bg-background size-7.5 shrink-0 items-center justify-center rounded-full">
        <Text variant="meta" className="text-foreground">
          {fmtNum(index, locale)}
        </Text>
      </View>
      <View className="flex-1 gap-0.5">
        <Text variant="rowTitle">{label}</Text>
        {body !== undefined ? <Text variant="metaSm">{body}</Text> : null}
      </View>
    </View>
  )
}
