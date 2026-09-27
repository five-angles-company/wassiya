/**
 * The frame every asset step flow fills in: one question per screen, a
 * continuous progress bar, and the one button that moves on.
 *
 * Three rules it holds for every type:
 *
 *  - **Back walks the steps.** The on-screen back and Android's hardware back
 *    both return to the previous step, and only the first step leaves — after
 *    asking, when something was entered. The iOS swipe is off for the same
 *    reason: a gesture must not silently throw away a half-entered secret.
 *  - **Nothing is persisted between steps.** The host holds the answers in
 *    component state; leaving the flow drops them.
 *  - **The button says why it waits.** A step that cannot continue names what
 *    is missing on the button itself.
 */
import { useCallback, useEffect, useState } from "react"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ConfirmSheet } from "@workspace/ui-native/components/wassiya/confirm-sheet"
import { MeterBar } from "@workspace/ui-native/components/wassiya/meter-bar"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { ScreenTop } from "@workspace/ui-native/components/wassiya/screen-top"
import { Stack } from "expo-router"
import { BackHandler, View } from "react-native"
import Animated, {
  FadeInLeft,
  FadeInRight,
  useReducedMotion,
} from "react-native-reanimated"

import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import type { FlowStep } from "@/screens/assets/flow/types"

export type StepFlowProps = {
  /** The type's name, above each question — "محفظة رقمية". */
  kicker: string
  steps: FlowStep[]
  finishLabel: string
  onFinish: () => void
  busy: boolean
  error: string | null
  /** A line above the button while the last step works — upload progress. */
  status?: string | null
  onExit: () => void
  /** Asks before leaving from the first step. */
  dirty: boolean
  /** One step of a saved asset: no progress bar and nothing to walk. */
  single?: boolean
}

export function StepFlow({
  kicker,
  steps,
  finishLabel,
  onFinish,
  busy,
  error,
  status = null,
  onExit,
  dirty,
  single = false,
}: StepFlowProps) {
  const { t } = useStrings("assets/new")
  const { t: common } = useStrings("common")
  const reduced = useReducedMotion()
  const [index, setIndex] = useState(0)
  const [direction, setDirection] = useState<"forward" | "back">("forward")
  const [leaving, setLeaving] = useState(false)

  const current = Math.min(index, steps.length - 1)
  const step = steps[current]!
  const last = current === steps.length - 1

  const leave = useCallback(() => {
    if (!dirty) return onExit()
    setLeaving(true)
  }, [dirty, onExit])

  const back = useCallback(() => {
    if (busy) return
    if (current === 0) return leave()
    setDirection("back")
    setIndex(current - 1)
  }, [busy, current, leave])

  useEffect(() => {
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      back()
      return true
    })
    return () => subscription.remove()
  }, [back])

  function next() {
    if (step.blocked !== null || busy) return
    if (last) return onFinish()
    setDirection("forward")
    setIndex(current + 1)
  }

  // Reading runs right to left, so the next step arrives from the left.
  const entering = reduced
    ? undefined
    : (direction === "forward" ? FadeInLeft : FadeInRight).duration(220)

  return (
    <Screen
      keyboard
      inset="flow"
      footer={
        <View className="gap-2.5">
          {error !== null ? (
            <Text variant="meta" className="text-terracotta-800">
              {error}
            </Text>
          ) : status !== null ? (
            <Text variant="metaSm">{status}</Text>
          ) : null}
          <PrimaryCta
            label={last ? finishLabel : t.next!}
            disabledLabel={step.blocked ?? undefined}
            onPress={next}
            disabled={step.blocked !== null}
            busy={busy}
          />
        </View>
      }
    >
      <Stack.Screen options={{ gestureEnabled: false }} />
      <ConfirmSheet
        open={leaving}
        onClose={() => setLeaving(false)}
        title={t.leaveTitle!}
        body={[t.leaveBody!]}
        confirmLabel={t.leaveConfirm!}
        cancelLabel={t.stay!}
        onConfirm={(dismiss) => {
          void dismiss().then(onExit)
        }}
      />
      <ScreenTop
        backLabel={common.back}
        back={current === 0 ? "close" : "chevron"}
        onBack={back}
        className="mb-4"
      />
      {single ? null : (
        <MeterBar
          className="bg-sand-300 mb-7"
          height="step"
          tone="terracotta"
          value={(current + 1) / steps.length}
        />
      )}

      <Animated.View key={step.key} entering={entering} style={{ flexGrow: 1 }}>
        <View className="mb-1.5 flex-row items-center gap-2">
          <Text variant="metaSm">{kicker}</Text>
          {step.optional === true ? (
            <View className="bg-card rounded-full px-2.5 py-0.5">
              <Text variant="metaSm">{t.optional}</Text>
            </View>
          ) : null}
        </View>
        <Text variant="screenTitle">{step.question}</Text>
        {step.hint !== undefined ? (
          <Text variant="proseSm" className="mt-2">
            {step.hint}
          </Text>
        ) : null}
        <View className="mt-6 grow">{step.content}</View>
      </Animated.View>
    </Screen>
  )
}
