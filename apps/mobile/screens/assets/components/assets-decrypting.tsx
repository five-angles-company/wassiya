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
 * ## Why there is no "٢٨ من ٤٣" here
 *
 * A progress count was intended. This app cannot honestly produce one: the
 * whole list decrypts inside a single `useMemo`, so there is no moment at which
 * some rows are open and the rest are not — the state is "the query has not
 * answered yet", and at that point the total is unknown too. A fabricated count
 * would be the one dishonest number on a screen whose entire job is to be
 * trustworthy. Progressive decryption would earn it back.
 */
export function AssetsDecrypting() {
  return (
    <View className="gap-row">
      <View className="opacity-40">
        <GhostRow title="58%" meta="26%" />
      </View>
      <View className="opacity-[0.32]">
        <GhostRow title="44%" meta="20%" />
      </View>
      <View className="opacity-[0.22]">
        <GhostRow title="52%" meta="24%" />
      </View>
      <View className="opacity-[0.14]">
        <GhostRow title="38%" meta="18%" />
      </View>
    </View>
  )
}
