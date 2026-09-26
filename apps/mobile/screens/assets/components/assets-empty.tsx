import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import {
  AssetTypeGrid,
  type AssetTypeOption,
} from "@workspace/ui-native/components/wassiya/asset-type-grid"
import { Lock } from "lucide-react-native"
import { View } from "react-native"

/**
 * ٤.١b — the vault with nothing in it yet.
 *
 * The six types are the page: an empty vault's only job is to be filled, and
 * showing what can go in it answers "what do I add?" and starts the form in
 * one tap. Left-aligned and low-key — a centred empty state reads as an error,
 * and this is a normal first day.
 *
 * ⚠️ Mount it in a `gap-header` `Screen`: it returns a fragment, so the space
 * between its blocks belongs to the parent.
 */
export type AssetsEmptyProps = {
  title: string
  subtitle: string
  /** The one sentence that teaches how to choose. */
  lead: string
  startLabel: string
  options: AssetTypeOption[]
  /** The quiet line under the grid: nothing leaves the phone unencrypted. */
  trustNote: string
}

export function AssetsEmpty({
  title,
  subtitle,
  lead,
  startLabel,
  options,
  trustNote,
}: AssetsEmptyProps) {
  return (
    <>
      <View>
        <Text className="font-heading-extrabold text-foreground mb-1.25 text-[30px] leading-[1.2]">
          {title}
        </Text>
        <Text className="text-[13px] opacity-55">{subtitle}</Text>
      </View>

      <Text className="max-w-85 text-[17px] leading-[1.65]">{lead}</Text>

      <View className="gap-3">
        <Text variant="sectionLabel">{startLabel}</Text>
        <AssetTypeGrid options={options} />
      </View>

      <View className="mt-auto flex-row items-center gap-2">
        <Icon as={Lock} size={14} strokeWidth={2.5} className="text-muted-foreground" />
        <Text variant="metaSm" className="flex-1 text-muted-foreground">
          {trustNote}
        </Text>
      </View>
    </>
  )
}
