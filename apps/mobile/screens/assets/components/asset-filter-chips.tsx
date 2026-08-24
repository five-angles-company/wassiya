import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pressable, ScrollView } from "react-native"

import type { AssetType } from "@/lib/asset-types"

export type AssetFilterChip = {
  /** Null is the "الكل" chip. */
  type: AssetType | null
  label: string
  /** How many assets this chip would show. Zero chips dim rather than vanish. */
  count: number
}

export type AssetFilterChipsProps = {
  chips: AssetFilterChip[]
  selected: AssetType | null
  onSelect: (type: AssetType | null) => void
}

/**
 * The category row under the search field.
 *
 * Empty categories are **dimmed, not hidden** — the board draws مستندات at
 * half opacity rather than dropping it. A row whose contents change shape as
 * assets are added teaches nothing about what the vault can hold; a dim chip
 * says "this kind exists, you have none".
 *
 * They stay tappable at zero on purpose: tapping one is how a user confirms
 * emptiness, and it lands on the same "nothing matches" state as an
 * over-narrow search.
 */
export function AssetFilterChips({
  chips,
  selected,
  onSelect,
}: AssetFilterChipsProps) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      // The row is wider than the screen and must not clip against the gutter,
      // so the padding belongs to the content rather than the parent.
      contentContainerClassName="px-gutter gap-2"
    >
      {chips.map((chip) => {
        const active = chip.type === selected
        return (
          <Pressable
            key={chip.type ?? "all"}
            onPress={() => onSelect(chip.type)}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            className={cn(
              "rounded-full border px-3.75 py-2",
              active
                ? "bg-terracotta-700 border-terracotta-700"
                : "border-border bg-transparent active:bg-sand-300",
              !active && chip.count === 0 && "opacity-50"
            )}
          >
            <Text
              variant="metaSm"
              className={cn(
                active ? "text-white" : "text-foreground",
                "font-body-medium"
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
