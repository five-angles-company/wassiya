/**
 * ٤.٦ — an album: its name and its photos and videos, on one step.
 *
 * The grid is shared by creating and editing. A new item shows its thumbnail
 * from the cache; a stored one its decrypted thumbnail, and the originals are
 * never downloaded to edit an album.
 */
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtDuration, fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { cn } from "@workspace/ui-native/lib/utils"
import { Play, Plus, X } from "lucide-react-native"
import { Image, Pressable, View } from "react-native"

import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import type { MediaKind } from "@/screens/assets/detail/forms/photos"
import type { AssetSection, FlowStep } from "@/screens/assets/flow/types"

/** Without resumable upload, a long album is a long window to be killed in. */
export const MAX_MEDIA = 20

export type GridMedia = {
  key: string
  kind: MediaKind
  durationMs?: number
  /** `null` while a stored thumbnail is still decrypting, or when there is none. */
  uri: string | null
  /** A stored item opens its original; one not saved yet has nothing to open. */
  onOpen?: () => void
  opening?: boolean
}

export function usePhotosSteps({
  album,
  onAlbumChange,
  items,
  onAdd,
  adding,
  onRemove,
}: {
  album: string
  onAlbumChange: (album: string) => void
  items: GridMedia[]
  onAdd: () => void
  /** Thumbnails for the last pick are still being made. */
  adding: boolean
  onRemove: (index: number) => void
}): FlowStep[] {
  const { t, locale } = useStrings("assets/new/photos")
  const { t: chrome } = useStrings("assets/new")
  const num = (n: number) => fmtNum(n, locale)

  return [
    {
      key: "album",
      question: t.qAlbumPhotos!,
      hint: t.hPhotos!.replace("{n}", num(MAX_MEDIA)),
      blocked:
        album.trim().length === 0
          ? t.needsAlbum!
          : items.length === 0
            ? t.needsPhotos!
            : null,
      content: (
        <View className="gap-3">
          <Field
            label={t.albumLabel!}
            placeholder={t.albumPlaceholder}
            value={album}
            onChangeText={onAlbumChange}
            containerClassName="mb-2"
          />
          <Text variant="meta" className="text-muted-foreground">
            {`${t.sectionPhotos} · ${num(items.length)} ${chrome.stepSeparator} ${num(MAX_MEDIA)}`}
          </Text>
          <View className="flex-row flex-wrap gap-2.5">
            {items.map((item, i) => (
              <View key={item.key} className="size-22">
                <Pressable
                  accessibilityRole={item.onOpen !== undefined ? "button" : undefined}
                  accessibilityLabel={item.onOpen !== undefined ? t.openItem : undefined}
                  onPress={item.onOpen}
                  disabled={item.onOpen === undefined || item.opening === true}
                  className={cn("size-full", item.opening === true && "opacity-50")}
                >
                  {item.uri === null ? (
                    <View className="bg-card rounded-box size-full" />
                  ) : (
                    <Image source={{ uri: item.uri }} className="rounded-box size-full" />
                  )}
                </Pressable>
                {item.kind === "video" ? (
                  <View className="bg-background absolute start-1.5 bottom-1.5 flex-row items-center gap-1 rounded-full px-1.5 py-0.5">
                    <Icon as={Play} size={10} strokeWidth={3} className="text-foreground" />
                    {item.durationMs !== undefined ? (
                      <Text className="text-foreground text-[10.5px] font-body-semibold">
                        {fmtDuration(item.durationMs / 1000, locale)}
                      </Text>
                    ) : null}
                  </View>
                ) : null}
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={t.removePhoto}
                  onPress={() => onRemove(i)}
                  hitSlop={6}
                  className="bg-background absolute -end-1.5 -top-1.5 size-6 items-center justify-center rounded-full"
                >
                  <Icon as={X} size={13} strokeWidth={3} className="text-foreground" />
                </Pressable>
              </View>
            ))}
            {items.length < MAX_MEDIA ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={items.length === 0 ? t.choose : t.chooseMore}
                onPress={onAdd}
                disabled={adding}
                className={`bg-terracotta-100 rounded-box size-22 items-center justify-center active:opacity-80 ${adding ? "opacity-50" : ""}`}
              >
                <Icon as={Plus} size={22} strokeWidth={2.75} className="text-terracotta-900" />
              </Pressable>
            ) : null}
          </View>
          {adding ? (
            <Text variant="meta" className="text-muted-foreground">
              {t.preparing}
            </Text>
          ) : null}
        </View>
      ),
    },
  ]
}

export function photosSections(
  album: string,
  count: number,
  t: Record<string, string>,
  locale: Locale
): AssetSection[] {
  return [
    {
      step: "album",
      label: t.sectionAlbum!,
      value: `${album.trim()} · ${t.photosCount!.replace("{n}", fmtNum(count, locale))}`,
    },
  ]
}
