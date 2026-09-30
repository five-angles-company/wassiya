/**
 * ٣.٣ — الإشعارات. Two bands, never one flat feed: actionable security events
 * pin to the top with inline actions, the rest is history. A single
 * reverse-chronological list buries a recovery attempt under routine history
 * within a day.
 *
 * The top band holds what is *still actionable*, judged from state, never from
 * `readAt`: marking read is a reading gesture and must not dismiss something
 * the owner still has to act on, and a band that never clears stops being read.
 *
 * **A death claim must never appear here as a row.** Home carries it, above
 * everything, right over the fingerprint check-in that stops it; claim events
 * map to history copy only. A claim rendered as a row has been demoted from an
 * interrupt, which is the failure that loses someone their veto window.
 */
import { useMemo } from "react"
import { usePaginatedQuery, useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { AuditRow } from "@workspace/ui-native/components/wassiya/audit-row"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { BellOff, Fingerprint, KeyRound, Users } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { LoadMore } from "@/components/load-more"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"

/** The ladder `checkin.sweep` writes, one kind per rung. */
const CHECKIN_REMINDERS: Record<string, string> = {
  "checkin.day0": "checkinDay0",
  "checkin.day7": "checkinDay7",
  "checkin.day14": "checkinDay14",
  "checkin.countdown": "checkinCountdown",
}

export function NotificationsScreen() {
  const { t, locale } = useStrings("notifications")
  const { results, status, loadMore } = usePaginatedQuery(
    api.notifications.list,
    {},
    { initialNumItems: 30 }
  )
  const markRead = useMutation(api.notifications.markRead)
  const checkin = useQuery(api.checkin.get)
  const keyring = useQuery(api.keyring.get)

  // Deliberately two explicit rules rather than a heuristic: a new event kind
  // should have to be *chosen* into the attention band, because the band's
  // value is entirely in how rarely it is used.
  const { attention, history } = useMemo(() => {
    // Only the newest rung of a ladder the owner has not yet answered.
    const reminder =
      checkin != null && checkin.escalationState !== "idle"
        ? results.find(
            (row) =>
              row.kind in CHECKIN_REMINDERS &&
              row._creationTime > checkin.lastConfirmedAt
          )
        : undefined
    // A used sheet stays a live key until a new one replaces it.
    const sheetStillUsed = keyring?.paperUsedAt != null
    const actionable = (row: (typeof results)[number]) =>
      row === reminder || (row.kind === "recovery.attempted" && sheetStillUsed)
    return {
      attention: results.filter(actionable),
      history: results.filter((row) => !actionable(row)),
    }
  }, [results, checkin, keyring])

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
  const rung = CHECKIN_REMINDERS[kind]
  if (rung !== undefined) return t[rung]!
  switch (kind) {
    case "recovery.attempted":
      return t.recoveryAttempt!
    // Claims appear as history only. The interrupt is a screen, never a row.
    case "claim.submitted":
      return t.claimSubmitted!
    case "claim.blocked_by_lockout":
      return t.claimBlocked!
    case "claim.vetoed":
      return t.claimVetoed!
    case "support.reply":
      return t.supportReply!
    case "account.deletion_scheduled":
      return t.deletionScheduled!
    case "account.deletion_blocked":
      return t.deletionBlocked!
    default:
      return t.generic!
  }
}

/**
 * Body copy for the attention band. Total rather than partial because
 * `AlertBanner` requires a description — only actionable kinds reach here, so
 * the fallback exists to stay honest if that set grows.
 */
function bodyFor(kind: string, t: Record<string, string>): string {
  if (kind === "recovery.attempted") return t.recoveryAttemptBody!
  if (kind in CHECKIN_REMINDERS) return t.checkinDueBody!
  return t.generic!
}

function actionsFor(
  kind: string,
  t: Record<string, string>
): { label: string; onPress: () => void }[] | undefined {
  if (kind in CHECKIN_REMINDERS) {
    return [
      {
        label: t.openCheckin!,
        onPress: () => router.push("/home"),
      },
    ]
  }
  if (kind === "recovery.attempted") {
    // Reprinting is the only thing that invalidates the sheet that was used.
    return [
      {
        label: t.wasntMe!,
        onPress: () => router.push("/settings/recovery-sheet/reissue"),
      },
    ]
  }
  return undefined
}

function iconFor(kind: string) {
  if (kind.startsWith("claim")) return Users
  if (kind in CHECKIN_REMINDERS) return Fingerprint
  return KeyRound
}
