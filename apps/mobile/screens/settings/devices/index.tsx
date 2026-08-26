/**
 * The devices list.
 *
 * ## What revoking does, said on the screen
 *
 * The schema's own comment is the load-bearing one: *"revoking a row is a UX
 * and audit act, and the device's local copy of MK is what its own OS keystore
 * controls."*
 *
 * The intuition runs the other way — people expect "remove device" to reach
 * into a lost phone and wipe it — so the confirm says what it actually does
 * and, more usefully, what to do instead when a phone is genuinely gone:
 * reissue the recovery sheet and the guardian's share, which is what makes the
 * material still sitting on that phone worthless.
 *
 * Revoked rows stay in the list rather than disappearing, because the audit
 * line that records the revocation needs its subject to remain nameable.
 */
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { StatusPill } from "@workspace/ui-native/components/wassiya/status-pill"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { Smartphone } from "lucide-react-native"
import { Alert, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

export function DevicesScreen() {
  const { t, locale } = useStrings("settings/devices")
  const { t: common } = useStrings("common")
  const devices = useQuery(api.devices.list)
  const revoke = useMutation(api.devices.revoke)

  function confirmRevoke(deviceId: Id<"devices">) {
    Alert.alert(t.revokeTitle, t.revokeBody, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.revokeConfirm,
        style: "destructive",
        onPress: () => void revoke({ deviceId }),
      },
    ])
  }

  return (
    <Screen>
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mt-4">
        {t.title}
      </Text>
      <Text className="mt-3 text-[14.5px] leading-[1.75] text-muted-foreground">
        {t.intro}
      </Text>

      {devices !== undefined && devices.length === 0 ? (
        <EmptyState className="mt-10" icon={Smartphone} title={t.empty} />
      ) : (
        <View className="rounded-card bg-card mt-header overflow-hidden">
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
              onPress={
                device.revoked ? undefined : () => confirmRevoke(device.id)
              }
            />
          ))}
        </View>
      )}
    </Screen>
  )
}
