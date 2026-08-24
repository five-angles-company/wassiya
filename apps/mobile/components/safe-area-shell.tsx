import { cn } from "@workspace/ui-native/lib/utils"
import type * as React from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export type SafeAreaShellProps = {
  children: React.ReactNode
  /**
   * Reserve the gesture-bar inset at the bottom. Defaults to true.
   *
   * Set false wherever a **tab bar** owns that space. React Navigation's bottom
   * tab bar applies the bottom inset itself and paints its own background
   * through it, and this shell is a plain `View` — padding on it does not shrink
   * what `useSafeAreaInsets` reports to anything below. So leaving this on
   * inside the tabs pads the space twice and, worse, leaves the shell's own
   * sand ground showing as a stripe *under* the bar.
   */
  insetBottom?: boolean
  className?: string
}

/**
 * Keeps the app clear of the status bar and the gesture bar.
 *
 * Every screen runs with `headerShown: false` — the board's pattern is a 40px
 * round back button inside the content, not a title bar — so nothing else is
 * reserving that space and content would draw underneath the clock and the
 * navigation pill.
 *
 * **Insets are applied to a plain `View`, not to `SafeAreaView`.** Uniwind only
 * styles components it has been taught about; a third-party component silently
 * ignores `className`, so `<SafeAreaView className="bg-background flex-1">`
 * drops *both* the background and the `flex-1` — the wrapper then collapses to
 * zero height and the whole app renders as an empty dark rectangle with no
 * error anywhere. Using the hook keeps layout in `style` (always honoured) and
 * colour in `className` (honoured on core components).
 *
 * Mounted once at the root so screens keep the board's own paddings and never
 * repeat this.
 */
export function SafeAreaShell({
  children,
  insetBottom = true,
  className,
}: SafeAreaShellProps) {
  const insets = useSafeAreaInsets()
  return (
    <View
      className={cn("flex-1 bg-background", className)}
      style={{
        paddingTop: insets.top,
        paddingBottom: insetBottom ? insets.bottom : 0,
      }}
    >
      {children}
    </View>
  )
}
