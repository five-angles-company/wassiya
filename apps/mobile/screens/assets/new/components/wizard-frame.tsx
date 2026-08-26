/**
 * The shell every ٤.٣–٤.٨ wizard fills in.
 *
 * ## The step count is text, not a meter
 *
 * "١ من ٢" sits at 12px in the header's trailing slot. Two steps do not need a
 * progress bar — a meter across the top of a two-step flow is chrome pretending
 * to be information, and it competes with the one thing on the screen that
 * should be loud.
 *
 * ## No boxed inputs
 *
 * Same grammar as the asset screen: label-over-value rows on hairlines. On ٤.٣
 * that is what leaves the seed grid as the only enclosed thing on the page, so
 * it reads as the vault-within-the-vault without any copy saying so.
 *
 * ## A disabled CTA is surface-toned and says why
 *
 * Never a faded terracotta — a greyed accent reads as a broken button. Pass
 * `disabledLabel` wherever the blocker is nameable ("اختر واحداً للمتابعة"), so
 * the control explains its own refusal instead of leaving someone to hunt for
 * the empty field.
 */
import type { ReactNode } from "react"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { ScreenTop } from "@workspace/ui-native/components/wassiya/screen-top"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

export type WizardFrameProps = {
  /** "محفظة رقمية" — the type being added. */
  title: string
  /** The board meters every wizard "١ من ٢"; step 2 is heir assignment. */
  step?: number
  stepCount?: number
  canSubmit: boolean
  /** Names the blocker while `canSubmit` is false. */
  blockedLabel?: string
  submitting: boolean
  onSubmit: () => void
  children: ReactNode
}

export function WizardFrame({
  title,
  step = 1,
  stepCount = 2,
  canSubmit,
  blockedLabel,
  submitting,
  onSubmit,
  children,
}: WizardFrameProps) {
  const { t, locale } = useStrings("assets/new")
  const { t: common } = useStrings("common")

  return (
    <Screen keyboard bleed contentClassName="px-[22px] pt-5">
      <ScreenTop
        backLabel={common.back}
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/assets/new")
        }
        trailing={
          <Text className="shrink-0 text-[12px] opacity-50">
            {`${fmtNum(step, locale)} ${t.stepSeparator} ${fmtNum(stepCount, locale)}`}
          </Text>
        }
        className="mb-[22px]"
      />

      <Text className="font-heading-extrabold text-foreground mb-6 text-[28px] leading-[1.25]">
        {title}
      </Text>

      {children}

      <PrimaryCta
        label={t.save!}
        disabledLabel={blockedLabel}
        onPress={onSubmit}
        disabled={!canSubmit}
        busy={submitting}
        className="mt-5"
      />
    </Screen>
  )
}
