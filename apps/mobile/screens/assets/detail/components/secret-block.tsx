import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { SecretWordPills } from "@workspace/ui-native/components/wassiya/secret-word-pills"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { Eye, EyeOff, Fingerprint } from "lucide-react-native"
import type * as React from "react"
import { View } from "react-native"

import type { SecretState } from "@/screens/assets/detail/use-asset-secret"

export type SecretBlockProps = {
  title: string
  state: SecretState
  /** Words in the phrase, for the masked pills. Ignored unless `asWords`. */
  wordCount: number
  /** True for a mnemonic — pills; false for structured payloads — fields. */
  asWords: boolean
  /**
   * What to draw once revealed, for payloads that are neither a phrase nor
   * plain text. The screen owns parsing, because the shapes are the wizards'
   * contract; this component owns the reveal gate and the countdown.
   */
  revealedBody?: React.ReactNode
  labels: Record<string, string>
  locale: Locale
  onReveal: () => void
  onHide: () => void
}

/**
 * The one tinted block on ٤.٩, and deliberately the same object as ٤.٣'s
 * capture field: *"capture and review must look like the same object"*. A seed
 * phrase you typed into a pill grid should come back as a pill grid, or the two
 * screens are describing two different things.
 *
 * Masked is the resting state and it never auto-reveals. The countdown is
 * rendered rather than merely running, because a peek the user cannot see
 * expiring is one they will look away from and leave on screen.
 */
export function SecretBlock({
  title,
  state,
  wordCount,
  asWords,
  revealedBody,
  labels,
  locale,
  onReveal,
  onHide,
}: SecretBlockProps) {
  const revealed = state.status === "revealed"

  return (
    <View className="rounded-card bg-terracotta-100 gap-3 p-4">
      <View className="flex-row items-center justify-between">
        <Text variant="rowTitle" className="text-terracotta-800">
          {title}
        </Text>
        {/* A count only where one means something. A word count on a bank
            account describes nothing the reader can check. */}
        {revealed ? (
          <Text variant="metaSm" className="text-terracotta-800">
            {fmtNum(state.secondsLeft, locale)}
          </Text>
        ) : asWords ? (
          <Text variant="metaSm" className="text-terracotta-800">
            {fmtNum(wordCount, locale)}
          </Text>
        ) : null}
      </View>

      {revealed ? (
        asWords ? (
          <SecretWordPills
            count={state.text.split(/\s+/u).length}
            words={state.text.split(/\s+/u)}
            revealed
          />
        ) : (
          // `revealedBody` or nothing dressed up as something. Printing
          // `state.text` here is what showed owners raw JSON — braces, quotes
          // and key names — on the one screen they had just authenticated to
          // reach.
          (revealedBody ?? (
            <View className="rounded-box bg-background p-3">
              <Text className="text-prose-sm text-foreground">{state.text}</Text>
            </View>
          ))
        )
      ) : asWords ? (
        <SecretWordPills count={wordCount} revealed={false} />
      ) : (
        // Not a phrase, so not word pills. Twelve grey pills over a bank
        // account's JSON would claim a shape the payload does not have — and
        // read as a seed phrase to anyone glancing at the screen.
        <View className="rounded-box bg-background h-14 justify-center px-3">
          <Text className="text-muted-foreground tracking-[4px]">••••••••</Text>
        </View>
      )}

      <Button
        variant={revealed ? "outline" : "default"}
        size="sm"
        onPress={revealed ? onHide : onReveal}
        disabled={state.status === "working"}
      >
        <Icon
          as={state.status === "working" ? Fingerprint : revealed ? EyeOff : Eye}
          className={revealed ? "text-foreground size-4" : "text-primary-foreground size-4"}
        />
        <Text>
          {state.status === "working"
            ? labels.revealing
            : revealed
              ? labels.hide
              : labels.revealPrompt}
        </Text>
      </Button>

      {/* The terms and the audit stamp sit under the button, where the board
          puts them: what you are about to do, and when it last happened. */}
      <Text variant="metaSm" className="text-terracotta-800">
        {labels.terms}
      </Text>

      {state.status === "denied" || state.status === "failed" ? (
        <Text variant="metaSm" className="text-terracotta-800">
          {state.status === "denied" ? labels.revealDenied : labels.revealFailed}
        </Text>
      ) : null}
    </View>
  )
}
