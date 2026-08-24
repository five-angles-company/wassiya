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
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { ProtectionScore } from "@workspace/ui-native/components/wassiya/protection-score"
import { ShieldCheck } from "lucide-react-native"
import { ProtectionScoreList } from "@workspace/ui-native/components/wassiya/protection-score-list"
import { router } from "expo-router"
import { ScrollView, View } from "react-native"

import { useProtectionScore } from "@/hooks/use-protection-score"
import { useStrings } from "@/i18n/use-strings"

export function ProtectionScreen() {
  const { t } = useStrings("protection")
  // The same object Home renders as a ring. Computing it twice is how two
  // screens end up disagreeing about how safe a vault is.
  const { items, ranked, earned, total } = useProtectionScore({
    identity: t.itemIdentity,
    key: t.itemKey,
    guardian: t.itemGuardian,
    sheet: t.itemSheet,
    heirs: t.itemHeirs,
    routing: t.itemRouting,
    checkin: t.itemCheckin,
  })
  const claims = useQuery(api.claims.againstMe)
  const guardianships = useQuery(api.guardians.guardianFor)
  const { t: approve } = useStrings("recovery/approve")
  const { t: claimCopy } = useStrings("protection/claim")

  const openClaim = claims?.find((claim) => claim.canVeto) ?? null


  const guardianMissing = items.find((i) => i.id === "guardian")?.done === false

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-6"
    >
      <Text variant="screenTitle">{t.title}</Text>

      <View className="mb-header mt-4 items-center gap-3">
        <ProtectionScore earned={earned} total={total} size="lg" />
        <Text variant="meta" className="text-muted-foreground text-center">
          {earned === total ? t.scoreComplete : t.scoreIncomplete}
        </Text>
      </View>

      {/* An open claim outranks everything, including the guardian warning:
          it is time-boxed and someone else started the clock. ٧.٥ is the only
          place it can be stopped. */}
      {openClaim !== undefined && openClaim !== null ? (
        <AlertBanner
          className="mb-header"
          variant="security"
          title={claimCopy.title}
          description={claimCopy.intro.replace("{name}", openClaim.claimantName)}
          actions={
            <Button
              size="sm"
              onPress={() => router.push("/protection/claim")}
            >
              <Text>{claimCopy.veto}</Text>
            </Button>
          }
        />
      ) : null}

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
      {/* The guardian role's own entry point. Someone can be an owner and
          somebody else's guardian at once, and the second role has nowhere
          else to live. */}
      {guardianships !== undefined && guardianships.length > 0 ? (
        <SettingsRow
          className="rounded-card bg-card mb-header overflow-hidden"
          icon={ShieldCheck}
          label={approve.title}
          chevron
          onPress={() => router.push("/recovery/approve")}
        />
      ) : null}

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
