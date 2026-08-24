import { cn } from "@workspace/ui-native/lib/utils"
import type * as React from "react"
import { View } from "react-native"
import { useSafeAreaInsets } from "react-native-safe-area-context"

export type SafeAreaShellProps = {
  children: React.ReactNode
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
export function SafeAreaShell({ children, className }: SafeAreaShellProps) {
  const insets = useSafeAreaInsets()
  return (
    <View
      className={cn("flex-1 bg-background", className)}
      style={{ paddingTop: insets.top, paddingBottom: insets.bottom }}
    >
      {children}
    </View>
  )
}
