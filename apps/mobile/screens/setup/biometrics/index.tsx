import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { KeyCard } from "@workspace/ui-native/components/wassiya/key-card"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import * as LocalAuthentication from "expo-local-authentication"
import { router } from "expo-router"
import { Fingerprint, Printer, Users } from "lucide-react-native"

import { useCallback, useEffect, useState } from "react"
import { Linking, Platform, View } from "react-native"

import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import {
  generateAndStoreMk,
  patchEnrolment,
  readEnrolment,
} from "@/lib/secure-vault"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"
import { thisDevice } from "@/lib/this-device"

type Availability = "checking" | "ready" | "unenrolled"

/**
 * 2.3 — the two keys, taught once, and the first one made.
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
  const { t: keys } = useStrings("setup/explainer")
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
        router.replace("/setup/recovery-kit")
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
      // value, so creating MK would happen silently and the ceremony the design
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

      const device = await thisDevice()

      await generateAndStoreMk(t.prompt)
      // MK now exists. Record that before anything that can fail on the network.
      await patchEnrolment({})

      try {
        const { deviceId } = await registerDevice(device)
        await patchEnrolment({ deviceId })
      } catch {
        // Inventory only. The key is already sealed and usable.
      }

      router.replace("/setup/recovery-kit")
    } catch {
      setError(t.failed)
    } finally {
      setBusy(false)
    }
  }

  if (availability === "checking") return <LoadingScreen />

  const unenrolled = availability === "unenrolled"

  return (
    <Screen
      inset="flow"
      footer={
        unenrolled ? (
          <View className="gap-2.5">
            <PrimaryCta label={t.openSettings!} onPress={() => void Linking.openSettings()} />
            <PrimaryCta
              tone="quiet"
              label={t.recheck!}
              onPress={() => setAttempt((n) => n + 1)}
            />
          </View>
        ) : (
          <View className="gap-3">
            {error !== null ? (
              <Text variant="meta" className="text-terracotta-800">
                {error}
              </Text>
            ) : null}
            <PrimaryCta icon={Fingerprint} label={t.cta!} onPress={() => void enrol()} busy={busy} />
          </View>
        )
      }
    >
      <SetupStepMeter
        step={SETUP_STEP_INDEX.biometrics}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-6"
      />

      {unenrolled ? (
        <ScreenHeader title={t.unenrolledTitle!} description={t.unenrolledBody} />
      ) : (
        <>
          <ScreenHeader title={keys.title!} description={t.body} />
          <View className="gap-row">
            <KeyCard icon={Fingerprint} title={keys.deviceTitle} description={keys.deviceBody} />
            <KeyCard icon={Printer} title={keys.paperTitle} description={keys.paperBody} />
            {/* Dimmed: an executor sheet is not a key to the vault. */}
            <KeyCard
              icon={Users}
              title={keys.executorsTitle}
              description={keys.executorsBody}
              pending
            />
          </View>
        </>
      )}
    </Screen>
  )
}
