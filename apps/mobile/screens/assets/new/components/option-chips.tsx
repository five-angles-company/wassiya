import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pressable, View } from "react-native"

export type OptionChip = {
  value: string
  label: string
}

export type OptionChipsProps = {
  label?: string
  options: OptionChip[]
  value: string
  onChange: (value: string) => void
  className?: string
}

/**
 * A small single-choice row — wallet type, account type, document type, the
 * note's kind.
 *
 * Wraps rather than scrolls. These sets are three or four short words, and a
 * horizontally scrolling row would hide options off the reading edge; the 4.1
 * category filter scrolls because it has seven, this never does.
 *
 * `accessibilityRole="radio"` rather than `"button"`: it is a single choice
 * from a fixed set, and a screen reader announcing four buttons gives no hint
 * that picking one unpicks the others.
 */
export function OptionChips({
  label,
  options,
  value,
  onChange,
  className,
}: OptionChipsProps) {
  return (
    <View className={cn("gap-2", className)}>
      {label ? (
        <Text variant="meta" className="text-muted-foreground">
          {label}
        </Text>
      ) : null}
      <View
        accessibilityRole="radiogroup"
        className="flex-row flex-wrap gap-2"
      >
        {options.map((option) => {
          const active = option.value === value
          return (
            <Pressable
              key={option.value}
              accessibilityRole="radio"
              accessibilityState={{ checked: active }}
              onPress={() => onChange(option.value)}
              className={cn(
                "rounded-full border px-3.75 py-2",
                active
                  ? "border-terracotta-700 bg-terracotta-700"
                  : "border-border active:bg-sand-300 bg-transparent"
              )}
            >
              <Text
                variant="metaSm"
                className={cn(
                  "font-body-medium",
                  active ? "text-white" : "text-foreground"
                )}
              >
                {option.label}
              </Text>
            </Pressable>
          )
        })}
      </View>
    </View>
  )
}
