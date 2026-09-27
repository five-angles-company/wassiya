import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { View } from "react-native"

/** ٥.٢'s "how it works": three numbered lines in one card, above the form. */
export function ExecutorSteps({
  steps,
  locale,
  className,
}: {
  steps: { label: string; body: string }[]
  locale: Locale
  className?: string
}) {
  return (
    <View className={`overflow-hidden rounded-card bg-card ${className ?? ""}`}>
      {steps.map((step, index) => (
        <View key={step.label}>
          <View className="flex-row items-center gap-3 px-4 py-3.5">
            <View className="size-7.5 shrink-0 items-center justify-center rounded-full bg-background">
              <Text variant="meta" className="text-foreground">
                {fmtNum(index + 1, locale)}
              </Text>
            </View>
            <View className="flex-1 gap-0.5">
              <Text variant="rowTitle">{step.label}</Text>
              <Text variant="metaSm">{step.body}</Text>
            </View>
          </View>
          {index < steps.length - 1 ? (
            <View className="mx-4 h-px bg-border" />
          ) : null}
        </View>
      ))}
    </View>
  )
}
