import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pressable, ScrollView } from "react-native"

/**
 * The filter row under a list's header — the vault's and the heirs list's.
 *
 * One component for both on purpose: the two lists are the ones an owner moves
 * between most, and two lookalike rows would drift the first time either was
 * touched.
 *
 * Empty categories dim rather than vanish, and stay tappable at zero. A dim chip
 * says "this kind exists, you have none", and it keeps the row a fixed set so
 * the chip someone reached for last week is still in the same place.
 *
 * An `urgent` chip is a **state, not a category** — it filters by what an item
 * is missing: an asset that reaches nobody, an heir who receives nothing. It
 * reads terracotta at rest and the caller omits it at zero rather than dimming
 * it: a gap with no instances is not news.
 *
 * Not `ChipRow`, though it borrows its grammar, because this row scrolls, dims
 * and carries a null option. `-mx-gutter` on the scroller with the gutter
 * re-applied to its content, so chips run off the edge rather than stopping
 * short — a row that ends cleanly inside the text column does not look
 * scrollable.
 */
export type FilterChip<K> = {
  /** Null is the "الكل" chip. */
  key: K | null
  label: string
  /** How many items this chip would show. Zero dims rather than hides. */
  count: number
  /** A state chip: terracotta at rest, and never dimmed. */
  urgent?: boolean
}

export type FilterChipsProps<K> = {
  chips: FilterChip<K>[]
  selected: K | null
  onSelect: (key: K | null) => void
}

export function FilterChips<K extends string>({
  chips,
  selected,
  onSelect,
}: FilterChipsProps<K>) {
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
        const active = chip.key === selected
        const urgent = chip.urgent === true
        return (
          <Pressable
            key={chip.key ?? "all"}
            onPress={() => onSelect(chip.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: active }}
            className={cn(
              "rounded-full px-[15px] py-2",
              active
                ? "bg-primary"
                : urgent
                  ? "bg-terracotta-100 active:bg-terracotta-200"
                  : "bg-card active:bg-sand-300",
              !active && !urgent && chip.count === 0 && "opacity-50"
            )}
          >
            <Text
              className={cn(
                "text-[12.5px]",
                active
                  ? "font-body-semibold text-background"
                  : urgent
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
