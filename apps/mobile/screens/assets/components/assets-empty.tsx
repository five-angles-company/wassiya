import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Plus } from "lucide-react-native"
import { View } from "react-native"

import { GhostRow } from "@/screens/assets/components/ghost-row"

/**
 * ٤.١b — the vault with nothing in it yet.
 *
 * No illustration and no menu of suggested types. One sentence at 19px that
 * teaches how to **choose** — *"whatever your family would lose today, without
 * ever knowing it existed"* — and then the list's own skeleton in ghost form.
 *
 * Left-aligned and low in the frame. A centred empty state reads as an error;
 * this one reads as a page that simply has not been filled in yet, which is
 * exactly what it is.
 */
export type AssetsEmptyProps = {
  title: string
  subtitle: string
  /** The one sentence. */
  lead: string
  addLabel: string
  onAdd: () => void
}

export function AssetsEmpty({
  title,
  subtitle,
  lead,
  addLabel,
  onAdd,
}: AssetsEmptyProps) {
  return (
    <>
      <Text className="font-heading-extrabold text-foreground mb-[5px] text-[30px] leading-[1.2]">
        {title}
      </Text>
      <Text className="text-[13px] opacity-55">{subtitle}</Text>

      <Text className="mb-[30px] mt-8 max-w-[320px] text-[19px] leading-[1.6]">
        {lead}
      </Text>

      {/* 32% — present enough to teach the shape, quiet enough not to be
          mistaken for content that failed to load. */}
      <View className="gap-row mb-auto opacity-[0.32]">
        <GhostRow title="62%" meta="30%" />
        <GhostRow title="48%" meta="22%" />
        <View className="opacity-50">
          <GhostRow title="55%" />
        </View>
      </View>

      <PrimaryCta label={addLabel} onPress={onAdd} icon={Plus} />
    </>
  )
}
