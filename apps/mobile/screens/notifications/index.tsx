/**
 * ٣.٣ — الإشعارات. Two bands, never one flat feed: actionable security events
 * pin to the top with inline actions, the rest is history. A single
 * reverse-chronological list buries a recovery attempt under routine history
 * within a day.
 *
 * `NEEDS_ACTION` events stay in the top band whether or not they carry a
 * `readAt`. Marking read is a *reading* gesture and must not dismiss something
 * the owner still has to act on.
 *
 * **A death claim must never appear here as a row.** Home carries it, above
 * everything, right over the fingerprint check-in that stops it; claim events
 * map to history copy only. A claim rendered as a row has been demoted from an
 * interrupt, which is the failure that loses someone their veto window.
 */
import { useMemo } from "react"
import { usePaginatedQuery, useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { AuditRow } from "@workspace/ui-native/components/wassiya/audit-row"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { BellOff, KeyRound, Users } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { LoadMore } from "@/components/load-more"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
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
      <Screen>
        <ScreenHeader back="/home" title={t.title!} />
        <EmptyState icon={BellOff} title={t.empty!} subtitle={t.emptyBody} />
      </Screen>
    )
  }

  return (
    <Screen>
      <ScreenHeader
        back="/home"
        title={t.title!}
        trailing={
          history.some((row) => row.readAt === undefined) ? (
            <Pressable
              onPress={() => void markAllRead()}
              accessibilityRole="button"
              hitSlop={8}
            >
              <Text variant="action">{t.markAllRead}</Text>
            </Pressable>
          ) : undefined
        }
      />

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
        <View className="gap-2">
          <Text variant="sectionLabel">{t.history}</Text>
          <View className="overflow-hidden rounded-card bg-card">
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
        </View>
      ) : null}

      {status === "CanLoadMore" ? (
        <LoadMore
          className="mt-2"
          label={t.loadMore!}
          onPress={() => loadMore(30)}
        />
      ) : null}
    </Screen>
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
    // Claims appear as history only. The interrupt is a screen, never a row.
    case "claim.submitted":
      return t.claimSubmitted!
    case "claim.blocked_by_lockout":
      return t.claimBlocked!
    case "claim.vetoed":
      return t.claimVetoed!
    case "support.reply":
      return t.supportReply!
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

function actionsFor(
  kind: string,
  t: Record<string, string>
): { label: string; onPress: () => void }[] | undefined {
  if (kind === "checkin.due") {
    return [
      {
        label: t.openCheckin!,
        onPress: () => router.push("/protection/checkin"),
      },
    ]
  }
  if (kind === "recovery.attempted") {
    // Reprinting is the only thing that invalidates the sheet that was used.
    return [
      { label: t.wasntMe!, onPress: () => router.push("/setup/recovery-kit") },
    ]
  }
  return undefined
}

function iconFor(kind: string) {
  if (kind.startsWith("claim")) return Users
  return KeyRound
}
