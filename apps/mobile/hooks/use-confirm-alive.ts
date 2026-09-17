/**
 * The single confirmation path in the product, and the one gate it runs behind.
 *
 * The affordance lives in exactly one place — Home's `CheckInHero`. It moved
 * there from the check-in prompt and was not duplicated;
 * `screens/protection/checkin` configures cadence and reports state only. The
 * gate is a hook rather than inline code so a second copy cannot quietly lose
 * its `disableDeviceFallback`.
 *
 * Returns `false` for anything but a successful biometric, and the mutation runs
 * only after `auth.success`: there is no path where a tap alone says "still
 * alive", because an unlocked phone in the wrong hands must not be able to
 * suppress delivery. `disableDeviceFallback` stays true — a device passcode is
 * something a person holding the phone may also know.
 */
import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import * as LocalAuthentication from "expo-local-authentication"

import { useStrings } from "@/i18n/use-strings"

export type ConfirmAlive = {
  /** Runs the biometric, then records the check-in. `false` = not recorded. */
  confirm: () => Promise<boolean>
  /** True after a declined or failed biometric, until the next attempt. */
  failed: boolean
}

export function useConfirmAlive(): ConfirmAlive {
  const { t } = useStrings("protection/checkin")
  const record = useMutation(api.checkin.confirm)
  const [failed, setFailed] = useState(false)

  async function confirm(): Promise<boolean> {
    setFailed(false)
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: t.confirmPrompt,
        disableDeviceFallback: true,
      })
      if (!auth.success) {
        setFailed(true)
        return false
      }
      await record({})
      return true
    } catch {
      setFailed(true)
      return false
    }
  }

  return { confirm, failed }
}
