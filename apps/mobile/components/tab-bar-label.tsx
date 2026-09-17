import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"

/**
 * One tab's name, rendered with the app's own `Text` rather than through
 * `tabBarLabelStyle`.
 *
 * React Navigation styles labels itself and knows nothing about this app's
 * fonts, so the four words along the bottom of every screen were the only text
 * in the product not set in IBM Plex Sans Arabic. Passing `fontFamily` in a
 * plain style object would be a hardcoded second copy of a value that lives in
 * `global.css` and no token can reach; this way the bar reads the same
 * `--font-body-*` variables as everything else.
 *
 * The weight follows selection — semibold when you are on it, the same rule
 * ٤.١'s filter chips use — so the word does not ignore a state the pill behind
 * the glyph already carries.
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
