import { cn } from "@workspace/ui-native/lib/utils"
import { View } from "react-native"

/**
 * A card with nothing in it yet — the opening vault draws these under the
 * names that have already resolved, so nothing shifts as the rest land.
 *
 * It has to be a **card**, matching `VaultRow`: a row-shaped ghost would show
 * a layout the owner is never going to see.
 */
export type GhostRowProps = {
  /** Fraction of the card's width the name bar fills. */
  title: `${number}%`
  /** Fraction for the second line. Omit for a card with only a name. */
  meta?: `${number}%`
  className?: string
}

export function GhostRow({ title, meta, className }: GhostRowProps) {
  return (
    <View
      className={cn(
        "rounded-card bg-card flex-row items-center gap-3 px-4 py-3.5",
        className
      )}
    >
      <View className="bg-sand-300 size-9 shrink-0 rounded-full" />
      <View className="flex-1 gap-1.75">
        <View
          className="bg-sand-300 h-2.75 rounded-full"
          style={{ width: title }}
        />
        {meta !== undefined ? (
          <View
            className="bg-sand-200 h-2 rounded-full"
            style={{ width: meta }}
          />
        ) : null}
      </View>
    </View>
  )
}
