import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import type { Href } from "expo-router"
import type * as React from "react"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { useStrings } from "@/i18n/use-strings"

/**
 * The top of every screen that is not a step flow: the back control, then the
 * title with an optional line above and below it.
 *
 * One title size everywhere (`screenTitle`), tab roots included. A screen that
 * sizes or spaces its own title is the inconsistency this exists to end.
 *
 * **No `back` is a statement of intent.** `headerShown: false` is global, so a
 * screen without one is genuinely one-directional — the setup flow, where you
 * cannot un-verify an identity or un-generate a key.
 */
export type ScreenHeaderProps = {
  title: string
  /**
   * Shows the back control. An href is where it goes when there is no history
   * to pop — the splash resumes users *into* deep routes.
   */
  back?: true | Href
  /** Replaces the default pop, for a screen that must intercept leaving. */
  onBack?: () => void
  /** A small line above the title — the account's email on a tab root. */
  eyebrow?: string
  /**
   * Under the title. A string renders as muted prose; pass a node when the
   * line needs its own tone.
   */
  description?: React.ReactNode
  /** Beside the title, at the far end — a round icon button. */
  trailing?: React.ReactNode
  className?: string
}

export function ScreenHeader({
  title,
  back,
  onBack,
  eyebrow,
  description,
  trailing,
  className,
}: ScreenHeaderProps) {
  const { t } = useStrings("common")

  return (
    <View className={cn("mb-6", className)}>
      {back !== undefined ? (
        <BackButton
          label={t.back}
          fallbackHref={back === true ? undefined : back}
          onPress={onBack}
          className="mb-4"
        />
      ) : null}

      <View className="flex-row items-center gap-3">
        <View className="min-w-0 flex-1">
          {eyebrow !== undefined ? (
            <Text variant="metaSm" className="mb-1" numberOfLines={1}>
              {eyebrow}
            </Text>
          ) : null}
          <Text variant="screenTitle">{title}</Text>
        </View>
        {trailing}
      </View>

      {description !== undefined ? (
        typeof description === "string" ? (
          <Text variant="proseSm" className="mt-2">
            {description}
          </Text>
        ) : (
          <View className="mt-2">{description}</View>
        )
      ) : null}
    </View>
  )
}
