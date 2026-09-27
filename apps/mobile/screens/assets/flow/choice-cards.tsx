import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Check, type LucideIcon } from "lucide-react-native"
import { Pressable, View } from "react-native"

export type ChoiceCard<T extends string> = {
  value: T
  title: string
  detail?: string
  icon?: LucideIcon
}

export type ChoiceCardsProps<T extends string> = {
  options: ChoiceCard<T>[]
  value: T | null
  onChange: (value: T) => void
  className?: string
}

/**
 * A single choice as large cards — a step's whole answer when the question is
 * "which kind?". Selected is the one terracotta outline on the screen; the
 * rest stay on the surface.
 */
export function ChoiceCards<T extends string>({
  options,
  value,
  onChange,
  className,
}: ChoiceCardsProps<T>) {
  return (
    <View accessibilityRole="radiogroup" className={cn("gap-row", className)}>
      {options.map((option) => {
        const selected = option.value === value
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{ checked: selected }}
            onPress={() => onChange(option.value)}
            className={cn(
              "rounded-card bg-card flex-row items-center gap-3.5 border-[1.5px] px-4 py-4 active:opacity-85",
              selected ? "border-primary" : "border-transparent"
            )}
          >
            {option.icon !== undefined ? (
              <View
                className={cn(
                  "size-10.5 shrink-0 items-center justify-center rounded-full",
                  selected ? "bg-primary" : "bg-background"
                )}
              >
                <Icon
                  as={option.icon}
                  size={19}
                  strokeWidth={2.5}
                  className={selected ? "text-background" : "text-foreground"}
                />
              </View>
            ) : null}
            <View className="min-w-0 flex-1 gap-0.5">
              <Text className="font-body-semibold text-[15.5px]">{option.title}</Text>
              {option.detail !== undefined ? (
                <Text variant="metaSm" className="text-muted-foreground leading-[1.55]">
                  {option.detail}
                </Text>
              ) : null}
            </View>
            <View
              className={cn(
                "size-5.5 shrink-0 items-center justify-center rounded-full border-[1.5px]",
                selected ? "border-primary bg-primary" : "border-sand-400"
              )}
            >
              {selected ? (
                <Icon as={Check} size={12} strokeWidth={3} className="text-background" />
              ) : null}
            </View>
          </Pressable>
        )
      })}
    </View>
  )
}
