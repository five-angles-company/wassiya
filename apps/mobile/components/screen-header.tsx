import { Text } from "@workspace/ui-native/components/ui/text"
import { MeterBar } from "@workspace/ui-native/components/wassiya/meter-bar"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { cn } from "@workspace/ui-native/lib/utils"
import type { Href } from "expo-router"
import type * as React from "react"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { useStrings } from "@/i18n/use-strings"

/**
 * The top of every screen: back affordance, title, optional supporting line.
 *
 * `variant="screenTitle"` is a 26px token that was being inline-overridden to
 * render at **eight** different sizes (26/27/28/29/30/31) across 16 distinct
 * className strings on 43 call sites. Half of those sizes — 27, 29, 30 — exist
 * nowhere in the type scale at all. Nobody decided that; it accumulated.
 *
 * ## Two levels, because there are two kinds of screen
 *
 * A tab root is the top of a section and gets `--text-screen` (26px). A pushed
 * route is a detail *within* one and gets `--text-page` (19px) — a size that
 * already existed in the scale and was used three times in the whole app while
 * pushed routes rendered 26–31px instead. Levelled titles are most of what
 * makes a stack feel navigable rather than flat.
 *
 * ## On the ten screens with no way back
 *
 * Ten pushed routes render no back affordance, and `headerShown: false` is
 * global, so there is no navigation-bar fallback — they are genuinely
 * one-directional. Nearly all are the setup flow, where that's deliberate: you
 * cannot un-verify an identity or un-generate a key, so offering "back" would
 * promise something the security model can't honour.
 *
 * `back="none"` states that intent, so a screen without a back button is a
 * decision on the page rather than an omission you have to notice.
 */
export type ScreenHeaderProps = {
  title: string
  /** Tab root (26px) or pushed route (19px). */
  level?: "root" | "page"
  /**
   * `"none"` for a step that genuinely cannot be reversed. Otherwise the
   * fallback href for when there's no history to pop — the splash resumes
   * users *into* deep routes, so a plain `router.back()` would dead-end.
   */
  back?: "none" | Href
  /** Trailing slot — a count, an edit action, a status pill. */
  trailing?: React.ReactNode
  /** One line of prose under the title. */
  description?: string
  /** Renders the progress meter for a multi-step flow. */
  step?: { index: number; total: number }
  className?: string
}

export function ScreenHeader({
  title,
  level = "page",
  back = "none",
  trailing,
  description,
  step,
  className,
}: ScreenHeaderProps) {
  const { t, locale } = useStrings("common")

  return (
    <View className={cn("mb-header", className)}>
      {back !== "none" ? (
        <BackButton label={t.back} fallbackHref={back} className="mb-4" />
      ) : null}

      <View className="flex-row items-center gap-3">
        <Text
          variant={level === "root" ? "screenTitle" : "pageTitle"}
          className="min-w-0 flex-1"
        >
          {title}
        </Text>
        {trailing}
      </View>

      {description !== undefined ? (
        <Text variant="prose" className="mt-2">
          {description}
        </Text>
      ) : null}

      {step !== undefined ? (
        <View className="mt-4 flex-row items-center gap-3">
          <MeterBar className="flex-1" value={step.index / step.total} />
          <Text variant="metaSm">
            {`${fmtNum(step.index, locale)} ${t.stepSeparator} ${fmtNum(step.total, locale)}`}
          </Text>
        </View>
      ) : null}
    </View>
  )
}
