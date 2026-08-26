import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import * as LocalAuthentication from "expo-local-authentication"
import { router } from "expo-router"

import { useCallback, useEffect, useState } from "react"
import { ActivityIndicator, Linking, Platform, View } from "react-native"

import { Screen } from "@/components/screen"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import {
  generateAndStoreMk,
  getInstallId,
  patchEnrolment,
  readEnrolment,
} from "@/lib/secure-vault"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"

type Availability = "checking" | "ready" | "unenrolled"

/**
 * 2.3 — generate the master key.
 *
 * This is the moment the vault begins to exist on this device. Three things
 * about the ordering are load-bearing:
 *
 *  - **MK is never generated twice.** A second `generateMk()` would orphan the
 *    first key and everything already wrapped under it, so the keystore marker
 *    is checked before anything else and a returning user skips straight ahead.
 *
 *  - **The marker is written the instant MK is stored**, before the device is
 *    registered. Registration needs the network; if it failed after the key
 *    existed but before the marker did, the next launch would look like a fresh
 *    device and generate a second key. Marker first, inventory second.
 *
 *  - **Device registration is allowed to fail.** It is an inventory record for
 *    the settings screen, not part of the key hierarchy. Blocking the ceremony
 *    on it would trade a real security milestone for a bookkeeping one.
 */
export function BiometricsScreen() {
  const { t, locale } = useStrings("setup/biometrics")
  const { t: common } = useStrings("common")
  const registerDevice = useMutation(api.devices.register)

  const [availability, setAvailability] = useState<Availability>("checking")
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /**
   * Reads the world; sets no state. Kept pure of `setState` so the effect
   * below owns the write and can drop it if the screen has gone — the user
   * can leave while the biometric hardware is still being queried.
   */
  const probe = useCallback(async (): Promise<Availability | "enrolled"> => {
    // Already has a key. Re-entering must not re-run the ceremony.
    if ((await readEnrolment()) !== null) return "enrolled"
    const [hasHardware, isEnrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ])
    return hasHardware && isEnrolled ? "ready" : "unenrolled"
  }, [])

  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let active = true
    void probe().then((result) => {
      if (!active) return
      if (result === "enrolled") {
        router.replace("/setup/biometrics/done")
        return
      }
      setAvailability(result)
    })
    return () => {
      active = false
    }
  }, [probe, attempt])

  async function enrol() {
    setBusy(true)
    setError(null)
    try {
      // On iOS the keystore prompts only when *reading or updating* an existing
      // value, so creating MK would happen silently and the ceremony the board
      // describes would never appear. An explicit prompt supplies it there. On
      // Android every keystore operation prompts already, so adding one here
      // would show the sheet twice in a row.
      if (Platform.OS === "ios") {
        const result = await LocalAuthentication.authenticateAsync({
          promptMessage: t.prompt,
          cancelLabel: common.cancel,
        })
        if (!result.success) {
          setError(t.cancelled)
          return
        }
      }

      // Persisted before `register` so a crash between the two cannot enrol
      // this handset twice — the retry finds the same id and updates one row.
      const installId = await getInstallId()

      await generateAndStoreMk(t.prompt)
      // MK now exists. Record that before anything that can fail on the network.
      await patchEnrolment({})

      try {
        const { deviceId } = await registerDevice({
          installId,
          name: Platform.OS === "ios" ? "iPhone" : "Android",
          platform: Platform.OS === "ios" ? "ios" : "android",
        })
        await patchEnrolment({ deviceId })
      } catch {
        // Inventory only. The key is already sealed and usable.
      }

      router.replace("/setup/biometrics/done")
    } catch {
      setError(t.failed)
    } finally {
      setBusy(false)
    }
  }

  if (availability === "checking") {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    )
  }

  return (
    <Screen inset="flow">
      <SetupStepMeter
        step={SETUP_STEP_INDEX.biometrics}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-header"
      />

      {availability === "unenrolled" ? (
        <>
          <Text variant="screenTitle" className="mb-2.5 text-[28px]">
            {t.unenrolledTitle}
          </Text>
          <Text className="mb-5 text-[14.5px] leading-[1.7] text-muted-foreground">
            {t.unenrolledBody}
          </Text>
          <View className="grow" />
          <Button onPress={() => void Linking.openSettings()}>
            <Text>{t.openSettings}</Text>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="mt-2.25"
            onPress={() => setAttempt((n) => n + 1)}
          >
            <Text>{t.recheck}</Text>
          </Button>
        </>
      ) : (
        <>
          <Text variant="display" className="mb-2.5 text-[28px]">
            {t.title}
          </Text>
          <Text className="text-[14.5px] leading-[1.7] text-muted-foreground">
            {t.body}
          </Text>

          <View className="grow" />

          {error !== null ? (
            <AlertBanner
              className="mb-4"
              variant="security"
              description={error}
            />
          ) : null}

          <Button disabled={busy} onPress={() => void enrol()}>
            <Text>{t.cta}</Text>
          </Button>
        </>
      )}
    </Screen>
  )
}
