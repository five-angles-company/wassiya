import { Text } from "@workspace/ui-native/components/ui/text"
import { AssetRow } from "@workspace/ui-native/components/wassiya/asset-row"
import { AssetRowSkeleton } from "@workspace/ui-native/components/wassiya/asset-row-skeleton"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { SearchX } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { ASSET_TYPE_ICON } from "@/lib/asset-types"
import type { AssetListRow } from "@/screens/assets/use-asset-list"

export type AssetListProps = {
  /** Undefined while the query or the decryption pass is still running. */
  rows: AssetListRow[] | undefined
  /** The badge text for a row, already pluralised. */
  recipientLabel: (count: number) => string
  noResultsTitle: string
  noResultsBody: string
  clearLabel: string
  onClear: () => void
}

/**
 * The rows themselves, plus the two states that replace them.
 *
 * Rows are deliberately **not pressable**: 4.9 (asset detail) is not built, and
 * `AssetRow` renders a plain `View` when it is given no `onPress`, so a tap
 * does nothing visible rather than looking like a button that fails. Handing it
 * a handler is the single change that turns the list live once 4.9 lands.
 */
export function AssetList({
  rows,
  recipientLabel,
  noResultsTitle,
  noResultsBody,
  clearLabel,
  onClear,
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
            <Text variant="metaSm" className="text-muted-foreground underline">
              {clearLabel}
            </Text>
          </Pressable>
        }
      />
    )
  }

  return (
    <View className="gap-row">
      {rows.map((row) => (
        <AssetRow
          key={row.id}
          icon={ASSET_TYPE_ICON[row.type]}
          title={row.title}
          meta={row.subtitle}
          // The one status a row carries. Unrouted takes terracotta because an
          // asset that reaches nobody is the outcome this product exists to
          // prevent; a routed one recedes into olive.
          recipientStatus={row.routed ? "confirmed" : "action"}
          recipientLabel={recipientLabel(row.recipientCount)}
        />
      ))}
    </View>
  )
}
