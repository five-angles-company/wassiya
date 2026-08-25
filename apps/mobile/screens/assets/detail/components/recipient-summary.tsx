import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { InitialDisc } from "@workspace/ui-native/components/wassiya/initial-disc"
import { Users } from "lucide-react-native"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { View } from "react-native"

/**
 * Who actually receives this asset, by name.
 *
 * ## Why this exists
 *
 * The detail screen used to answer "who receives it?" with a button that said
 * *edit recipients*. The most important fact about an asset in an inheritance
 * vault — the entire reason the asset is in it — was reachable only by opening
 * the editor and reading the checkboxes.
 *
 * Nothing new was needed to fix it: `routing.forAsset` and `heirs.list` are the
 * same two queries the recipients editor already runs. The data was one screen
 * away the whole time.
 *
 * ## Names, not counts
 *
 * "٢ مستلمين" tells an owner nothing they can act on. *Fahmini* and *Maha* let
 * them notice the person who should be there and isn't — which is the only
 * mistake this screen can help catch.
 */
export type RecipientSummaryProps = {
  assetId: Id<"assets">
  /** "كل الورثة" — the shared bucket. */
  allHeirsLabel: string
  /** "الوصي". */
  executorLabel: string
  /** Shown while the asset still follows the default rule. */
  emptyLabel: string
  className?: string
}

export function RecipientSummary({
  assetId,
  allHeirsLabel,
  executorLabel,
  emptyLabel,
  className,
}: RecipientSummaryProps) {
  const rows = useQuery(api.routing.forAsset, { assetId })
  const heirs = useQuery(api.heirs.list)

  // Undefined means still loading; an empty array means genuinely nobody, and
  // the two must not render the same way — one is a wait, the other is a gap.
  if (rows === undefined) return null

  const names = rows.map((row) => {
    // Bound to a `const` first: narrowing on `row.recipient` does not survive
    // into the `find` callback, which reads it from a fresh closure.
    const to = row.recipient
    if (to.kind === "allHeirs") return allHeirsLabel
    if (to.kind === "executor") return executorLabel
    return heirs?.find((heir) => heir.id === to.heirId)?.name ?? ""
  })

  if (names.length === 0) {
    return (
      <View className={className}>
        <Text variant="metaSm">{emptyLabel}</Text>
      </View>
    )
  }

  return (
    <View className={className}>
      <View className="rounded-card bg-sand-100 gap-3 p-4 shadow-sm">
        {names.map((name, i) => (
          <View key={`${name}-${i}`} className="flex-row items-center gap-3">
            {/* The shared bucket is a group, not a person, so it wears an icon
                where an heir wears their initial. Giving "كل الورثة" a letter
                disc would make a category look like someone. */}
            {name === allHeirsLabel ? (
              <View className="bg-olive-200 size-9 items-center justify-center rounded-full">
                <Icon as={Users} size={17} strokeWidth={2.75} className="text-olive-700" />
              </View>
            ) : (
              <InitialDisc name={name} />
            )}
            <Text variant="rowTitle" numberOfLines={1} className="min-w-0 flex-1">
              {name}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}
