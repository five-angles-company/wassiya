/**
 * ٣.٢ — شاشة القفل.
 *
 * ## The blur is a real render, never a screenshot
 *
 * The board is specific: *"Blur is a real render of the last screen behind a
 * 55% ground scrim — never a stale screenshot, and FLAG_SECURE keeps it out of
 * the recents thumbnail."* That distinction is a security property, not a
 * fidelity one. A cached screenshot of a vault screen is a plaintext image of
 * secret material sitting in app storage; a live render behind a scrim is the
 * same tree that was already on screen, drawn dimmer.
 *
 * This screen therefore renders **as an overlay over whatever was already
 * mounted** rather than as a route that replaces it — which is why it is a
 * component the tabs layout draws on top, not a `/lock` page. Navigating to a
 * lock route would unmount the screen behind it and there would be nothing left
 * to blur.
 *
 * `useSecureScreen` covers the recents thumbnail while it is up.
 *
 * ## Two exits, and only two
 *
 * A fingerprint, or the recovery sheet. There is deliberately no passcode
 * fallback: the device passcode is something a person holding the phone may
 * also know, and the vault key is bound to biometrics in the keystore anyway —
 * offering a passcode would promise an unlock the keystore cannot perform.
 *
 * `VaultKeyLostError` is the third outcome and is not a failure to retry:
 * changed biometrics invalidate the key permanently, and only the recovery
 * ceremony helps. `useVaultGate` already routes that case, so this screen only
 * has to say so.
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
import { AUTO_LOCK_MS, useVault } from "@/stores/vault"

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
  useSecureScreen("lock")

  const keyLost = status === "lost"

  return (
    <View
      // `absoluteFill` over the mounted tree, not a route. The scrim is the
      // board's 55% ground; the screen underneath keeps rendering and is simply
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

      {!keyLost ? (
        <Text variant="metaSm" className="text-muted-foreground mt-4">
          {t.autoLocked.replace(
            "{n}",
            fmtNum(Math.round(AUTO_LOCK_MS / 60_000), locale)
          )}
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
