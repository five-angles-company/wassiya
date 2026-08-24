/**
 * Blocks screenshots and screen recording for as long as a screen is focused.
 *
 * 4.3 lists this first among its protections, and it is not decoration: a seed
 * phrase revealed for its ten-second peek is exactly the moment a screenshot is
 * worth taking, and on Android a screenshot lands in the gallery — which for
 * most people is synced to a cloud album within seconds. That single step moves
 * an unencrypted seed phrase off the device and into an account protected by a
 * password, which is the whole threat model this product is built against.
 *
 * `expo-screen-capture` sets `FLAG_SECURE` on Android (blocks the screenshot
 * outright and blanks the app in the recents switcher) and, on iOS, cannot
 * block a screenshot at all — Apple provides no API for it. There it prevents
 * *recording* and mirroring only. That asymmetry is worth knowing rather than
 * assuming: the safety chip this screen shows is honest on Android and
 * optimistic on iOS.
 *
 * Scoped to focus rather than mount, so backgrounding the wizard and returning
 * re-arms it, and leaving the screen releases it — a permanently secure app
 * would blank every screenshot the user legitimately wants to take elsewhere.
 */
import { useCallback } from "react"
import { useFocusEffect } from "expo-router"
import {
  preventScreenCaptureAsync,
  allowScreenCaptureAsync,
} from "expo-screen-capture"

/** Distinct per screen, so releasing one does not unblock another. */
export function useSecureScreen(tag: string): void {
  useFocusEffect(
    useCallback(() => {
      void preventScreenCaptureAsync(tag)
      return () => {
        void allowScreenCaptureAsync(tag)
      }
    }, [tag])
  )
}
