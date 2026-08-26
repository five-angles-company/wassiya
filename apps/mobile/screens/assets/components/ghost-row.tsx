import { cn } from "@workspace/ui-native/lib/utils"
import { View } from "react-native"

/**
 * A vault row with nothing in it — the list's own skeleton.
 *
 * Used twice, for two different reasons that happen to want the same shape:
 * the empty vault draws three dashed ones to teach what a row *will* look like
 * (a tile, a name, a recipient), and the opening vault draws solid ones under
 * the names that have already resolved, so nothing shifts as the rest land.
 *
 * That is the whole argument for it over an illustration: three ghost rows
 * teach the shape of what's coming far better than a picture of a safe, and
 * they cost nothing — same hairline, same geometry, same 56px inset.
 */
export type GhostRowProps = {
  /** Dashed for "not yet added", solid for "not yet decrypted". */
  variant?: "dashed" | "solid"
  /** Fraction of the row's width the name bar fills. */
  title: `${number}%`
  /** Fraction for the recipient bar. Omit for a row with only a name. */
  meta?: `${number}%`
  divider?: boolean
  className?: string
}

export function GhostRow({
  variant = "dashed",
  title,
  meta,
  divider,
  className,
}: GhostRowProps) {
  const dashed = variant === "dashed"
  return (
    <View className={className}>
      <View className="flex-row items-center gap-[14px] py-[13px]">
        <View
          className={cn(
            "size-[42px] shrink-0 rounded-[14px]",
            dashed ? "border-sand-500 border-[1.5px] border-dashed" : "bg-card"
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
      {divider ? <View className="bg-border ms-[56px] h-px" /> : null}
    </View>
  )
}
