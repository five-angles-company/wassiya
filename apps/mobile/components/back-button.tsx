import { Icon } from "@workspace/ui-native/components/ui/icon"
import { cn } from "@workspace/ui-native/lib/utils"
import { router, type Href } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import { Pressable } from "react-native"

/**
 * `--color-foreground` (#201e1d). React Native icons take a color *prop*, not
 * a class, so this one token has to exist as a literal. Keep in step with
 * apps/mobile/global.css.
 */
const FOREGROUND = "#201e1d"

export type BackButtonProps = {
  label: string
  /** Where to go when there is nothing to pop — a deep link, or a resumed run. */
  fallbackHref?: Href
  onPress?: () => void
  className?: string
}

/**
 * The 40px round back affordance at the top-start of every
 * sub-page.
 *
 * `flip` is what makes the chevron mean "back" rather than "left": the glyph
 * is mirrored under RTL, so it points the way the reading direction came from
 * in both languages.
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
        "active:bg-sand-300 size-10 items-center justify-center rounded-full bg-card",
        className
      )}
    >
      {/* `size` and `color` are passed as props, not classes. `Icon` maps
          `size-*` to `width` only, so height falls back to Lucide's default and
          a flipped glyph (which also replaces `style` with an array) can end up
          mis-measured and invisible. This chevron is drawn at 19×20. */}
      <Icon as={ChevronLeft} flip size={20} color={FOREGROUND} />
    </Pressable>
  )
}
