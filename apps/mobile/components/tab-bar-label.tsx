import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"

/**
 * One tab's name.
 *
 * ## Why this is a component and not `tabBarLabelStyle`
 *
 * The bar was rendering its labels in the **system face**. React Navigation
 * styles them itself and knows nothing about this app's fonts, so the four
 * words along the bottom of every screen were the only text in the product not
 * set in IBM Plex Sans Arabic.
 *
 * The obvious fix — `tabBarLabelStyle: { fontFamily: "IBMPlexSansArabic_..." }`
 * — is a hardcoded second copy of a value that lives in `global.css`, in a
 * plain style object no token can reach. Rendering the label with the app's own
 * `Text` instead means the bar reads the same `--font-body-*` variables as
 * everything else, and a font change lands here without anyone remembering to
 * come back.
 *
 * ## The weight follows selection
 *
 * Semibold when you are on it, the same rule ٤.١'s filter chips use. The pill
 * behind the glyph already carries the state; this is what keeps the *word*
 * from being the one part of the bar that ignores it.
 */
export type TabBarLabelProps = {
  label: string
  focused: boolean
}

export function TabBarLabel({ label, focused }: TabBarLabelProps) {
  return (
    <Text
      numberOfLines={1}
      className={cn(
        "text-[12px]",
        focused
          ? "text-primary font-body-semibold"
          : "text-muted-foreground font-body"
      )}
    >
      {label}
    </Text>
  )
}
