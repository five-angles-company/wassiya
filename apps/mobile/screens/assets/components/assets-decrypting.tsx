import { Text } from "@workspace/ui-native/components/ui/text"
import { View } from "react-native"

import { GhostRow } from "@/components/ghost-row"

/**
 * ٤.١ while the vault is opening.
 *
 * No spinner and no overlay: the rows arrive in place, which reads as arriving
 * rather than waiting. The skeletons hold the exact row geometry so nothing
 * shifts as real names land, and they fade down the page so the eye stays at
 * the top where the next one appears.
 *
 * The status sits in the subtitle slot the handover figure normally occupies, so
 * the header never changes height between this screen and the list.
 *
 * ## Why there is no "٢٨ من ٤٣" here
 *
 * A progress count was intended. This app cannot honestly produce one: the
 * whole list decrypts inside a single `useMemo`, so there is no moment at which
 * some rows are open and the rest are not — the state is "the query has not
 * answered yet", and at that point the total is unknown too. A fabricated count
 * would be the one dishonest number on a screen whose entire job is to be
 * trustworthy. Progressive decryption would earn it back.
 */
export type AssetsDecryptingProps = {
  title: string
  /** "تُفتح على جهازك" — olive, because this is progress, not a problem. */
  subtitle: string
}

export function AssetsDecrypting({ title, subtitle }: AssetsDecryptingProps) {
  return (
    <>
      <View className="mb-[26px] flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="font-heading-extrabold text-foreground mb-[5px] text-[30px] leading-[1.2]">
            {title}
          </Text>
          <Text className="text-olive-700 text-[13px]">{subtitle}</Text>
        </View>
      </View>

      <View className="gap-row mb-auto">
        <View className="opacity-40">
          <GhostRow variant="solid" title="58%" meta="26%" />
        </View>
        <View className="opacity-[0.32]">
          <GhostRow variant="solid" title="44%" meta="20%" />
        </View>
        <View className="opacity-[0.22]">
          <GhostRow variant="solid" title="52%" meta="24%" />
        </View>
        <View className="opacity-[0.14]">
          <GhostRow variant="solid" title="38%" meta="18%" />
        </View>
      </View>
    </>
  )
}
