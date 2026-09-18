import { Text } from "@workspace/ui-native/components/ui/text"
import { MeterBar } from "@workspace/ui-native/components/wassiya/meter-bar"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { cn } from "@workspace/ui-native/lib/utils"
import { View } from "react-native"

import { SETUP_STEP_COUNT } from "@/lib/setup-flow"

export type SetupStepMeterProps = {
  /** 1-based step: KYC, explainer, biometrics, recovery kit. */
  step: number
  /**
   * Turns the bar olive. The bar changes colour in exactly one
   * place — when a step has *completed* (2.1c, 2.3b) — so this is a real
   * signal, not decoration, and must not be set anywhere else.
   */
  complete?: boolean
  /** Dim the whole meter while a modal owns the screen (2.3's OS prompt). */
  dimmed?: boolean
  locale?: Locale
  separator: string
  className?: string
}

/**
 * The "١ من ٤" progress header that opens every metered screen in section ٢.
 *
 * Four steps, not six: 2.1/2.1b/2.1c count as step 1 and
 * 2.3/2.3b as step 3, so sub-screens share their parent's number. 2.6 has no
 * meter at all — it is the destination, not a step.
 */
export function SetupStepMeter({
  step,
  complete = false,
  dimmed = false,
  locale = "ar",
  separator,
  className,
}: SetupStepMeterProps) {
  return (
    <View
      className={cn(
        "flex-row items-center gap-3",
        dimmed && "opacity-40",
        className
      )}
    >
      {/* `MeterBar` derives both the fill and the track from one tone, but the
          a neutral track sits under a coloured fill at every step — the
          terracotta-tinted track the tone would give makes the remaining steps
          look partly done. The explicit background wins the twMerge conflict. */}
      <MeterBar
        className="bg-sand-300 flex-1"
        height="step"
        tone={complete ? "olive" : "terracotta"}
        value={step / SETUP_STEP_COUNT}
      />
      <Text variant="metaSm" className="shrink-0 text-muted-foreground">
        {`${fmtNum(step, locale)} ${separator} ${fmtNum(SETUP_STEP_COUNT, locale)}`}
      </Text>
    </View>
  )
}
