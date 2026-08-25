import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { View } from "react-native"

/**
 * The answer to the only question this app exists to answer, in a sentence.
 *
 * ## Why this isn't a card
 *
 * Almost everything in the app is a filled rounded box, which is precisely why
 * none of them read as important. The design system asks for flush-start
 * asymmetric layouts with real air, and the most important statement on the
 * home screen is the right place to actually spend that: bare type on the
 * ground, hard against the start edge, with nothing boxing it in. A card here
 * would rank it equal to the storage meter.
 *
 * ## Why the question is printed above the answer
 *
 * "نعم" on its own is meaningless, and the question — *if something happened to
 * you today, would your vault reach your heirs?* — is the thing most owners
 * have never actually asked themselves. Printing it costs one quiet line and
 * turns a status into a reassurance, or a warning.
 */
export type ReadinessVerdictProps = {
  kind: "ready" | "blocked" | "atRisk"
  /** The quiet framing line. */
  question: string
  /** The answer, in one sentence. */
  answer: string
  /** At most one. Never two — see below. */
  action?: { label: string; onPress: () => void }
  className?: string
}

/**
 * Colour carries the same meaning as everywhere else in the product: olive is
 * done, terracotta is "you must act". `atRisk` is deliberately terracotta-700
 * rather than the full accent — the vault still reaches its heirs, so it must
 * not shout as loudly as a delivery failure.
 */
const ANSWER_TONE = {
  ready: "text-olive-800",
  blocked: "text-terracotta-700",
  atRisk: "text-terracotta-700",
} as const

export function ReadinessVerdict({
  kind,
  question,
  answer,
  action,
  className,
}: ReadinessVerdictProps) {
  return (
    <View className={cn("gap-2", className)}>
      <Text variant="metaSm">{question}</Text>

      {/* `h1` (24px) rather than `screenTitle` (26px): this sits under the
          check-in hero, and matching the hero's weight would make the screen
          argue with itself about what to read first. */}
      <Text variant="h1" className={cn("leading-[1.35]", ANSWER_TONE[kind])}>
        {answer}
      </Text>

      {/* Exactly one action, or none. A screen offering six urgent things
          ranks nothing, which is the failure the old protection-score list
          worked hard to avoid and the score ring reintroduced by showing a
          number instead of a next step. */}
      {action !== undefined ? (
        <Button
          variant="outline"
          size="sm"
          className="mt-2 self-start px-5"
          onPress={action.onPress}
        >
          <Text>{action.label}</Text>
        </Button>
      ) : null}
    </View>
  )
}
