import { cn } from "@workspace/ui-native/lib/utils"
import { View } from "react-native"

/**
 * A vault card with nothing in it — the list's own skeleton.
 *
 * Used twice, for two reasons that want the same shape: the empty vault draws
 * three dashed ones to teach what a card *will* look like (a disc, a name, a
 * recipient), and the opening vault draws solid ones under the names that have
 * already resolved, so nothing shifts as the rest land.
 *
 * It has to be a **card** now, matching `VaultRow`. A row-shaped ghost would
 * teach a new owner the one layout they are never going to see, which is worse
 * than showing them nothing.
 */
export type GhostRowProps = {
  /** Dashed for "not yet added", solid for "not yet decrypted". */
  variant?: "dashed" | "solid"
  /** Fraction of the card's width the name bar fills. */
  title: `${number}%`
  /** Fraction for the recipient bar. Omit for a card with only a name. */
  meta?: `${number}%`
  className?: string
}

export function GhostRow({
  variant = "dashed",
  title,
  meta,
  className,
}: GhostRowProps) {
  const dashed = variant === "dashed"
  return (
    <View
      className={cn(
        "rounded-card flex-row items-center gap-3 px-4 py-3.5",
        dashed ? "border-sand-400 border-[1.5px] border-dashed" : "bg-card",
        className
      )}
    >
      <View
        className={cn(
          "size-9 shrink-0 rounded-full",
          dashed ? "border-sand-500 border-[1.5px] border-dashed" : "bg-sand-300"
        )}
      />
      <View className="flex-1 gap-[7px]">
        <View
          className={cn(
            "h-[11px] rounded-full",
            dashed ? "bg-sand-400" : "bg-sand-300"
          )}
          style={{ width: title }}
        />
        {meta !== undefined ? (
          <View
            className={cn(
              "h-2 rounded-full",
              dashed ? "bg-sand-300" : "bg-sand-200"
            )}
            style={{ width: meta }}
          />
        ) : null}
      </View>
      {dashed ? (
        <View className="border-sand-500 size-[29px] shrink-0 rounded-full border-[1.5px] border-dashed" />
      ) : null}
    </View>
  )
}
