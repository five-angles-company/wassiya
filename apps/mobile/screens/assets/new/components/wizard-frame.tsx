import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import type * as React from "react"

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
 * ## Two steps, and the second one exists now
 *
 * The board meters every wizard "١ من ٢" because the second step is heir
 * assignment. That screen did not exist when this frame was written, so the
 * button said "احفظ في الخزنة" and meant it — the run ended, the asset landed
 * unrouted, and a caveat under the button explained the badge it would carry.
 *
 * `/assets/[id]/recipients` exists, so the wizard hands off to it and the
 * button promises what it now actually does. The caveat is gone with it: an
 * asset is no longer created unrouted and then abandoned, so explaining that it
 * would be is worse than silence.
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
        <Button onPress={onSubmit} disabled={!canSubmit || submitting}>
          <Text>{submitting ? t.saving : t.save}</Text>
        </Button>
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
