/**
 * ٣.٢ — شاشة القفل.
 *
 * The blur is a live render behind a 55% scrim, never a cached screenshot: a
 * screenshot of a vault screen is plaintext secret material sitting in app
 * storage. `useSecureScreen` keeps it out of the recents thumbnail.
 *
 * It is an overlay the tabs layout draws over a mounted page — not a `/lock`
 * route, and not built on `Screen`. Navigating to a route would unmount the
 * screen behind it, leaving nothing to blur.
 *
 * Two exits, and only two: a fingerprint, or the recovery sheet. No passcode
 * fallback — the device passcode is something a person holding the phone may
 * also know, and the vault key is bound to biometrics in the keystore anyway.
 * `VaultKeyLostError` is permanent rather than retryable; `useVaultGate`
 * already routes that case, so this screen only has to say so.
 */
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { Fingerprint } from "lucide-react-native"
import { View } from "react-native"

import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { LOCK_WHILE_OPEN, usePreferences } from "@/stores/preferences"
import { useVault } from "@/stores/vault"

export type VaultLockProps = {
  onUnlock: () => void
  /** True while the OS prompt is up. */
  busy: boolean
  /** The last attempt was declined. */
  denied?: boolean
}

export function VaultLock({ onUnlock, busy, denied = false }: VaultLockProps) {
  const { t, locale } = useStrings("lock")
  const status = useVault((s) => s.status)
  const autoLockMinutes = usePreferences((s) => s.autoLockMinutes)
  useSecureScreen("lock")

  const keyLost = status === "lost"

  return (
    <View
      // `absoluteFill` over the mounted tree, not a route. The scrim is the
      // 55% ground; the screen underneath keeps rendering and is simply
      // no longer legible.
      className="absolute inset-0 z-50 items-center justify-center bg-[color:rgba(245,234,216,0.94)] px-gutter"
    >
      <View className="bg-terracotta-200 size-24 items-center justify-center rounded-full">
        <Icon as={Fingerprint} className="text-terracotta-700 size-11" />
      </View>

      <Text variant="screenTitle" className="mt-6 text-center">
        {t.title}
      </Text>
      <Text
        variant="meta"
        className="text-muted-foreground mt-2 max-w-72 text-center leading-[1.7]"
      >
        {keyLost ? t.keyLost : denied ? t.denied : t.body}
      </Text>

      {/* Read live rather than from a constant: ٩.٢ owns this number, and the
          default policy has no number at all — under "while open" nothing
          auto-locked, so there is no elapsed window to report. */}
      {!keyLost && autoLockMinutes !== LOCK_WHILE_OPEN ? (
        <Text variant="metaSm" className="text-muted-foreground mt-4">
          {t.autoLocked.replace("{n}", fmtNum(autoLockMinutes, locale))}
        </Text>
      ) : null}

      <View className="mt-8 w-full gap-2">
        {!keyLost ? (
          <Button onPress={onUnlock} disabled={busy}>
            <Text>{busy ? t.unlocking : t.unlock}</Text>
          </Button>
        ) : null}
        {/* Always offered. It is the only exit when the key is gone, and the
            honest second option when a fingerprint will not read. */}
        <Button variant="outline" onPress={() => router.push("/recovery")}>
          <Text>{t.useRecovery}</Text>
        </Button>
      </View>
    </View>
  )
}
