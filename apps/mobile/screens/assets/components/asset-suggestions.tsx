import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { TONE_SOLID_BG, TONE_SOLID_FG } from "@workspace/ui-native/lib/tone"
import { cn } from "@workspace/ui-native/lib/utils"
import { Pressable, View } from "react-native"
import Animated, { FadeIn, useReducedMotion } from "react-native-reanimated"

import {
  ASSET_TYPE_ICON,
  ASSET_TYPE_TONE,
  type AssetType,
} from "@/lib/asset-types"

/**
 * What to add next, while the vault is nearly empty.
 *
 * ## Why this and not a second "+"
 *
 * A vault holding one asset leaves most of the screen blank, and the obvious
 * patch is an add-tile in the grid. That would be a second add affordance
 * competing with the floating button for the same tap — the duplication this
 * redesign keeps removing.
 *
 * This fills the same space by being *useful* instead. The hard part of setting
 * up a vault is not tapping "add", it is knowing what belongs in one; naming a
 * few kinds is worth more than another button, and it disappears the moment the
 * vault can stand on its own.
 *
 * ## The copy is the point
 *
 * "أضف ما يصعب على عائلتك إيجاده" — *add what your family would struggle to
 * find* — is the whole product in one line. It reframes the task from filing to
 * protecting, which is the difference between a chore and a reason.
 */
export type AssetSuggestionsProps = {
  title: string
  /** Type name per suggestion, e.g. "محفظة رقمية". */
  labelFor: (type: AssetType) => string
  onPick: (type: AssetType) => void
  className?: string
}

/**
 * Three, and these three.
 *
 * A crypto wallet and a digital account are the assets that vanish completely
 * without their secret — nobody recovers a seed phrase by asking a bank. A
 * document is the gentlest possible starting point. Photos and notes are
 * deliberately absent: they are the easy adds people already think of.
 */
const SUGGESTED: readonly AssetType[] = ["crypto", "digital", "document"]

export function AssetSuggestions({
  title,
  labelFor,
  onPick,
  className,
}: AssetSuggestionsProps) {
  const reduced = useReducedMotion()

  return (
    <Animated.View
      entering={reduced ? undefined : FadeIn.delay(220).duration(320)}
      className={className}
    >
      {/*
        No fill. This block sat on `bg-card` — the same surface the asset tiles
        use — and being the larger of the two it read as the main event, with
        the one real asset receding behind the advice about getting more. A
        helper must not out-rank the thing it is helping with.
      */}
      <View className="gap-3">
        <Text variant="metaSm">{title}</Text>

        <View className="gap-row flex-row flex-wrap">
          {SUGGESTED.map((type) => {
            const tone = ASSET_TYPE_TONE[type]
            return (
              <Pressable
                key={type}
                accessibilityRole="button"
                onPress={() => onPick(type)}
                className="active:bg-sand-300 bg-card flex-row items-center gap-2.5 rounded-full py-2 ps-2 pe-4"
              >
                <View
                  className={cn(
                    "size-7 items-center justify-center rounded-full",
                    TONE_SOLID_BG[tone]
                  )}
                >
                  <Icon
                    as={ASSET_TYPE_ICON[type]}
                    size={14}
                    strokeWidth={2.75}
                    className={TONE_SOLID_FG[tone]}
                  />
                </View>
                <Text variant="metaSm" className="text-foreground">
                  {labelFor(type)}
                </Text>
              </Pressable>
            )
          })}
        </View>
      </View>
    </Animated.View>
  )
}
