/**
 * ٥.٤ — معاينة الوارث. Exactly what one heir would receive, and nothing else.
 *
 * The disclaimer is the screen, not decoration: *"هذا كل ما ستراه سارة بعد
 * الإفراج — لا أكثر."* It is a statement about the **ceiling**. An owner who
 * cannot see what an heir gets has to trust the routing blind, and the whole
 * point of silent heirs is that nobody else can check it for them.
 *
 * Titles are decrypted here the same way 4.1 decrypts them — the preview is
 * rendered from the owner's own keys, on the owner's device. Nothing about this
 * screen gives the heir early access, and nothing about it asks the server what
 * an asset is called.
 *
 * **The board's spec for this screen is truncated.** The 256 KiB `get_file` cap
 * cuts off mid-5.4, so what is built here is what was legible: the heir
 * switcher, the disclaimer, and the routed-asset list with its "كاملة" marker.
 * The personal-message surface it shares with ٥.٥ was never readable.
 */
import { useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { openLabel } from "@workspace/crypto/label"
import { unwrap } from "@workspace/crypto/wrap"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AssetRow } from "@workspace/ui-native/components/wassiya/asset-row"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { InitialDisc } from "@workspace/ui-native/components/wassiya/initial-disc"
import { router, useLocalSearchParams } from "expo-router"
import { Inbox, Pencil } from "lucide-react-native"
import { Pressable, ScrollView, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPE_ICON } from "@/lib/asset-types"
import { useVault } from "@/stores/vault"

export function HeirPreviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useStrings("heirs/preview")
  const { t: assets } = useStrings("assets")
  const { t: common } = useStrings("common")

  const heirs = useQuery(api.heirs.list)
  const [heirId, setHeirId] = useState<Id<"heirs">>(id as Id<"heirs">)
  const preview = useQuery(api.routing.previewForHeir, { heirId })
  const mk = useVault((s) => s.mk)

  const name = preview?.heir.name ?? ""

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-4"
    >
      <BackButton label={common.back} />

      {/* ٤.١'s header shape: the name takes the row, one 40px circle at the far
          end. The pencil is here rather than on ٥.١'s cards at the owner's
          direction — a per-row pencil puts a second target on every card for
          the rarer errand.

          It edits `heirId`, not the route's `id`: the switcher below can move
          this screen to a different heir, and a pencil that still pointed at
          the one you arrived on would silently edit the wrong person. */}
      <View className="mt-4 flex-row items-center gap-3">
        <Text variant="screenTitle" className="min-w-0 flex-1">
          {t.title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.editHeir.replace("{name}", name)}
          onPress={() =>
            router.push({ pathname: "/heirs/[id]/edit", params: { id: heirId } })
          }
          className="bg-card active:bg-sand-300 size-10 shrink-0 items-center justify-center rounded-full"
        >
          <Icon as={Pencil} size={18} strokeWidth={2.75} className="text-foreground" />
        </Pressable>
      </View>

      {/* The switcher. Comparing heirs side by side is how an owner notices
          that one of them receives nothing. */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerClassName="gap-2 py-4"
      >
        {(heirs ?? []).map((heir) => (
          <Pressable
            key={heir.id}
            onPress={() => setHeirId(heir.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: heir.id === heirId }}
            className={cnRow(heir.id === heirId)}
          >
            <InitialDisc name={heir.name} size="sm" />
            <Text variant="metaSm" className="font-body-medium">
              {heir.name.split(" ")[0]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      <View className="rounded-card bg-olive-100 mb-header p-4">
        <Text variant="metaSm" className="text-olive-700 leading-[1.75]">
          {t.disclaimer.replace("{name}", name)}
        </Text>
      </View>

      {preview !== undefined && preview.items.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={t.empty.replace("{name}", name)}
        />
      ) : (
        <View className="gap-2">
          <Text variant="sectionLabel">
            {t.heading.replace("{name}", name)}
          </Text>
          <View className="gap-row">
            {(preview?.items ?? []).map((item) => (
              <AssetRow
                key={item.assetId}
                icon={ASSET_TYPE_ICON[item.type]}
                title={titleOf(item, mk, assets.undecryptable)}
                // "عبر «كل الورثة»" tells the owner *why* this heir has it,
                // which is the difference between a deliberate route and one
                // inherited from the default bucket.
                meta={item.via === "allHeirs" ? t.viaAllHeirs : undefined}
                recipientStatus="confirmed"
                recipientLabel={t.whole}
              />
            ))}
          </View>
          {preview?.messageKind != null ? (
            <Text variant="metaSm" className="text-muted-foreground mt-2">
              {t.messageAttached}
            </Text>
          ) : null}
        </View>
      )}
    </ScrollView>
  )
}

function titleOf(
  item: { labelSealed: ArrayBuffer; dekWrappedByMk: ArrayBuffer },
  mk: Uint8Array | null,
  fallback: string
): string {
  if (mk === null) return fallback
  try {
    const dek = unwrap(new Uint8Array(item.dekWrappedByMk), mk)
    const label = openLabel(new Uint8Array(item.labelSealed), dek)
    dek.fill(0)
    return label.title
  } catch {
    return fallback
  }
}

function cnRow(active: boolean): string {
  return active
    ? "flex-row items-center gap-2 rounded-full border border-terracotta-700 bg-terracotta-100 px-3 py-1.5"
    : "flex-row items-center gap-2 rounded-full border border-border px-3 py-1.5 active:bg-sand-200"
}
