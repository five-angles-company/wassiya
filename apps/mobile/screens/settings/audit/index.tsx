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
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AuditRow } from "@workspace/ui-native/components/wassiya/audit-row"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { fmtDate, fmtTime } from "@workspace/ui-native/lib/format"
import { Eye, FileText, KeyRound, ScrollText, ShieldCheck, Users } from "lucide-react-native"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

/** Events that are security-relevant get the terracotta tone, not olive. */
const SECURITY_EVENTS = new Set([
  "asset.revealed",
  "keyring.rotated",
  "keyring.guardian_attached",
  "guardian.revoked",
  "device.revoked",
  "claim.submitted",
  "claim.blocked_by_lockout",
  "release.server_share_released",
  // A spent sheet and a guardian approval are the fingerprints a recovery
  // leaves. If the owner did not do this, these are the two rows that say so.
  "keyring.paper_used",
  "guardian.recovery_approved",
  "claim.released",
])

export function AuditScreen() {
  const { t, locale } = useStrings("settings/audit")
  const { t: common } = useStrings("common")
  const { results, status, loadMore } = usePaginatedQuery(
    api.audit.list,
    {},
    { initialNumItems: 40 }
  )

  return (
    <Screen>
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mt-4">
        {t.title}
      </Text>
      <Text className="mt-3 text-[14.5px] leading-[1.75] text-muted-foreground">
        {t.intro}
      </Text>

      {status !== "LoadingFirstPage" && results.length === 0 ? (
        <EmptyState className="mt-10" icon={ScrollText} title={t.empty} />
      ) : (
        <View className="mt-header">
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
        <Button variant="outline" className="mt-6" onPress={() => loadMore(40)}>
          <Text>{t.loadMore}</Text>
        </Button>
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
    "keyring.guardian_attached": t.guardianAttached!,
    "guardian.invited": t.guardianInvited!,
    "guardian.accepted": t.guardianAccepted!,
    "guardian.revoked": t.guardianRevoked!,
    "heir.added": t.heirAdded!,
    "routing.changed": t.routingChanged!,
    "release.bundles_rebuilt": t.bundlesRebuilt!,
    "checkin.confirmed": t.checkinConfirmed!,
    "claim.submitted": t.claimSubmitted!,
    "claim.vetoed": t.claimVetoed!,
    "device.registered": t.deviceRegistered!,
    "device.revoked": t.deviceRevoked!,
    "profile.saved": t.profileSaved!,
    "keyring.paper_printed": t.paperPrinted!,
    "keyring.paper_used": t.paperUsed!,
    "guardian.recovery_approved": t.recoveryApproved!,
    "claim.heir_linked": t.claimHeirLinked!,
    "claim.certificate_attached": t.claimCertificate!,
    "claim.name_match_set": t.claimNameMatch!,
    "claim.guardian_confirmed": t.claimGuardianConfirmed!,
    "claim.released": t.claimReleased!,
    "release.server_share_released": t.serverShareReleased!,
    "release.guardian_share_handed_over": t.guardianHandedOver!,
    "checkin.configured": t.checkinConfigured!,
    "checkin.snoozed": t.checkinSnoozed!,
    "checkin.escalated": t.checkinEscalated!,
    "heir.updated": t.heirUpdated!,
    "heir.removed": t.heirRemoved!,
    "heir.message_set": t.heirMessageSet!,
    "identity.session_started": t.identityStarted!,
    "identity.webhook": t.identityResult!,
  }
  return map[event] ?? t.generic!
}

function iconFor(event: string) {
  if (event === "asset.revealed") return Eye
  if (event.startsWith("asset")) return FileText
  if (event.startsWith("guardian") || event.startsWith("keyring")) return ShieldCheck
  if (event.startsWith("heir") || event.startsWith("claim")) return Users
  return KeyRound
}
