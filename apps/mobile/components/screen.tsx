import { cn } from "@workspace/ui-native/lib/utils"
import type * as React from "react"
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from "react-native"

/**
 * Every screen's outer shell, in one place.
 *
 * Before this there were **12 distinct** root `contentContainerClassName`
 * strings across 4 structural shapes — five different top paddings, four
 * bottom, and two class orders. None of it was intentional; it's what happens
 * when 42 screens each retype the same four lines.
 *
 * ## Why this lives in the app and not in `@workspace/ui-native`
 *
 * That package is deliberately pure UI — it imports no router, no Convex, no
 * keychain, and `expo-router` appears nowhere in it. This shell has to know
 * about *this app's* tab bar to decide bottom clearance, so it belongs here.
 * `Surface`, which knows nothing, went to the shared package instead.
 *
 * ## What `inset` actually encodes
 *
 * `SafeAreaShell` already applies the device insets once at the root, so this
 * component never touches them. What varied per screen was clearance for the
 * **tab bar**, which paints over the bottom of any screen inside `(tabs)` —
 * that's the whole story behind `pb-28` vs `pb-10`, written out as a guess on
 * every screen. Naming it removes the guess:
 *
 *   `page`   — the default: a scrolling page of content
 *   `flow`   — an onboarding or auth step; see below
 *   `footer` — a pinned footer owns the bottom, so the scroll area stops short
 *
 * `flow` is not drift dressed up as a variant. Every setup/* and auth/* screen
 * is full-height with a single action pushed to the floor by a `grow` spacer,
 * and a step whose CTA *is* the bottom wants less room under it than a list
 * that scrolls past the fold. Eleven of them had converged on pt-3.5/pb-5
 * independently; naming it is what stops the twelfth from inventing pt-5.5.
 *
 * There was a third, `tab`, worth 112px "to clear the tab bar". It was wrong:
 * this app's bar is laid out in **normal flow**, not over the content, so the
 * scroll area already stops above it. Every screen that used it was paying for
 * clearance it had — Home and ٤.١ both visibly ended a third of a screen early.
 * It is gone rather than corrected, so it cannot be reached for again.
 *
 * ## `footer` vs `float`
 *
 * A **footer** is a bar. It sits after the scroll area in normal flow, so it
 * displaces the list and content ends above it — which is what a full-width
 * CTA wants.
 *
 * A **float** is a button. It paints *over* the scroll area, so the list runs
 * on underneath it and only the last item needs clearance. Putting a FAB in
 * `footer` instead cuts the list off at an opaque strip several rows early,
 * which reads as a rendering bug rather than a pinned action.
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
