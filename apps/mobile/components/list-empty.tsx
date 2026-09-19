import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Plus } from "lucide-react-native"
import { View } from "react-native"

import { GhostRow } from "@/components/ghost-row"

/**
 * An owner list with nobody in it yet — ٥.١b heirs, and any list that follows its pattern.
 *
 * Deliberately the twin of `assets-empty.tsx`: same block, same sizes, same
 * ghost cards. These are the two lists an owner meets first, and they were
 * telling different stories — the vault said "a page not filled in yet", the
 * heirs list a centred medallion that reads as a state the app got into rather
 * than one the owner simply has not left yet.
 *
 * Left-aligned and low in the frame for the reason the vault gives: **a centred
 * empty state reads as an error.**
 *
 * The ghosts carry no trailing disc. A heir card has none, and a ghost that
 * promises one teaches a layout that never arrives.
 *
 * ⚠️ **Mount it in a `gap-header` `Screen`.** This returns a fragment, so the
 * spacing between its blocks belongs to the parent container, exactly as
 * `AssetsEmpty` does. A bare `<Screen>` collapses them and the two screens
 * stop matching.
 */
export type ListEmptyProps = {
  title: string
  subtitle: string
  /** The one sentence. */
  lead: string
  addLabel: string
  onAdd: () => void
}

export function ListEmpty({
  title,
  subtitle,
  lead,
  addLabel,
  onAdd,
}: ListEmptyProps) {
  return (
    <>
      <Text className="font-heading-extrabold text-foreground mb-[5px] text-[30px] leading-[1.2]">
        {title}
      </Text>
      <Text className="text-[13px] opacity-55">{subtitle}</Text>

      <Text className="mb-[30px] mt-8 max-w-[320px] text-[19px] leading-[1.6]">
        {lead}
      </Text>

      <View className="gap-row mb-auto opacity-[0.32]">
        <GhostRow title="58%" meta="34%" trailing={false} />
        <GhostRow title="44%" meta="26%" trailing={false} />
        <View className="opacity-50">
          <GhostRow title="50%" trailing={false} />
        </View>
      </View>

      <PrimaryCta label={addLabel} onPress={onAdd} icon={Plus} />
    </>
  )
}
