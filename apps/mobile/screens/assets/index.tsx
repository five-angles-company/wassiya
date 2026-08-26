/**
 * ٤.١ — the vault list.
 *
 * ## What this screen deliberately does not have
 *
 * No filter chips, no permanent search field, no group headings, no type
 * sections, no badges, no protection bar, no per-row chevrons, no cards. All of
 * it went, because *"a vault is a place you visit rarely and calmly — it should
 * be almost empty."* A heading for every three rows is what made the last
 * version feel heavy.
 *
 * Search is an **icon**. At forty-three items you scroll; a field standing open
 * on the screen would imply otherwise. It surfaces on tap, and the design note
 * expects it to become permanent only past a hundred items.
 *
 * ## One flat list, irreplaceable first
 *
 * A seed phrase, then a deed, then a password. Nothing labels the order — the
 * order simply *is* that, so the top of the list is always what matters most.
 * Type lives in the small tile and never in a heading.
 *
 * ## One alarm
 *
 * The terracotta line at the top is the only urgent thing on the screen, and it
 * vanishes at zero rather than turning olive: "everything is fine" is not news.
 * Individual unrouted rows say so in their own recipient slot, so the gap reads
 * both in summary and in place.
 */
import { useRef, useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { VaultRow } from "@workspace/ui-native/components/wassiya/vault-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Info, Plus, Search } from "lucide-react-native"
import { router } from "expo-router"
import { Pressable, View } from "react-native"

import { Screen } from "@/components/screen"
import { useVaultGate } from "@/hooks/use-vault-gate"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPE_ICON, ASSET_TYPE_ROUTE, type AssetType } from "@/lib/asset-types"
import { AssetSearchField } from "@/screens/assets/components/asset-search-field"
import { AssetTypeSheet } from "@/screens/assets/components/asset-type-sheet"
import { AssetsDecrypting } from "@/screens/assets/components/assets-decrypting"
import { AssetsEmpty } from "@/screens/assets/components/assets-empty"
import { AssetsLocked } from "@/screens/assets/components/assets-locked"
import { useAssetList } from "@/screens/assets/use-asset-list"

