/**
 * ٥.٤ — معاينة الوارث. Exactly what one heir would receive, and nothing else.
 *
 * The disclaimer is the screen, not decoration: *"هذا كل ما ستراه سارة بعد
 * الإفراج — لا أكثر."* An owner who cannot see what an heir gets has to trust
 * the routing blind, and the point of silent heirs is that nobody else can check
 * it for them.
 *
 * Titles are decrypted from the owner's own keys on the owner's device, exactly
 * as ٤.١ does. Nothing here gives the heir early access, and nothing asks the
 * server what an asset is called.
 *
 * The screen is the heir switcher, the disclaimer, and the routed-asset list
 * with its "كاملة" marker. The personal-message surface it shares with ٥.٥ is
 * not built yet.
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
import { InitialDisc } from "@workspace/ui-native/components/wassiya/initial-disc"
import { router, useLocalSearchParams } from "expo-router"
import { Pencil } from "lucide-react-native"
import { Pressable, ScrollView, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { GhostRow } from "@/components/ghost-row"
import { Screen } from "@/components/screen"
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
    <Screen>
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
          that one of them receives nothing — so it is absent with one heir,
          where there is nothing to compare and a row of one reads as a control
          that has failed.

          ⚠️ `items-center` and `grow-0` are load-bearing. A horizontal
          `ScrollView` stretches its children on the cross axis and takes the
          column's leftover height, so without them a single chip was drawn as
          a pill the height of the screen. */}
      {(heirs?.length ?? 0) > 1 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="grow-0"
          contentContainerClassName="gap-2 py-4 items-center"
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
      ) : null}

      <View className="rounded-card bg-olive-100 mb-header p-4">
        <Text variant="metaSm" className="text-olive-700 leading-[1.75]">
          {t.disclaimer.replace("{name}", name)}
        </Text>
      </View>

      {preview !== undefined && preview.items.length === 0 ? (
        /* Left-aligned with ghost cards, the same shape as the empty vault and
           the empty heirs list. A centred medallion here read as an error on a
           screen whose answer — "nothing is routed to this person yet" — is a
           true and ordinary state. The ghosts carry the trailing disc because
           an `AssetRow` has one. */
        <View className="gap-header">
          <Text className="max-w-[320px] text-[19px] leading-[1.6]">
            {t.empty.replace("{name}", name)}
          </Text>
          <View className="gap-row opacity-[0.32]">
            <GhostRow title="62%" meta="30%" />
            <GhostRow title="48%" meta="22%" />
          </View>
        </View>
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
    </Screen>
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
