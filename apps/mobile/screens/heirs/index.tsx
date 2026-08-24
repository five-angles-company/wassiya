/**
 * ٥.١ — the heirs list, and the الوصيّة tab's real content.
 *
 * The coverage strip at the top is the point of the screen. A vault is not
 * measured by how many heirs it names but by how much of it actually reaches
 * someone, so "٣٥ من ٤٣ أصلاً لها مستلم" leads, and unrouted assets are called
 * out by name — the same warning 4.1 puts on the row and 4.9 on the detail.
 *
 * Three heir states only, per the board, and `silent` is **neutral**: an heir
 * who knows nothing is a deliberate choice, not a task. The amber case at row
 * level is an heir who receives *nothing*, which is the mirror of "بلا مستلم"
 * on an asset.
 */
import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { HeirCard } from "@workspace/ui-native/components/wassiya/heir-card"
import { fmtNum, fmtPhoneMasked } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { Plus, Users } from "lucide-react-native"
import { ScrollView, View } from "react-native"

import { fmtCount, type CountForms } from "@/i18n/plural"
import { useStrings } from "@/i18n/use-strings"
import { useVaultGate } from "@/hooks/use-vault-gate"
import { AssetsLocked } from "@/screens/assets/components/assets-locked"
import { ScreenFrame } from "@/screens/assets/components/screen-frame"
import { useAssetList } from "@/screens/assets/use-asset-list"

export function HeirsScreen() {
  const { t, locale } = useStrings("heirs")
  const { t: assets } = useStrings("assets")
  const { status, unlocked, unlock } = useVaultGate()
  const heirs = useQuery(api.heirs.list)
  // Reuses 4.1's decrypt pass: the coverage line needs the *name* of an
  // unrouted asset, and names are ciphertext.
  const { rows } = useAssetList("", null, assets.undecryptable)

  const coverage = useMemo(() => {
    if (rows === undefined) return null
    const unrouted = rows.filter((row) => !row.routed)
    return {
      total: rows.length,
      routed: rows.length - unrouted.length,
      unroutedCount: unrouted.length,
      // The one the user is most likely to care about is the one the sort
      // already put first.
      example: unrouted[0]?.title ?? null,
    }
  }, [rows])

  const heirForms: CountForms = {
    zero: t.countZero,
    one: t.countOne,
    two: t.countTwo,
    few: t.countFew,
    many: t.countMany,
  }

  if (!unlocked) {
    return (
      <ScreenFrame title={t.title}>
        <AssetsLocked
          title={assets.lockedTitle}
          body={assets.lockedBody}
          actionLabel={status === "unlocking" ? assets.unlocking : assets.unlock}
          onUnlock={unlock}
          busy={status === "unlocking"}
        />
      </ScreenFrame>
    )
  }

  if (heirs !== undefined && heirs.length === 0) {
    return (
      <ScreenFrame title={t.title}>
        <EmptyState
          icon={Users}
          title={t.emptyTitle}
          subtitle={t.emptyBody}
          action={
            <Button onPress={() => router.push("/heirs/new")} className="px-8">
              <Text>{t.add}</Text>
            </Button>
          }
        />
      </ScreenFrame>
    )
  }

  return (
    <View className="flex-1 bg-background">
      <ScrollView contentContainerClassName="px-gutter grow pb-28 pt-6">
        <Text variant="screenTitle">{t.title}</Text>
        <Text variant="meta" className="text-muted-foreground mt-1">
          {fmtCount(
            heirs?.length ?? 0,
            fmtNum(heirs?.length ?? 0, locale),
            heirForms,
            locale
          )}
        </Text>

        {/* Coverage — how much of the vault actually reaches someone. */}
        {coverage !== null ? (
          <View className="mt-header gap-2">
            <Text variant="sectionLabel">{t.coverageLabel}</Text>
            <Text variant="meta" className="text-muted-foreground">
              {t.coverage
                .replace("{routed}", fmtNum(coverage.routed, locale))
                .replace("{total}", fmtNum(coverage.total, locale))}
            </Text>
            {coverage.unroutedCount > 0 ? (
              <AlertBanner
                variant="security"
                description={t.unroutedWarning
                  .replace("{n}", fmtNum(coverage.unroutedCount, locale))
                  .replace("{example}", coverage.example ?? "")}
                actions={
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => router.push("/will/routing")}
                  >
                    <Text>{t.routingLink}</Text>
                  </Button>
                }
              />
            ) : coverage.total > 0 ? (
              <Text variant="metaSm" className="text-olive-700">
                {t.allRouted}
              </Text>
            ) : null}
          </View>
        ) : null}

        <View className="mt-header gap-row">
          {(heirs ?? []).map((heir) => (
            <HeirCard
              key={heir.id}
              name={heir.name}
              relation={`${heir.relation} · ${fmtPhoneMasked(heir.phone)}`}
              inviteState={inviteState(heir.mode, heir.inviteStatus)}
              locale={locale}
              labels={{
                silent: t.statusSilent,
                accepted: t.statusAccepted,
                pending: t.statusPending,
                declined: t.statusDeclined,
                receivesNothing: t.receivesNothing,
              }}
              receivesSummary={
                heir.routedAssetCount === 0
                  ? undefined
                  : `${t.receives.replace("{n}", fmtNum(heir.routedAssetCount, locale))}${
                      heir.messageKind === null ? "" : ` · ${t.withMessage}`
                    }`
              }
              onPress={() =>
                router.push({
                  pathname: "/heirs/[id]/preview",
                  params: { id: heir.id },
                })
              }
            />
          ))}
        </View>
      </ScrollView>

      <View className="px-gutter absolute bottom-0 start-0 end-0 gap-2 pb-5">
        <Button variant="outline" onPress={() => router.push("/will/routing")}>
          <Text>{t.routingLink}</Text>
        </Button>
        <Button onPress={() => router.push("/heirs/new")}>
          <Icon as={Plus} className="text-primary-foreground size-4.5" />
          <Text>{t.add}</Text>
        </Button>
      </View>
    </View>
  )
}

/**
 * Mode and invite status collapse into the card's three-plus-one states.
 *
 * A silent heir has no invite to be pending, so mode wins outright — without
 * that, every silent heir would render as `pending` forever on the strength of
 * an `inviteStatus: "none"` that will never change.
 */
function inviteState(
  mode: "silent" | "notified",
  inviteStatus: "none" | "invited" | "accepted"
): "silent" | "accepted" | "pending" {
  if (mode === "silent") return "silent"
  return inviteStatus === "accepted" ? "accepted" : "pending"
}