export function AssetsScreen() {
  const { t, locale } = useStrings("assets")
  const { t: routing } = useStrings("will/routing")
  const { status, unlocked, unlock } = useVaultGate()
  const [search, setSearch] = useState("")
  const [searching, setSearching] = useState(false)
  const { rows, total, vaultSize, heirNames } = useAssetList(
    search,
    null,
    t.undecryptable,
    { executor: routing.executor! }
  )

  const num = (n: number) => fmtNum(n, locale)

  const addSheet = useRef<TrueSheet>(null)
  const openAdd = () => void addSheet.current?.present()

  async function chooseType(type: AssetType) {
    // Dismissed first: pushing a route out from under a presented sheet leaves
    // it hanging over the wizard on Android.
    await addSheet.current?.dismiss()
    router.push(ASSET_TYPE_ROUTE[type])
  }

  if (!unlocked) {
    return (
      <Screen inset="footer" bleed contentClassName="px-[22px] pt-5">
        <AssetsLocked
          status={t.lockedStatus!}
          count={num(vaultSize)}
          countUnit={t.lockedCountUnit!}
          heirsLine={
            heirNames.length > 0
              ? t.lockedHeirs!.replace("{n}", num(heirNames.length))
              : undefined
          }
          heirNames={heirNames.slice(0, 3)}
          deliveryLine={t.lockedDelivery!}
          actionLabel={status === "unlocking" ? t.unlocking! : t.unlockCta!}
          footnote={t.lockedFootnote!}
          onUnlock={unlock}
          busy={status === "unlocking"}
        />
      </Screen>
    )
  }

  // Undefined is "still decrypting", which is a different screen from "empty".
  if (rows === undefined) {
    return (
      <Screen inset="footer" bleed contentClassName="px-[22px] pt-5">
        <AssetsDecrypting title={t.vaultTitle!} subtitle={t.vaultDecrypting!} />
      </Screen>
    )
  }

  if (total === 0) {
    return (
      <Screen inset="footer" bleed contentClassName="px-[22px] pt-5">
        {/* The empty vault keeps a full-width button: it is the only action on
            an otherwise blank screen, and a round button in the corner of one
            reads as an afterthought rather than an invitation. */}
        <AssetsEmpty
          title={t.vaultTitle!}
          subtitle={t.emptySubtitle!}
          lead={t.emptyLead!}
          addLabel={t.addAsset!}
          onAdd={openAdd}
        />
        <AssetTypeSheet ref={addSheet} onSelect={(type) => void chooseType(type)} />
      </Screen>
    )
  }

  const routed = rows.filter((row) => row.recipientCount > 0).length
  const unrouted = rows.length - routed

  return (
    <Screen
      inset="footer"
      bleed
      contentClassName="px-[22px] pt-5"
      /*
        A round button in the corner rather than a full-width slab. Adding is
        the screen's primary action at any scroll position, so it stays pinned —
        but a bar across the whole width competes with the list it sits under,
        permanently, for a tap most sessions never make.

        It rides `Screen`'s footer slot, which is already outside the scroll
        area, so it needs no absolute positioning of its own.
      */
      footer={
        <View className="items-end">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.addAsset}
            onPress={openAdd}
            className="bg-primary active:bg-terracotta-600 size-14 items-center justify-center rounded-full shadow-md"
          >
            <Icon as={Plus} size={26} strokeWidth={2.75} className="text-background" />
          </Pressable>
        </View>
      }
    >
      <View className="mb-[26px] flex-row items-start gap-3">
        <View className="flex-1">
          <Text className="font-heading-extrabold text-foreground mb-[5px] text-[30px] leading-[1.2]">
            {t.vaultTitle}
          </Text>
          <Text className="text-[13px] opacity-55">
            {t.vaultCount!.replace("{n}", num(total)).replace("{m}", num(routed))}
          </Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.searchPlaceholder}
          onPress={() => setSearching((was) => !was)}
          className="bg-card size-10 shrink-0 items-center justify-center rounded-full active:opacity-70"
        >
          <Icon as={Search} size={18} strokeWidth={2.75} className="text-foreground" />
        </Pressable>
      </View>

      {searching ? (
        <AssetSearchField
          value={search}
          onChangeText={setSearch}
          placeholder={t.searchPlaceholder!}
          clearLabel={t.clearFilters!}
          className="mb-[22px]"
        />
      ) : null}

      {/* The one alarm. Terracotta, one line, gone at zero. */}
      {unrouted > 0 && !searching ? (
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push("/plan/routing")}
          className="bg-terracotta-100 mb-[22px] flex-row items-center gap-[11px] rounded-[22px] px-4 py-3.5 active:opacity-80"
        >
          <Icon as={Info} size={17} strokeWidth={2.75} className="text-terracotta-900 shrink-0" />
          <Text className="text-terracotta-900 min-w-0 flex-1 text-[12.5px] leading-[1.45]">
            {t.unroutedAlert!.replace("{n}", num(unrouted))}
          </Text>
          <Text className="text-terracotta-900 font-body-bold shrink-0 text-[12.5px]">
            {t.unroutedAction}
          </Text>
        </Pressable>
      ) : null}

      <View className="mb-auto">
        {rows.map((row, i) => (
          <VaultRow
            key={row.id}
            icon={ASSET_TYPE_ICON[row.type]}
            title={row.title}
            recipients={row.recipients.join("، ")}
            unroutedLabel={
              row.recipientCount === 0 ? t.recipientsZero : undefined
            }
            faces={row.recipients}
            allHeirsLabel={row.allHeirs ? t.allHeirsShort : undefined}
            divider={i < rows.length - 1}
            onPress={() =>
              router.push({
                pathname: "/assets/[id]",
                params: { id: row.id },
              })
            }
          />
        ))}
      </View>

      <AssetTypeSheet ref={addSheet} onSelect={(type) => void chooseType(type)} />
    </Screen>
  )
}
