import { cn } from "@workspace/ui-native/lib/utils"
import type * as React from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native"

/**
 * Every screen's outer shell, in one place — before this there were 12 distinct
 * root `contentContainerClassName` strings across 4 structural shapes.
 *
 * It lives in the app rather than `@workspace/ui-native` because it has to know
 * about *this app's* tab bar to decide bottom clearance, and that package
 * imports no router, no Convex and no keychain. `Surface`, which knows nothing,
 * went to the shared package instead.
 *
 * `SafeAreaShell` applies device insets at the root, so `inset` encodes only
 * tab-bar clearance:
 *
 *   `page`   — the default: a scrolling page of content
 *   `flow`   — an onboarding or auth step, full-height with its CTA on the floor
 *   `footer` — a pinned footer owns the bottom, so the scroll area stops short
 *
 * A third value, `tab`, is **gone rather than corrected, so it cannot be reached
 * for again**: this app's bar is laid out in normal flow rather than over the
 * content, so its 112px of clearance ended Home and ٤.١ a third of a screen
 * early.
 *
 * `footer` vs `float` is bar vs button. A footer sits after the scroll area in
 * normal flow and displaces the list, which is what a full-width CTA wants. A
 * float paints over the scroll area, so the list runs on underneath and only
 * the last item needs clearance — a FAB in `footer` cuts the list off at an
 * opaque strip several rows early.
 */
export type ScreenProps = {
  children: React.ReactNode
  /** Off for a screen that manages its own scrolling, or must not scroll. */
  scroll?: boolean
  /** For any screen with a text field. iOS-only by design — see below. */
  keyboard?: boolean
  inset?: "page" | "flow" | "footer"
  /**
   * Pinned below the scroll area rather than after the content. Use it for a
   * primary action that must stay reachable while the keyboard is open.
   */
  footer?: React.ReactNode
  /**
   * Painted **over** the scroll area, bottom-end, rather than displacing it —
   * a FAB. Supersedes `inset`'s bottom padding with its own clearance, since
   * the content has to end above the button and not at the screen inset.
   */
  float?: React.ReactNode
  /** Drops the 20px gutter, for content that runs edge to edge. */
  bleed?: boolean
  /** Centres children on both axes — splash, lock, single-question screens. */
  center?: boolean
  className?: string
  contentClassName?: string
}

/**
 * Static maps, never interpolation. Tailwind finds classes by scanning source
 * text, so `` `pb-${inset}` `` is invisible to it: the utility never reaches
 * the bundle and the padding silently vanishes at runtime with no error. This
 * is the single likeliest way to break this refactor, so every value a variant
 * can take appears literally here.
 */
const TOP = {
  page: "pt-4",
  flow: "pt-3.5",
  footer: "pt-4",
} as const

const BOTTOM = {
  page: "pb-10",
  flow: "pb-5",
  footer: "pb-4",
} as const

/**
 * 96 = the 56px button, the 16px it sits off the bottom, and 24 of air, so the
 * last row clears the FAB instead of tucking half under it.
 */
const FLOAT_CLEARANCE = "pb-24"

export function Screen({
  children,
  scroll = true,
  keyboard = false,
  inset = "page",
  footer,
  float,
  bleed = false,
  center = false,
  className,
  contentClassName,
}: ScreenProps) {
  const padding = cn(
    !bleed && "px-gutter",
    TOP[inset],
    float !== undefined ? FLOAT_CLEARANCE : BOTTOM[inset]
  )

  const body = scroll ? (
    <ScrollView
      className="flex-1"
      contentContainerClassName={cn(
        "grow",
        padding,
        center && "items-center justify-center",
        contentClassName
      )}
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="on-drag"
      showsVerticalScrollIndicator={false}
    >
      {children}
    </ScrollView>
  ) : (
    <View
      className={cn(
        "flex-1",
        padding,
        center && "items-center justify-center",
        contentClassName
      )}
    >
      {children}
    </View>
  )

  const framed = (
    <>
      {body}
      {footer !== undefined ? (
        <View className={cn(!bleed && "px-gutter", "pb-4 pt-3")}>{footer}</View>
      ) : null}
      {/* Last, so it paints over the scroll area. `box-none` keeps the
          wrapper from swallowing taps meant for the rows beneath it. */}
      {float !== undefined ? (
        <View className="end-gutter absolute bottom-4" pointerEvents="box-none">
          {float}
        </View>
      ) : null}
    </>
  )

  // Android's windowSoftInputMode already reflows the window; adding padding on
  // top of that lifts the footer twice as far as the keyboard actually rises.
  return keyboard ? (
    <KeyboardAvoidingView
      className={cn("bg-background flex-1", className)}
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      {framed}
    </KeyboardAvoidingView>
  ) : (
    <View className={cn("bg-background flex-1", className)}>{framed}</View>
  )
}
