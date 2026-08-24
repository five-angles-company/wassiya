import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { MeterBar } from "@workspace/ui-native/components/wassiya/meter-bar"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type * as React from "react"
import { KeyboardAvoidingView, Platform, ScrollView, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { useStrings } from "@/i18n/use-strings"

export type WizardFrameProps = {
  title: string
  /** The board meters every wizard "١ من ٢"; step 2 is heir assignment. */
  step?: number
  stepCount?: number
  /** Enables the footer button. */
  canSubmit: boolean
  submitting: boolean
  onSubmit: () => void
  children: React.ReactNode
}

/**
 * The chrome every ٤.٣–٤.٨ wizard shares: back, title, step meter, a scrolling
 * body and one pinned action.
 *
 * ## About the footer label
 *
 * The board's button reads "التالي: من يستلمه؟" — *next: who receives it?* —
 * because each wizard is two steps and the second is heir assignment (5.3).
 * That screen does not exist yet, so this says **"احفظ في الخزنة"** and means
 * it: the asset is encrypted, uploaded and saved, and the run ends. Keeping the
 * board's label over a button that does not go there would promise a step that
 * silently is not taken, on the one screen where "who gets this" is the whole
 * point.
 *
 * The line under the button carries the rest of the truth — the asset lands
 * unrouted, and 4.1 will show it with the terracotta "بلا مستلم" badge until
 * 5.3 lands. That badge is not a defect; it is the list doing its job.
 */
export function WizardFrame({
  title,
  step = 1,
  stepCount = 2,
  canSubmit,
  submitting,
  onSubmit,
  children,
}: WizardFrameProps) {
  const { t, locale } = useStrings("assets/new")

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      // Only iOS needs this; Android's adjustResize already reflows the window,
      // and doubling them lifts the footer twice as far as the keyboard.
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerClassName="px-gutter grow pb-6 pt-4"
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        <BackButton label={t.back} />

        <View className="mb-header mt-4 gap-2">
          <Text variant="screenTitle">{title}</Text>
          <View className="flex-row items-center gap-3">
            <MeterBar className="flex-1" value={step / stepCount} />
            <Text variant="metaSm" className="text-muted-foreground">
              {`${fmtNum(step, locale)} ${t.stepSeparator} ${fmtNum(stepCount, locale)}`}
            </Text>
          </View>
        </View>

        {children}

        <View className="grow" />

        <View className="mt-6 gap-2">
          <Button onPress={onSubmit} disabled={!canSubmit || submitting}>
            <Text>{submitting ? t.saving : t.save}</Text>
          </Button>
          <Text variant="metaSm" className="text-muted-foreground text-center">
            {t.unroutedNote}
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
