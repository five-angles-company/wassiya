/**
 * The single confirmation path in the product.
 *
 * ## Why this is a hook and not two copies
 *
 * Confirming life is the one action in Wassiya that must never be possible
 * without a fingerprint. Previously the gate lived inline in the check-in
 * screen; the owner has since asked for the confirm to live on Home, where the
 * action actually belongs. Rather than write the gate twice — which is exactly
 * how one copy eventually loses its `disableDeviceFallback` — it moves here and
 * the screen calls it.
 *
 * **The affordance is still in exactly one place.** It moved from the prompt
 * screen to the Home hero; it was not added alongside it. `screens/protection/
 * checkin` now configures the switch and reports its state, and no longer
 * offers a confirm.
 *
 * ## The contract
 *
 * Returns `false` for anything other than a successful biometric, and the
 * mutation only runs after `auth.success`. There is no code path where a tap
 * alone says "still alive" — which is the whole point: an unlocked phone in the
 * wrong hands must not be able to suppress delivery. Presence is what's being
 * proven, so `disableDeviceFallback` stays true: a device passcode is something
 * a person who has the phone may well also have.
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
