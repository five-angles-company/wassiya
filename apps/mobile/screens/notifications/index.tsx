/**
 * ٣.٣ — الإشعارات.
 *
 * ## Two bands, never one flat feed
 *
 * *"actionable security events pin to the top with inline actions and survive
 * 'mark all read'; the rest is history."* The split is the design. A recovery
 * attempt from an unknown device and "your guardian accepted" are not the same
 * kind of object, and a single reverse-chronological list buries the first
 * under the second within a day.
 *
 * "Survive mark-all-read" is the part that is easy to get wrong: marking read
 * is a *reading* gesture, and it must not dismiss something the owner still has
 * to act on. So `NEEDS_ACTION` events stay in the top band whether or not they
 * carry a `readAt`.
 *
 * ## What must never appear here
 *
 * A death claim. *"A death claim (7.5) escalates past this screen to a
 * full-screen interrupt — it must not arrive as a list row."* The claim events
 * are therefore mapped to history copy only; the interrupt itself is
 * `/protection/claim`, and 6.1 carries the banner. If a claim ever renders as a
 * row here, it has been demoted from an interrupt to a notification, which is
 * the failure that loses someone their veto window.
 */
import { useMemo } from "react"
import { usePaginatedQuery, useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { AuditRow } from "@workspace/ui-native/components/wassiya/audit-row"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { BellOff, KeyRound, ShieldCheck, Users } from "lucide-react-native"
import { Pressable, ScrollView, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"

/**
 * Events that belong in the top band. Everything else is history.
 *
 * Deliberately a small, explicit list rather than a heuristic: a new event kind
 * should have to be *chosen* into the attention band, because the band's value
 * is entirely in how rarely it is used.
 */
const NEEDS_ACTION = new Set(["recovery.attempted", "checkin.due"])

export function NotificationsScreen() {
  const { t, locale } = useStrings("notifications")
  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: 30 }
  )
  const markRead = useMutation(api.notifications.markRead)

  const { attention, history } = useMemo(() => {
    const attention = results.filter((row) => NEEDS_ACTION.has(row.kind))
    const history = results.filter((row) => !NEEDS_ACTION.has(row.kind))
    return { attention, history }
  }, [results])

  async function markAllRead() {
    // Only the history band. The attention band survives by design — see the
    // note above; marking read is a reading gesture, not a resolution.
    await Promise.all(
      history
        .filter((row) => row.readAt === undefined)
        .map((row) => markRead({ notificationId: row._id }))
    )
  }

  if (status !== "LoadingFirstPage" && results.length === 0) {
    return (
      <View className="px-gutter flex-1 bg-background pt-6">
        <Text variant="screenTitle" className="mb-header">
          {t.title}
        </Text>
        <EmptyState icon={BellOff} title={t.empty} subtitle={t.emptyBody} />
      </View>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-6"
    >
      <View className="mb-header flex-row items-center justify-between">
        <Text variant="screenTitle">{t.title}</Text>
        {history.some((row) => row.readAt === undefined) ? (
          <Pressable
            onPress={() => void markAllRead()}
            accessibilityRole="button"
            className="px-2 py-1"
          >
            <Text variant="metaSm" className="text-terracotta-700">
              {t.markAllRead}
            </Text>
          </Pressable>
        ) : null}
      </View>

      {attention.length > 0 ? (
        <View className="mb-header gap-2">
          <Text variant="sectionLabel">{t.needsAttention}</Text>
          {attention.map((row) => (
            <AlertBanner
              key={row._id}
              variant="security"
              title={titleFor(row.kind, row.payload, t)}
              description={bodyFor(row.kind, t)}
              actions={actionsFor(row.kind, t)}
            />
          ))}
        </View>
      ) : null}

      {history.length > 0 ? (
        <View className="gap-1">
          <Text variant="sectionLabel" className="mb-2">
            {t.history}
          </Text>
          {history.map((row, index) => (
            <AuditRow
              key={row._id}
              icon={iconFor(row.kind)}
              event={titleFor(row.kind, row.payload, t)}
              meta={fmtDate(new Date(row._creationTime), locale)}
              tone={row.readAt === undefined ? "terracotta" : "sand"}
              divider={index < history.length - 1}
            />
          ))}
        </View>
      ) : null}

      {status === "CanLoadMore" ? (
        <Button
          variant="outline"
          className="mt-6"
          onPress={() => loadMore(30)}
        >
          <Text>{t.history}</Text>
        </Button>
      ) : null}
    </ScrollView>
  )
}

function titleFor(
  kind: string,
  payload: Record<string, string | number | boolean | null>,
  t: Record<string, string>
): string {
  switch (kind) {
    case "recovery.attempted":
      return t.recoveryAttempt!
    case "checkin.due":
      return t.checkinDue!
    case "guardian.accepted":
      return t.guardianAccepted!.replace(
        "{name}",
        typeof payload.name === "string" ? payload.name : ""
      )
    // Claims appear as history only. The interrupt is a screen, never a row.
    case "claim.submitted":
      return t.claimSubmitted!
    case "claim.blocked_by_lockout":
      return t.claimBlocked!
    case "claim.vetoed":
      return t.claimVetoed!
    case "release.bundles_rebuilt":
      return t.bundlesRebuilt!
    default:
      return t.generic!
  }
}

/**
 * Body copy for the attention band. Total rather than partial because
 * `AlertBanner` requires a description — and only `NEEDS_ACTION` kinds reach
 * here, so the fallback is unreachable today and exists to stay honest if that
 * set grows.
 */
function bodyFor(kind: string, t: Record<string, string>): string {
  if (kind === "recovery.attempted") return t.recoveryAttemptBody!
  if (kind === "checkin.due") return t.checkinDueBody!
  return t.generic!
}

function actionsFor(kind: string, t: Record<string, string>): React.ReactNode {
  if (kind === "checkin.due") {
    return (
      <Button size="sm" onPress={() => router.push("/protection/checkin")}>
        <Text>{t.openCheckin}</Text>
      </Button>
    )
  }
  if (kind === "recovery.attempted") {
    // "Wasn't me" navigates rather than acting inline: a recovery attempt is
    // answered by rotating the sheet and reviewing the guardian, not by a
    // button on a list row. The Protection Centre used to hold both; the
    // guardian is the actionable half and now lives on the plan tab.
    return (
      <Button size="sm" onPress={() => router.push("/protection/guardian")}>
        <Text>{t.wasntMe}</Text>
      </Button>
    )
  }
  return undefined
}

function iconFor(kind: string) {
  if (kind.startsWith("guardian")) return ShieldCheck
  if (kind.startsWith("claim")) return Users
  return KeyRound
}
