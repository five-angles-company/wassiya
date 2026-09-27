import { Icon } from "@workspace/ui-native/components/ui/icon"
import { cn } from "@workspace/ui-native/lib/utils"
import { router, type Href } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import { Pressable } from "react-native"

export type BackButtonProps = {
  label: string
  /** Where to go when there is nothing to pop — a deep link, or a resumed run. */
  fallbackHref?: Href
  onPress?: () => void
  className?: string
}

/**
 * The 40px round back control, drawn exactly as `ScreenTop`'s — the two must
 * stay identical, or the arrow changes shape between screens.
 *
 * `ChevronLeft` with `flip`: mirrored under RTL, so it points right in Arabic
 * and left in English — the way the reading direction came from.
 *
 * The fallback matters more here than in a normal app. Setup screens are
 * routed *to* by the splash resume logic, so a user who relaunches into
 * `/setup/recovery-kit` has no history to pop and would otherwise be stuck
 * with a dead button.
 */
export function BackButton({
  label,
  fallbackHref,
  onPress,
  className,
}: BackButtonProps) {
  function goBack() {
    if (onPress !== undefined) return onPress()
    if (router.canGoBack()) return router.back()
    if (fallbackHref !== undefined) router.replace(fallbackHref)
  }

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={goBack}
      className={cn(
        "bg-card size-10 shrink-0 items-center justify-center rounded-full active:opacity-70",
        className
      )}
    >
      <Icon as={ChevronLeft} flip size={19} strokeWidth={2.75} className="text-foreground" />
    </Pressable>
  )
}
