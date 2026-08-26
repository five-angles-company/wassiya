import { cn } from "@workspace/ui-native/lib/utils"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Input } from "@workspace/ui-native/components/ui/input"
import { Search, X } from "lucide-react-native"
import { Pressable, View } from "react-native"

export type AssetSearchFieldProps = {
  value: string
  onChangeText: (value: string) => void
  placeholder: string
  clearLabel: string
  className?: string
}

/**
 * The 4.1 search field — a pill, per the board's input grammar, with the glyph
 * inside it rather than beside it.
 *
 * Logical padding (`ps-`/`pe-`) rather than left/right, so the icon sits at the
 * reading start in both directions. The `Search` glyph is symmetrical enough
 * not to need `<Icon flip />`; the clear button is a circle, likewise.
 */
export function AssetSearchField({
  value,
  onChangeText,
  placeholder,
  clearLabel,
  className,
}: AssetSearchFieldProps) {
  return (
    <View className={cn("relative justify-center", className)}>
      <View className="pointer-events-none absolute start-4 z-10">
        <Icon as={Search} className="text-muted-foreground size-4.5" />
      </View>

      <Input
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        // `search` gives the keyboard a magnifier key; the filtering itself is
        // live, so submitting is a no-op by design rather than an omission.
        returnKeyType="search"
        autoCorrect={false}
        className="bg-card rounded-row h-12 border-0 ps-12 pe-12 shadow-none"
      />

      {value.length > 0 ? (
        <Pressable
          onPress={() => onChangeText("")}
          accessibilityRole="button"
          accessibilityLabel={clearLabel}
          // Padded well past the glyph: 18px of icon is under the 44pt minimum
          // touch target on its own.
          className="absolute end-2.5 z-10 rounded-full p-2 active:bg-sand-300"
        >
          <Icon as={X} className="text-muted-foreground size-4" />
        </Pressable>
      ) : null}
    </View>
  )
}
