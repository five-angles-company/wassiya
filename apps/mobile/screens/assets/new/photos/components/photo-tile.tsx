import { Icon } from "@workspace/ui-native/components/ui/icon"
import { ProgressRing } from "@workspace/ui-native/components/wassiya/progress-ring"
import { RotateCw, X } from "lucide-react-native"
import { Image, Pressable, View } from "react-native"

/**
 * One photo in ٤.٦'s grid, carrying its own upload state.
 *
 * ## A done tile is simply clean
 *
 * No tick, deliberately: a finished photo
 * needs no decoration, and twenty ticks is twenty pieces of confirmation nobody
 * asked for. **Only in-flight and failed are marked**, so whatever is marked is
 * the thing that still needs attention.
 *
 * ## Progress rides the tile, never an album-level bar
 *
 * With twenty photos on a weak connection one bar hides *which* file is stuck.
 * The ring answers the only question worth asking here, and the failed tile
 * answers it louder — a terracotta scrim and a retry glyph, in the one place
 * the eye is already looking.
 */
export type PhotoTileProps = {
  uri: string
  /** 0–1. Anything below 1 while `busy` draws the ring. */
  progress: number
  failed: boolean
  /** An upload is running, so the tile shows state rather than its remove control. */
  busy: boolean
  onRemove: () => void
  onRetry: () => void
  removeLabel: string
  retryLabel: string
}

export function PhotoTile({
  uri,
  progress,
  failed,
  busy,
  onRemove,
  onRetry,
  removeLabel,
  retryLabel,
}: PhotoTileProps) {
  const uploading = busy && !failed && progress < 1

  return (
    <View className="size-[72px]">
      <Image
        source={{ uri }}
        className="size-full rounded-[16px]"
        // Local previews of what was just picked — the originals, not the
        // encrypted copies. ٤.٩ decrypts the stored thumbnails instead.
        accessibilityIgnoresInvertColors
      />

      {uploading ? (
        <View className="absolute inset-0 items-center justify-center rounded-[16px] bg-sand-900/40">
          <ProgressRing value={progress} size={32} />
        </View>
      ) : null}

      {failed ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={retryLabel}
          onPress={onRetry}
          className="bg-terracotta-900/55 absolute inset-0 items-center justify-center rounded-[16px] active:opacity-80"
        >
          <Icon as={RotateCw} size={20} strokeWidth={2.75} className="text-background" />
        </Pressable>
      ) : null}

      {/* Hidden while an upload is running: removing a file mid-flight would
          leave the uploader indexing into a list that no longer matches. */}
      {busy ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={removeLabel}
          onPress={onRemove}
          hitSlop={6}
          className="bg-background absolute -end-1.5 -top-1.5 size-[22px] items-center justify-center rounded-full"
        >
          <Icon as={X} size={13} strokeWidth={3} className="text-foreground" />
        </Pressable>
      )}
    </View>
  )
}
