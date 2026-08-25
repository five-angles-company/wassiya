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
 *   `tab`    — inside `(tabs)`; clear the bar
 *   `page`   — a pushed route; the bar isn't there
 *   `footer` — a pinned footer owns the bottom, so the scroll area stops short
 */
export type ScreenProps = {
  children: React.ReactNode
  /** Off for a screen that manages its own scrolling, or must not scroll. */
  scroll?: boolean
  /** For any screen with a text field. iOS-only by design — see below. */
  keyboard?: boolean
  inset?: "tab" | "page" | "footer"
  /**
   * Pinned below the scroll area rather than after the content. Use it for a
   * primary action that must stay reachable while the keyboard is open.
   */
  footer?: React.ReactNode
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
const BOTTOM = {
  tab: "pb-28",
  page: "pb-10",
  footer: "pb-4",
} as const

export function Screen({
  children,
  scroll = true,
  keyboard = false,
  inset = "page",
  footer,
  bleed = false,
  center = false,
  className,
  contentClassName,
}: ScreenProps) {
  const padding = cn(!bleed && "px-gutter", "pt-4", BOTTOM[inset])

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
