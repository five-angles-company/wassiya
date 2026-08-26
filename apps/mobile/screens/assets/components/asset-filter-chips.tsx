import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pressable, ScrollView } from "react-native"

import type { AssetType } from "@/lib/asset-types"

/**
 * The category filter under the vault's header.
 *
 * ## Empty categories dim, they do not vanish
 *
 * A row whose contents change shape as assets are added teaches nothing about
 * what the vault can *hold*. A dim chip says "this kind exists, you have none",
 * which is the more useful sentence — and it keeps the row a fixed set, so the
 * chip someone reached for last week is still in the same place.
 *
 * They stay tappable at zero on purpose: tapping one is how a person confirms
 * emptiness, and it lands on the same "nothing matches" state an over-narrow
 * search does.
 *
 * ## Same pills as everywhere else
 *
 * `bg-card` at rest, solid terracotta when selected — the grammar `ChipRow`
 * uses in the wizards. It is not `ChipRow` itself because this row scrolls,
 * dims, and carries a null option, none of which that component does.
 *
 * ## It bleeds past the gutter
 *
 * `-mx-gutter` on the scroller with the gutter re-applied to its *content*, so
 * chips run off the edge of the screen rather than stopping short at a margin.
 * A row that ends cleanly inside the text column does not look scrollable.
 */
export type AssetFilterChip = {
  /** Null is the "الكل" chip. */
  type: AssetType | null
  label: string
  /** How many assets this chip would show. Zero dims rather than hides. */
  count: number
}

export type AssetFilterChipsProps = {
  chips: AssetFilterChip[]
  selected: AssetType | null
  onSelect: (type: AssetType | null) => void
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
        return (
          <Pressable
            key={chip.type ?? "all"}
            onPress={() => onSelect(chip.type)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            className={cn(
              "rounded-full px-[15px] py-2",
              active ? "bg-primary" : "bg-card active:bg-sand-300",
              !active && chip.count === 0 && "opacity-50"
            )}
          >
            <Text
              className={cn(
                "text-[12.5px]",
                active
                  ? "font-body-semibold text-background"
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
