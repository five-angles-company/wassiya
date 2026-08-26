import { useState } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { Plus, X } from "lucide-react-native"
import { Image, Pressable, View } from "react-native"

import type { ThumbUris } from "@/screens/assets/detail/use-photo-thumbs"
import { photoCount, type PhotosForm } from "@/screens/assets/detail/forms/photos"

/**
 * ٤.٦'s fields: a name, and the album.
 *
 * ## The grid needs pictures, or it is not a grid
 *
 * Removing "photo 3" from a list of counts is not a decision anyone can make,
 * so the stored thumbnails are decrypted for display — in memory, never to
 * disk. See `use-photo-thumbs.ts` for why that distinction matters.
 *
 * A tile whose thumbnail is missing or still arriving shows as a plain surface
 * rather than disappearing: the album's shape stays honest while it loads, and
 * a failed resize (which ٤.٦ tolerates by design) costs one picture rather than
 * the whole grid.
 *
 * ## Removal is per tile, and staged
 *
 * Each tile carries its own X. Nothing is deleted from storage until Save, so
 * an accidental tap costs a second tap on Cancel rather than a photograph.
 */
export type PhotosFieldsProps = {
  value: PhotosForm
  onChange: (patch: Partial<PhotosForm>) => void
  /** Index-keyed data URIs for the *kept* photos, in order. */
  thumbs: ThumbUris
  /** The `assets/detail` dictionary. */
  labels: Record<string, string>
  /** The `assets/new/photos` dictionary. */
  photos: Record<string, string>
  onAdd: () => void
  onRemove: (index: number) => void
  /** ٤.٦'s ceiling. */
  max: number
}

export function PhotosFields({
  value,
  onChange,
  thumbs,
  labels,
  photos,
  onAdd,
  onRemove,
  max,
}: PhotosFieldsProps) {
  const [focused, setFocused] = useState(false)
  const total = photoCount(value)

  return (
    <>
      <FieldRow label={photos.albumLabel!} divider active={focused}>
        <FieldValue
          value={value.album}
          onChangeText={(album) => onChange({ album })}
          placeholder={photos.albumPlaceholder}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </FieldRow>

      <View className={focused ? "opacity-45" : undefined}>
        <View className="py-3.5">
          <Text className="mb-[7px] text-[12px] opacity-50">
            {photos.selected!.replace("{n}", String(total))}
          </Text>

          <View className="flex-row flex-wrap gap-2">
            {value.keptOriginals.map((id, i) => (
              <Tile
                key={id}
                uri={thumbs[i] ?? null}
                onRemove={() => onRemove(i)}
                removeLabel={labels.removePhoto!}
              />
            ))}
            {value.added.map((photo, i) => (
              <Tile
                key={`${photo.uri}-${i}`}
                uri={photo.uri}
                onRemove={() => onRemove(value.keptOriginals.length + i)}
                removeLabel={labels.removePhoto!}
              />
            ))}

            {total < max ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={photos.chooseMore ?? photos.choose}
                onPress={onAdd}
                className="border-sand-500 size-[72px] items-center justify-center rounded-[14px] border-[1.5px] border-dashed active:opacity-70"
              >
                <Icon as={Plus} size={20} strokeWidth={2.75} className="text-foreground opacity-50" />
              </Pressable>
            ) : null}
          </View>
        </View>
      </View>
    </>
  )
}

/** One photo in the grid. Its own remove control, because removal is per photo. */
function Tile({
  uri,
  onRemove,
  removeLabel,
}: {
  uri: string | null
  onRemove: () => void
  removeLabel: string
}) {
  return (
    <View className="size-[72px]">
      {uri === null ? (
        <View className="bg-card size-full rounded-[14px]" />
      ) : (
        <Image source={{ uri }} className="size-full rounded-[14px]" />
      )}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={removeLabel}
        onPress={onRemove}
        hitSlop={6}
        className="bg-background absolute -end-1.5 -top-1.5 size-[22px] items-center justify-center rounded-full"
      >
        <Icon as={X} size={13} strokeWidth={3} className="text-foreground" />
      </Pressable>
    </View>
  )
}
