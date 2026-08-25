import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import type * as React from "react"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
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
  const { t } = useStrings("assets/new")

  return (
    <Screen
      keyboard
      inset="footer"
      /* Pinned, where it used to sit after a `grow` spacer at the end of the
         scroll. On a long form — the document and photos wizards both are —
         the action was below the fold and reached only by scrolling past
         fields the user had already filled. */
      footer={
        <View className="gap-2">
          <Button onPress={onSubmit} disabled={!canSubmit || submitting}>
            <Text>{submitting ? t.saving : t.save}</Text>
          </Button>
          <Text variant="metaSm" className="text-center">
            {t.unroutedNote}
          </Text>
        </View>
      }
    >
      <ScreenHeader
        title={title}
        back="/assets"
        step={{ index: step, total: stepCount }}
      />
      {children}
    </Screen>
  )
}
