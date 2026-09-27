/**
 * ٩.٣ — سجل النشاط.
 *
 * The screen the whole `auditLog` design exists for. `convex/audit.ts` has no
 * update or delete path anywhere in the deployment and greps for their absence
 * in CI — so "append-only" is a property the code enforces, not a promise the
 * copy makes, and the intro says so plainly because an audit log nobody trusts
 * is decoration.
 *
 * Every secret reveal on 4.9 writes a line here. That is the pairing that makes
 * the stamp under the reveal button mean something: the owner can see not just
 * *when* content was last shown but the whole history of it being shown.
 */
import { usePaginatedQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { AuditRow } from "@workspace/ui-native/components/wassiya/audit-row"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { fmtDate, fmtTime } from "@workspace/ui-native/lib/format"
import { Eye, FileText, KeyRound, ScrollText, ShieldCheck, Users } from "lucide-react-native"
import { View } from "react-native"

import { LoadMore } from "@/components/load-more"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"

/** Events that are security-relevant get the terracotta tone, not olive. */
const SECURITY_EVENTS = new Set([
  "asset.revealed",
  "keyring.rotated",
  "device.revoked",
  "claim.submitted",
  "claim.blocked_by_lockout",
  // A spent sheet and a newly printed executor sheet are the rows that say so
  // if the owner did not do it.
  "keyring.paper_used",
  "executor.sheet_printed",
  "claim.released",
])

export function AuditScreen() {
  const { t, locale } = useStrings("settings/audit")
  const { results, status, loadMore } = usePaginatedQuery(
    api.audit.list,
    {},
    { initialNumItems: 40 }
  )

  return (
    <Screen>
      <ScreenHeader back title={t.title!} description={t.intro} />

      {status !== "LoadingFirstPage" && results.length === 0 ? (
        <EmptyState icon={ScrollText} title={t.empty!} />
      ) : (
        <View className="rounded-card bg-card overflow-hidden">
          {results.map((row, index) => (
            <AuditRow
              key={row._id}
              icon={iconFor(row.event)}
              event={labelFor(row.event, t)}
              meta={`${fmtDate(new Date(row.at), locale)} · ${fmtTime(new Date(row.at), locale)}`}
              tone={SECURITY_EVENTS.has(row.event) ? "terracotta" : "olive"}
              divider={index < results.length - 1}
            />
          ))}
        </View>
      )}

      {status === "CanLoadMore" ? (
        <LoadMore className="mt-2" label={t.loadMore!} onPress={() => loadMore(40)} />
      ) : null}
    </Screen>
  )
}

function labelFor(event: string, t: Record<string, string>): string {
  const map: Record<string, string> = {
    "asset.created": t.assetCreated!,
    "asset.updated": t.assetUpdated!,
    "asset.removed": t.assetRemoved!,
    "asset.revealed": t.assetRevealed!,
    "keyring.created": t.keyringCreated!,
    "keyring.rotated": t.keyringRotated!,
    "keyring.release_key_set": t.releaseKeySet!,
    "asset.handover_changed": t.handoverChanged!,
    "executor.added": t.executorAdded!,
    "executor.updated": t.executorUpdated!,
    "executor.removed": t.executorRemoved!,
    "executor.sheet_printed": t.executorSheetPrinted!,
    "executor.check_confirmed": t.executorsChecked!,
    "checkin.confirmed": t.checkinConfirmed!,
    "claim.submitted": t.claimSubmitted!,
    "claim.vetoed": t.claimVetoed!,
    "device.registered": t.deviceRegistered!,
    "device.revoked": t.deviceRevoked!,
    "profile.saved": t.profileSaved!,
    "keyring.paper_printed": t.paperPrinted!,
    "keyring.paper_used": t.paperUsed!,
    "claim.certificate_attached": t.claimCertificate!,
    "claim.name_match_set": t.claimNameMatch!,
    "claim.released": t.claimReleased!,
    "release.delivery_opened": t.deliveryOpened!,
    "checkin.configured": t.checkinConfigured!,
    "checkin.snoozed": t.checkinSnoozed!,
    "checkin.escalated": t.checkinEscalated!,
    "identity.session_started": t.identityStarted!,
    "identity.webhook": t.identityResult!,
    "billing.plan_set": t.planSet!,
  }
  return map[event] ?? t.generic!
}

function iconFor(event: string) {
  if (event === "asset.revealed") return Eye
  if (event.startsWith("asset")) return FileText
  if (event.startsWith("keyring")) return ShieldCheck
  if (event.startsWith("executor") || event.startsWith("claim")) return Users
  return KeyRound
}
