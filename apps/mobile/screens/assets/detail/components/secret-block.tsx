import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { SecretWordPills } from "@workspace/ui-native/components/wassiya/secret-word-pills"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { Eye, EyeOff, Fingerprint } from "lucide-react-native"
import { View } from "react-native"

import type { SecretState } from "@/screens/assets/detail/use-asset-secret"

export type SecretBlockProps = {
  title: string
  state: SecretState
  /** Word count from the plaintext when revealed, from `meta` when not. */
  wordCount: number
  /** True for a mnemonic — pills; false for JSON-shaped payloads — text. */
  asWords: boolean
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
        <Text variant="metaSm" className="text-terracotta-800">
          {revealed
            ? `${fmtNum(state.secondsLeft, locale)}`
            : `${fmtNum(wordCount, locale)}`}
        </Text>
      </View>

      {revealed ? (
        asWords ? (
          <SecretWordPills
            count={state.text.split(/\s+/u).length}
            words={state.text.split(/\s+/u)}
            revealed
          />
        ) : (
          <View className="rounded-box bg-background p-3">
            <Text className="text-[14px] leading-[1.8]">{state.text}</Text>
          </View>
        )
      ) : (
        <SecretWordPills count={wordCount} revealed={false} />
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
