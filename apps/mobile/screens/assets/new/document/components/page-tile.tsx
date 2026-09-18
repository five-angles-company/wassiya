import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { monoFont } from "@workspace/ui-native/lib/fonts"
import { cn } from "@workspace/ui-native/lib/utils"
import { ChevronLeft, ChevronRight, X } from "lucide-react-native"
import { Image, Pressable, View } from "react-native"

/**
 * One page of a scanned document. ٤.٥ assembles pages into a single PDF, so
 * until Save they exist only as images — which is what makes the grid possible.
 * A deed is rarely one sheet, and a screen showing "1 file, 2.1 MB" cannot tell
 * you the scanner caught page three twice and missed page two.
 *
 * The mono index is the point: pages assemble in the order shown and a scanner
 * hands them over in whatever order they were fed, so the number is how someone
 * checks that before the order is baked into a PDF nobody can reopen.
 *
 * Reordering is arrows rather than drag, because a drag gesture
 * cannot be exercised over adb and a reorder that silently drops a page is worse
 * than one that takes two taps. The arrows point forward and back in reading
 * order, so they mirror under RTL with everything else.
 */
export type PageTileProps = {
  uri: string
  /** 1-based, in the locale's numerals. */
  label: string
  /** Hidden on the first page. */
  onMoveBack?: () => void
  /** Hidden on the last page. */
  onMoveForward?: () => void
  onRemove: () => void
  moveBackLabel: string
  moveForwardLabel: string
  removeLabel: string
  className?: string
}

export function PageTile({
  uri,
  label,
  onMoveBack,
  onMoveForward,
  onRemove,
  moveBackLabel,
  moveForwardLabel,
  removeLabel,
  className,
}: PageTileProps) {
  return (
    <View className={cn("w-[72px]", className)}>
      <View className="bg-card h-[92px] w-full overflow-hidden rounded-[14px]">
        <Image
          source={{ uri }}
          className="size-full"
          resizeMode="cover"
          accessibilityIgnoresInvertColors
        />
        <View className="absolute bottom-1 end-1.5">
          <Text className={cn(monoFont, "text-background text-[9px]")}>
            {label}
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={removeLabel}
          onPress={onRemove}
          hitSlop={6}
          className="bg-background absolute end-1 top-1 size-[20px] items-center justify-center rounded-full"
        >
          <Icon as={X} size={12} strokeWidth={3} className="text-foreground" />
        </Pressable>
      </View>

      {/* Only rendered where a move is possible, so the row never offers a
          control that does nothing. */}
      <View className="mt-1 h-5 flex-row items-center justify-center gap-1">
        {onMoveBack !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={moveBackLabel}
            onPress={onMoveBack}
            hitSlop={6}
          >
            <Icon
              as={ChevronRight}
              flip
              size={14}
              strokeWidth={2.75}
              className="text-foreground opacity-45"
            />
          </Pressable>
        ) : null}
        {onMoveForward !== undefined ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={moveForwardLabel}
            onPress={onMoveForward}
            hitSlop={6}
          >
            <Icon
              as={ChevronLeft}
              flip
              size={14}
              strokeWidth={2.75}
              className="text-foreground opacity-45"
            />
          </Pressable>
        ) : null}
      </View>
    </View>
  )
}
