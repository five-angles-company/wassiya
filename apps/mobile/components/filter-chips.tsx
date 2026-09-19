import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pressable, ScrollView } from "react-native"

import type { AssetFilter } from "@/screens/assets/use-asset-list"

/**
 * The category filter under the vault's header.
 *
 * Empty categories dim rather than vanish, and stay tappable at zero. A dim chip
 * says "this kind exists, you have none", and it keeps the row a fixed set so
 * the chip someone reached for last week is still in the same place.
 *
 * "بلا مستلم" sits second and is a **state, not a category** — it filters by
 * what an asset is missing. It earns the place because ٤.١ groups by type, so
 * the assets that reach nobody are spread across every heading and this is the
 * only one-tap way to collect them. It reads terracotta at rest, and it hides at
 * zero rather than dimming: a gap with no instances is not news.
 *
 * Not `ChipRow`, though it borrows its grammar, because this row scrolls, dims
 * and carries a null option. `-mx-gutter` on the scroller with the gutter
 * re-applied to its content, so chips run off the edge rather than stopping
 * short — a row that ends cleanly inside the text column does not look
 * scrollable.
 */
export type AssetFilterChip = {
  /** Null is the "الكل" chip; "unrouted" is the state chip. */
  type: AssetFilter
  label: string
  /** How many assets this chip would show. Zero dims rather than hides. */
  count: number
}

export type AssetFilterChipsProps = {
  chips: AssetFilterChip[]
  selected: AssetFilter
  onSelect: (type: AssetFilter) => void
}

export function AssetFilterChips({
  chips,
  selected,
  onSelect,
}: AssetFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="-mx-gutter grow-0"
      // `items-center` is load-bearing, not cosmetic: a horizontal ScrollView
      // lays its content out as a row whose cross axis is `stretch` by default,
      // so without it every chip grows to the scroller's full height and
      // `rounded-full` turns each one into an ellipse.
      contentContainerClassName="px-gutter items-center gap-2"
    >
      {chips.map((chip) => {
        const active = chip.type === selected
        const gap = chip.type === "unrouted"
        return (
          <Pressable
            key={chip.type ?? "all"}
            onPress={() => onSelect(chip.type)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            className={cn(
              "rounded-full px-[15px] py-2",
              active
                ? "bg-primary"
                : gap
                  ? "bg-terracotta-100 active:bg-terracotta-200"
                  : "bg-card active:bg-sand-300",
              !active && !gap && chip.count === 0 && "opacity-50"
            )}
          >
            <Text
              className={cn(
                "text-[12.5px]",
                active
                  ? "font-body-semibold text-background"
                  : gap
                    ? "text-terracotta-800 font-body-semibold"
                    : "text-foreground"
              )}
            >
              {chip.label}
            </Text>
          </Pressable>
        )
      })}
    </ScrollView>
  )
}
