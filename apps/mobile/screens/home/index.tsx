/**
 * ٣.١ — الرئيسية. The app's resting state.
 *
 * ## The constraint that shapes this whole screen
 *
 * *"Category counts come from encrypted metadata (count + type are plaintext;
 * titles and payloads are not), so this screen renders before any
 * decryption."*
 *
 * So there is **no `useVault` anywhere in this file** and nothing here waits on
 * a fingerprint. Every number shown — the protection score, the category
 * counts, the routed totals — comes from server metadata the deployment is
 * already allowed to see. That is what lets Home be the screen you land on
 * rather than a wall in front of one, and it is the reason the asset
 * *categories* are shown here while the asset *names* are not: names are
 * ciphertext and live on 4.1, behind the unlock.
 *
 * ## Exactly one amber row
 *
 * The board allows one at a time — the highest-ranked incomplete protection.
 * `useProtectionScore` owns that ranking so Home and 6.1 cannot disagree; this
 * screen renders only `topGap`, where 6.1 renders the whole list.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { InitialDisc } from "@workspace/ui-native/components/wassiya/initial-disc"
import { ProtectionScore } from "@workspace/ui-native/components/wassiya/protection-score"
import { StatusPill } from "@workspace/ui-native/components/wassiya/status-pill"
import { fmtNum, fmtTime } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import { Pressable, ScrollView, View } from "react-native"

import { useProtectionScore } from "@/hooks/use-protection-score"
import { fmtCount, type CountForms } from "@/i18n/plural"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPE_ICON, ASSET_TYPES, type AssetType } from "@/lib/asset-types"

export function HomeScreen() {
  const { t, locale } = useStrings("home")
  const { t: assets } = useStrings("assets")
  const me = useQuery(api.users.me)
  // `assets.list` returns type, meta and the routing rule in the clear. The
  // sealed label comes back too and is simply not opened here.
  const rows = useQuery(api.assets.list, {})
  const heirs = useQuery(api.heirs.list)

  const score = useProtectionScore({
    identity: t.itemIdentity,
    key: t.itemKey,
    guardian: t.itemGuardian,
    sheet: t.itemSheet,
    heirs: t.itemHeirs,
    routing: t.itemRouting,
    checkin: t.itemCheckin,
  })

  const total = rows?.length ?? 0
  const routed = rows?.filter((row) => row.recipientRule === "explicit").length ?? 0
  const unrouted = total - routed

  const heirForms: CountForms = {
    zero: t.countZero,
    one: t.countOne,
    two: t.countTwo,
    few: t.countFew,
    many: t.countMany,
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-6"
    >
      {/* Greeting. First name only — the board's own choice, and it is what
          makes a security dashboard read as someone's own vault. */}
      <View className="flex-row items-center gap-3">
        <InitialDisc name={me?.name ?? ""} />
        <View>
          <Text variant="metaSm" className="text-muted-foreground">
            {greeting(t)}
          </Text>
          <Text variant="pageTitle">{firstName(me?.name)}</Text>
        </View>
      </View>

      {/* The protection ring, as a summary. 6.1 renders the same object as a
          to-do list. */}
      <Pressable
        onPress={() => router.push("/protection")}
        accessibilityRole="button"
        className="rounded-card bg-card mt-header flex-row items-center gap-4 p-4 active:bg-sand-300"
      >
        <ProtectionScore earned={score.earned} total={score.total} />
        <View className="min-w-0 flex-1">
          <Text variant="rowTitle">
            {score.earned === score.total ? t.protectedTitle : t.protectedPartial}
          </Text>
          <Text variant="metaSm" className="text-muted-foreground mt-0.5">
            {t.lastSync.replace("{time}", fmtTime(new Date(), locale))}
          </Text>
        </View>
        <Icon as={ChevronLeft} className="text-muted-foreground size-5" flip />
      </Pressable>

      {/* The protection chips, as the board draws them. Done ones recede; the
          single outstanding one is the amber row below, not a chip. */}
      <View className="mt-3 flex-row flex-wrap gap-2">
        {score.items
          .filter((item) => item.done)
          .map((item) => (
            <StatusPill key={item.id} status="confirmed">
              {item.label}
            </StatusPill>
          ))}
      </View>

      {/* Exactly one. */}
      {score.topGap !== null ? (
        <AlertBanner
          className="mt-4"
          variant="security"
          title={score.topGap.label}
          description={t.gapNotOn}
          actions={
            score.topGap.href === undefined ? undefined : (
              <Button
                size="sm"
                onPress={() => router.push(score.topGap!.href!)}
              >
                <Text>{t.fix}</Text>
              </Button>
            )
          }
        />
      ) : null}

      {/* Categories, from plaintext metadata. No decryption, no unlock. */}
      <View className="mt-header flex-row items-center justify-between">
        <Text variant="sectionLabel">{t.assetsTitle}</Text>
        <Pressable
          onPress={() => router.push("/assets")}
          accessibilityRole="button"
          className="px-2 py-1"
        >
          <Text variant="metaSm" className="text-terracotta-700">
            {t.seeAll}
          </Text>
        </Pressable>
      </View>

      {total === 0 ? (
        <Text variant="metaSm" className="text-muted-foreground mt-2">
          {t.emptyAssets}
        </Text>
      ) : (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {ASSET_TYPES.map((type) => {
            const count = rows?.filter((row) => row.type === type).length ?? 0
            if (count === 0) return null
            return (
              <Pressable
                key={type}
                onPress={() => router.push("/assets")}
                accessibilityRole="button"
                className="rounded-row bg-card min-w-[46%] grow flex-row items-center gap-3 p-3.5 active:bg-sand-300"
              >
                <View className="bg-background size-9 items-center justify-center rounded-full">
                  <Icon
                    as={ASSET_TYPE_ICON[type]}
                    className="text-terracotta-700 size-4"
                  />
                </View>
                <Text variant="metaSm" className="flex-1">
                  {assets[CATEGORY_KEY[type]]}
                </Text>
                <Text variant="rowTitle">{fmtNum(count, locale)}</Text>
              </Pressable>
            )
          })}
        </View>
      )}

      {/* Who receives what, in one line. */}
      <Pressable
        onPress={() => router.push("/will/routing")}
        accessibilityRole="button"
        className="rounded-card bg-card mt-header gap-1.5 p-4 active:bg-sand-300"
      >
        <Text variant="rowTitle">
          {heirs === undefined || heirs.length === 0
            ? t.noHeirs
            : t.heirsSummary
                .replace(
                  "{heirs}",
                  fmtCount(
                    heirs.length,
                    fmtNum(heirs.length, locale),
                    heirForms,
                    locale
                  )
                )
                .replace("{routed}", fmtNum(routed, locale))
                .replace("{total}", fmtNum(total, locale))}
        </Text>
        {unrouted > 0 ? (
          <Text variant="metaSm" className="text-muted-foreground">
            {t.defaultRule.replace("{n}", fmtNum(unrouted, locale))}
          </Text>
        ) : null}
      </Pressable>
    </ScrollView>
  )
}

/**
 * Time-of-day greeting.
 *
 * Read at render on purpose and not memoised: it is a label, not a countdown,
 * and being an hour stale across a long session is invisible where a frozen
 * day-counter would not be.
 */
function greeting(t: Record<string, string>): string {
  const hour = new Date().getHours()
  if (hour < 12) return t.greetMorning!
  if (hour < 17) return t.greetAfternoon!
  return t.greetEvening!
}

/** The board greets by first name. Arabic names are space-separated. */
function firstName(full: string | null | undefined): string {
  return (full ?? "").trim().split(/\s+/u)[0] ?? ""
}

/** Category labels live in the assets dictionary; reused, not duplicated. */
const CATEGORY_KEY = {
  crypto: "filterCrypto",
  bank: "filterBank",
  document: "filterDocument",
  photos: "filterPhotos",
  digital: "filterDigital",
  note: "filterNote",
} as const satisfies Record<AssetType, string>
