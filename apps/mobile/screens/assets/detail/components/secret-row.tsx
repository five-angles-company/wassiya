import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { SecretWordPills } from "@workspace/ui-native/components/wassiya/secret-word-pills"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { cn } from "@workspace/ui-native/lib/utils"
import { Eye, EyeOff, Fingerprint } from "lucide-react-native"
import { ActivityIndicator, Pressable, View } from "react-native"

import type { SecretField } from "@/screens/assets/detail/secret-fields"
import { SecretFieldList } from "@/screens/assets/detail/components/secret-field-list"
import type { SecretState } from "@/screens/assets/detail/use-asset-secret"

/**
 * The protected content, as a row in the asset's group.
 *
 * ## Why this replaced `SecretBlock`
 *
 * `SecretBlock` was a self-contained tinted card: its own 26px radius, its own
 * `terracotta-100` fill, 16px padding and a 50px full-width button — between
 * 157px and 417px tall depending on state. Dropped into a grouped row list it
 * nested two 26px surfaces in different colours, which is the opposite of what
 * a group is for.
 *
 * The content is a row like the others now, and the reveal expands underneath it
 * *inside* the group. The state machine did not move: `use-asset-secret.ts` still
 * owns the biometric call, the ten-second countdown and clearing the plaintext.
 * Only the presentation changed.
 *
 * ## The button is the only tap target
 *
 * The row takes no `onPress`. `SettingsRow` wraps a pressable row and this one
 * would have to nest a button inside it — a pattern with no precedent anywhere
 * in this app and a reliable source of swallowed taps. Here the row is inert and
 * the pill is the control, so there is exactly one thing to press.
 *
 * ## A phrase still comes back as pills
 *
 * 4.3 captures a seed phrase into a pill grid, so review shows a pill grid.
 * Capture and review must look like the same object or the two screens are
 * describing two different things.
 */
export type SecretRowProps = {
  /** "المحتوى المحمي". */
  label: string
  state: SecretState
  /** True for a mnemonic — pills; false for structured payloads — fields. */
  asWords: boolean
  /** Parsed fields, or `null` for a phrase or an unparseable payload. */
  fields: SecretField[] | null
  labels: Record<string, string>
  locale: Locale
  onReveal: () => void
  onHide: () => void
  divider?: boolean
}

export function SecretRow({
  label,
  state,
  asWords,
  fields,
  labels,
  locale,
  onReveal,
  onHide,
  divider,
}: SecretRowProps) {
  const revealed = state.status === "revealed"
  const working = state.status === "working"

  return (
    <View>
      {/* Matches `SettingsRow`'s own metrics — `py-3.5`, `gap-3`, no side
          padding — so this sits in the same rhythm as the rows around it. */}
      <View className="flex-row items-center gap-3 py-3.5">
        <Text variant="rowTitle" numberOfLines={1} className="min-w-0 flex-1">
          {label}
        </Text>

        <Pressable
          accessibilityRole="button"
          onPress={revealed ? onHide : onReveal}
          disabled={working}
          className={cn(
            "h-9 shrink-0 flex-row items-center gap-2 rounded-full px-3.5",
            revealed
              ? "bg-sand-300 active:bg-sand-400"
              : "bg-primary active:bg-terracotta-600"
          )}
        >
          {working ? (
            <ActivityIndicator size="small" color="#fff2eb" />
          ) : (
            <Icon
              as={revealed ? EyeOff : Fingerprint}
              size={15}
              strokeWidth={2.75}
              className={revealed ? "text-sand-900" : "text-primary-foreground"}
            />
          )}
          <Text
            variant="metaSm"
            numberOfLines={1}
            className={cn(
              "shrink-0 font-body-bold",
              revealed ? "text-sand-900" : "text-primary-foreground"
            )}
          >
            {working
              ? labels.revealing
              : revealed
                ? labels.hide
                : labels.revealPrompt}
          </Text>
        </Pressable>
      </View>

      {/* The expansion. Everything below stays inside the group's own surface,
          so revealing does not summon a second card on top of the first. */}
      {revealed ? (
        <View className="gap-2.5 pb-4">
          {asWords ? (
            <SecretWordPills
              count={state.text.split(/\s+/u).length}
              words={state.text.split(/\s+/u)}
              revealed
            />
          ) : fields !== null ? (
            <SecretFieldList fields={fields} />
          ) : (
            // An unparseable payload — a rotated format, a hand-edited row.
            // Shown plainly rather than refused: withholding a secret the owner
            // has just authenticated for is worse than showing it raw.
            <View className="rounded-box bg-background p-3">
              <Text className="text-prose-sm text-foreground">{state.text}</Text>
            </View>
          )}

          {/* Rendered rather than merely running: a countdown the owner cannot
              see expiring is one they look away from and leave on screen. */}
          <View className="flex-row items-center gap-1.5">
            <Icon as={Eye} size={13} strokeWidth={2.5} className="text-muted-foreground" />
            <Text variant="footnote">
              {labels.countdown.replace(
                "{n}",
                new Intl.NumberFormat(locale === "ar" ? "ar-EG" : "en-US").format(
                  state.secondsLeft
                )
              )}
            </Text>
          </View>
        </View>
      ) : state.status === "denied" || state.status === "failed" ? (
        <Text variant="footnote" className="text-terracotta-800 pb-3.5">
          {state.status === "denied" ? labels.revealDenied : labels.revealFailed}
        </Text>
      ) : null}

      {divider ? <View className="bg-border h-px" /> : null}
    </View>
  )
}
