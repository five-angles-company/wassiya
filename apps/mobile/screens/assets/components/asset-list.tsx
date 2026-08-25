import { Text } from "@workspace/ui-native/components/ui/text"
import { AssetRowSkeleton } from "@workspace/ui-native/components/wassiya/asset-row-skeleton"
import { AssetTile } from "@workspace/ui-native/components/wassiya/asset-tile"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { cn } from "@workspace/ui-native/lib/utils"
import { SearchX } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { ASSET_TYPE_ICON, ASSET_TYPE_TONE } from "@/lib/asset-types"
import {
  groupByDestination,
  type DestinationKind,
} from "@/screens/assets/group-by-destination"
import type { AssetListRow } from "@/screens/assets/use-asset-list"

export type AssetListProps = {
  /** Undefined while the query or the decryption pass is still running. */
  rows: AssetListRow[] | undefined
  /** The category name for a row's type: "مستند", "عملة رقمية". */
  categoryLabel: (row: AssetListRow) => string
  /** The group's name. */
  groupLabel: (kind: DestinationKind) => string
  /** Its size, already pluralised. Rendered separately — see below. */
  groupCount: (count: number) => string
  noResultsTitle: string
  noResultsBody: string
  clearLabel: string
  onClear: () => void
  onOpen: (id: AssetListRow["id"]) => void
}

/**
 * Only the gap is coloured, and only here.
 *
 * The tiles carry a *type* tint on their icon, which means "this holds a
 * secret" — a different thing from "this needs attention". Keeping the
 * destination signal on the heading is what stops one surface carrying both
 * meanings at once.
 */
const HEADING_TONE: Record<DestinationKind, string> = {
  none: "text-terracotta-700",
  all: "",
  explicit: "",
}

/** The grid, plus the two states that replace it. */
export function AssetList({
  rows,
  categoryLabel,
  groupLabel,
  groupCount,
  noResultsTitle,
  noResultsBody,
  clearLabel,
  onClear,
  onOpen,
}: AssetListProps) {
  if (rows === undefined) return <AssetRowSkeleton count={4} />

  if (rows.length === 0) {
    return (
      <EmptyState
        icon={SearchX}
        title={noResultsTitle}
        subtitle={noResultsBody}
        secondaryAction={
          <Pressable
            onPress={onClear}
            accessibilityRole="button"
            className="px-2 py-1"
          >
            <Text variant="metaSm" className="underline">
              {clearLabel}
            </Text>
          </Pressable>
        }
      />
    )
  }

  const groups = groupByDestination(rows)
  /*
    A heading over the only group is bureaucracy: it names a distinction that
    isn't being drawn, and repeats a count the header already gives. Headings
    exist to separate one bucket from another, so they appear when there is
    something to separate.
  */
  const showHeadings = groups.length > 1

  return (
    <View className="gap-header">
      {groups.map((group) => (
        <View key={group.kind} className="gap-2.5">
          {showHeadings ? (
            /*
              Name and count are two Texts, not one interpolated string.
              "موجَّهة · ١" mixes an Arabic word, a middot and an Arabic-Indic
              numeral in one run, and the bidi algorithm is free to reorder the
              separator around the digit — which it does. Two nodes in a row let
              layout place them instead of the text engine.
            */
            <View className="flex-row items-baseline justify-between gap-2">
              <Text variant="sectionLabel" className={cn(HEADING_TONE[group.kind])}>
                {groupLabel(group.kind)}
              </Text>
              <Text variant="metaSm">{groupCount(group.rows.length)}</Text>
            </View>
          ) : null}

          <View className="gap-row flex-row flex-wrap">
            {group.rows.map((row, i) => (
              <AssetTile
                key={row.id}
                icon={ASSET_TYPE_ICON[row.type]}
                title={row.title}
                category={categoryLabel(row)}
                tone={ASSET_TYPE_TONE[row.type]}
                index={i}
                onPress={() => onOpen(row.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}
