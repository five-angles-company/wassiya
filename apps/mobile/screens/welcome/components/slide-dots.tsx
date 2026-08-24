import { cn } from "@workspace/ui-native/lib/utils"
import { Pressable, View } from "react-native"

export type SlideDotsProps = {
  count: number
  index: number
  onSelect: (index: number) => void
  label: (index: number) => string
  className?: string
}

/**
 * The carousel's position indicator. Dots are tappable, per the board — they
 * are the only way back to an earlier slide once the user has swiped past it,
 * short of swiping again.
 *
 * `flex-row` IS mirrored under RTL by React Native, and that is what makes the
 * indicator correct rather than something to compensate for: dot 0 renders at
 * the right, so the run fills right-to-left in step with the paged ScrollView,
 * whose offsets also run right-to-left. Verified on an RTL device — slide 4
 * highlights the leftmost dot. Do not "fix" this with `flex-row-reverse`.
 */
export function SlideDots({
  count,
  index,
  onSelect,
  label,
  className,
}: SlideDotsProps) {
  return (
    <View
      className={cn("flex-row items-center justify-center gap-1.75", className)}
    >
      {Array.from({ length: count }, (_, i) => (
        <Pressable
          key={i}
          accessibilityRole="button"
          accessibilityLabel={label(i)}
          accessibilityState={{ selected: i === index }}
          hitSlop={10}
          onPress={() => onSelect(i)}
        >
          <View
            className={cn(
              "h-1.75 rounded-full",
              i === index ? "w-6.5 bg-primary" : "bg-sand-400 w-1.75"
            )}
          />
        </Pressable>
      ))}
    </View>
  )
}
