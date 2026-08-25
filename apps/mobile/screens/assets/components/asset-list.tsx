import { Text } from "@workspace/ui-native/components/ui/text"
import { AssetRow } from "@workspace/ui-native/components/wassiya/asset-row"
import { AssetRowSkeleton } from "@workspace/ui-native/components/wassiya/asset-row-skeleton"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { cn } from "@workspace/ui-native/lib/utils"
import { SearchX } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { ASSET_TYPE_ICON } from "@/lib/asset-types"
import {
  groupByDestination,
  type DestinationKind,
} from "@/screens/assets/group-by-destination"
import type { AssetListRow } from "@/screens/assets/use-asset-list"

export type AssetListProps = {
  /** Undefined while the query or the decryption pass is still running. */
  rows: AssetListRow[] | undefined
  /** The badge text for a row, already pluralised. */
  recipientLabel: (count: number) => string
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

/** Only the gap is coloured. Two amber headings would rank neither. */
const HEADING_TONE: Record<DestinationKind, string> = {
  none: "text-terracotta-700",
  all: "",
  explicit: "",
}

/**
 * The rows, grouped by where they go, plus the two states that replace them.
 *
 * Rows open ٤.٩. `AssetRow` renders a plain `View` when given no `onPress`,
 * which is what it did while the detail screen did not exist — passing the
 * handler is the whole difference.
 */
export function AssetList({
  rows,
  recipientLabel,
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

  return (
    <View className="gap-header">
      {groupByDestination(rows).map((group) => (
        <View key={group.kind} className="gap-2">
          {/*
            Name and count are two Texts, not one interpolated string.
            "موجَّهة · ١" mixes an Arabic word, a middot and an Arabic-Indic
            numeral in one run, and the bidi algorithm is free to reorder the
            separator around the digit — which it does. Two nodes in a row let
            the layout place them instead of the text engine.
          */}
          <View className="flex-row items-baseline justify-between gap-2">
            <Text variant="sectionLabel" className={cn(HEADING_TONE[group.kind])}>
              {groupLabel(group.kind)}
            </Text>
            <Text variant="metaSm">{groupCount(group.rows.length)}</Text>
          </View>

          <View className="gap-row">
            {group.rows.map((row) => (
              <AssetRow
                key={row.id}
                icon={ASSET_TYPE_ICON[row.type]}
                title={row.title}
                meta={row.subtitle}
                // The heading already says where this group goes, so the row's
                // own badge would repeat it — except in the group that reaches
                // nobody, where the count is the point.
                recipientStatus={row.recipientCount === 0 ? "action" : "confirmed"}
                recipientLabel={
                  group.kind === "explicit"
                    ? recipientLabel(row.recipientCount)
                    : undefined
                }
                onPress={() => onOpen(row.id)}
              />
            ))}
          </View>
        </View>
      ))}
    </View>
  )
}
