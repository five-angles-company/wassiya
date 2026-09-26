/**
 * The shell every ٤.٣–٤.٨ wizard fills in. One step: a saved asset opens on
 * its own screen, where its handover choice is shown.
 *
 * No boxed inputs — label-over-value rows on hairlines, the same grammar as the
 * asset screen. On ٤.٣ that is what leaves the seed grid as the only enclosed
 * thing on the page.
 *
 * A disabled CTA is surface-toned and says why, never a faded terracotta, which
 * reads as a broken button. Pass `disabledLabel` wherever the blocker is
 * nameable so the control explains its own refusal.
 */
import type { ReactNode } from "react"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { ScreenTop } from "@workspace/ui-native/components/wassiya/screen-top"
import { router } from "expo-router"

import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

export type WizardFrameProps = {
  /** "محفظة رقمية" — the type being added. */
  title: string
  canSubmit: boolean
  /** Names the blocker while `canSubmit` is false. */
  blockedLabel?: string
  submitting: boolean
  onSubmit: () => void
  children: ReactNode
}

export function WizardFrame({
  title,
  canSubmit,
  blockedLabel,
  submitting,
  onSubmit,
  children,
}: WizardFrameProps) {
  const { t } = useStrings("assets/new")
  const { t: common } = useStrings("common")

  return (
    <Screen keyboard>
      <ScreenTop
        backLabel={common.back}
        // Falls back to the list, not to the picker: the picker is a sheet
        // over the list now, so there is no route to return to.
        onBack={() =>
          router.canGoBack() ? router.back() : router.replace("/assets")
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
