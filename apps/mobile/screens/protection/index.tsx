/**
 * ٦.١ — the Protection Centre, and the الحماية tab's real content.
 *
 * One score object drives three surfaces (Home's chip, 2.6's checklist, this
 * list) so they can never disagree about how safe the vault is. Here it is the
 * to-do list form: every outstanding row links to the screen that closes it.
 *
 * ## Ranking, which is the whole reason this is a list and not a wall of amber
 *
 * `protection-score-list` allows exactly one `needed` item at a time and the
 * rest fall to `later`. That is not decoration — a screen where six things are
 * urgent ranks nothing. The order below is the ranking, and the **guardian is
 * first among the outstanding**: without one, K_rec cannot be rebuilt off this
 * device, so the recovery sheet the owner has already printed does not work.
 * Every other gap costs less than that one.
 */
import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { ProtectionScore } from "@workspace/ui-native/components/wassiya/protection-score"
import {
  ProtectionScoreList,
  type ProtectionItem,
} from "@workspace/ui-native/components/wassiya/protection-score-list"
import { router, type Href } from "expo-router"
import { ScrollView, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"

export function ProtectionScreen() {
  const { t } = useStrings("protection")
  const me = useQuery(api.users.me)
  const keyring = useQuery(api.keyring.get)
  const guardians = useQuery(api.guardians.list)
  const heirs = useQuery(api.heirs.list)
  const checkin = useQuery(api.checkin.get)

  const items = useMemo((): (ProtectionItem & { href?: Href })[] => {
    const guardianLive =
      guardians?.some((g) => g.status === "accepted") === true &&
      keyring?.hasGuardianShare === true
    const routed = heirs?.some((h) => h.routedAssetCount > 0) === true

    // Built in ranking order, then the first outstanding one is promoted to
    // `needed` below — so the ranking lives in one place.
    return [
      {
        id: "identity",
        label: t.itemIdentity,
        done: me?.identityStatus === "verified",
        href: "/setup/kyc",
      },
      { id: "key", label: t.itemKey, done: keyring !== null },
      {
        id: "guardian",
        label: t.itemGuardian,
        done: guardianLive,
        href: "/protection/guardian",
      },
      {
        id: "sheet",
        label: t.itemSheet,
        done: keyring?.paperPrintedAt != null,
        href: "/setup/recovery-kit",
      },
      {
        id: "heirs",
        label: t.itemHeirs,
        done: (heirs?.length ?? 0) > 0,
        href: "/heirs/new",
      },
      { id: "routing", label: t.itemRouting, done: routed, href: "/will/routing" },
      {
        id: "checkin",
        label: t.itemCheckin,
        done: checkin !== null,
        href: "/protection/checkin",
      },
    ]
  }, [me, keyring, guardians, heirs, checkin, t])

  const ranked = useMemo(() => {
    let promoted = false
    return items.map((item) => {
      if (item.done) return item
      if (!promoted) {
        promoted = true
        return { ...item, priority: "needed" as const }
      }
      return { ...item, priority: "later" as const }
    })
  }, [items])

  const earned = items.filter((item) => item.done).length
  const guardianMissing = items.find((i) => i.id === "guardian")?.done === false

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-6"
    >
      <Text variant="screenTitle">{t.title}</Text>

      <View className="mb-header mt-4 items-center gap-3">
        <ProtectionScore earned={earned} total={items.length} size="lg" />
        <Text variant="meta" className="text-muted-foreground text-center">
          {earned === items.length ? t.scoreComplete : t.scoreIncomplete}
        </Text>
      </View>

      {/* Outranks the list: a printed sheet that cannot recover anything is
          worse than a missing one, because the owner believes they are safe. */}
      {guardianMissing ? (
        <AlertBanner
          className="mb-header"
          variant="security"
          description={t.guardianUrgent}
        />
      ) : null}

      {/* The press handler lives on the item, not the list — a done row is
          not pressable, so "go fix this" and "this is finished" are different
          affordances rather than the same row behaving differently. */}
      <ProtectionScoreList
        items={ranked.map(({ href, ...item }) => ({
          ...item,
          onPress:
            href === undefined || item.done
              ? undefined
              : () => router.push(href),
        }))}
      />
    </ScrollView>
  )
}
