/**
 * The devices list.
 *
 * Revoking a row is a UX and audit act; the device's local copy of MK is what
 * its own OS keystore controls. The intuition runs the other way — people expect
 * "remove device" to reach into a lost phone and wipe it — so the confirm says
 * what it actually does, and what to do instead when a phone is genuinely gone:
 * reissue the recovery sheet, which re-wraps MK under a fresh share and is what
 * makes the material still on that phone worthless.
 *
 * Revoked rows stay in the list, because the audit line recording the revocation
 * needs its subject to remain nameable.
 */
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { ConfirmSheet } from "@workspace/ui-native/components/wassiya/confirm-sheet"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { StatusPill } from "@workspace/ui-native/components/wassiya/status-pill"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { Smartphone } from "lucide-react-native"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"

export function DevicesScreen() {
  const { t, locale } = useStrings("settings/devices")
  const devices = useQuery(api.devices.list)
  const revoke = useMutation(api.devices.revoke)

  const [revoking, setRevoking] = useState<Id<"devices"> | null>(null)
  const [busy, setBusy] = useState(false)

  async function confirmRevoke(dismiss: () => Promise<void>) {
    if (revoking === null) return
    setBusy(true)
    try {
      await revoke({ deviceId: revoking })
      await dismiss()
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen>
      <ScreenHeader back title={t.title!} description={t.intro} />

      {devices !== undefined && devices.length === 0 ? (
        <EmptyState icon={Smartphone} title={t.empty!} />
      ) : (
        <View className="rounded-card bg-card overflow-hidden">
          {(devices ?? []).map((device, index) => (
            <SettingsRow
              key={device.id}
              icon={Smartphone}
              label={device.name}
              detail={
                device.lastUnlockAt === null
                  ? t.neverUnlocked
                  : t.lastUnlock.replace(
                      "{date}",
                      fmtDate(new Date(device.lastUnlockAt), locale)
                    )
              }
              accessory={
                device.revoked ? (
                  <StatusPill status="waiting">{t.revoked}</StatusPill>
                ) : undefined
              }
              quiet={device.revoked}
              divider={index < (devices?.length ?? 0) - 1}
              onPress={device.revoked ? undefined : () => setRevoking(device.id)}
            />
          ))}
        </View>
      )}

      <ConfirmSheet
        open={revoking !== null}
        onClose={() => setRevoking(null)}
        title={t.revokeTitle!}
        body={[t.revokeBody!]}
        confirmLabel={t.revokeConfirm!}
        cancelLabel={t.cancel!}
        onConfirm={(dismiss) => void confirmRevoke(dismiss)}
        busy={busy}
      />
    </Screen>
  )
}
