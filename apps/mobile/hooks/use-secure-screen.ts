/**
 * Blocks screenshots and screen recording while a screen is focused. A seed
 * phrase revealed for its ten-second peek is exactly when a screenshot is worth
 * taking, and on Android a screenshot lands in a gallery that is usually synced
 * to a cloud album within seconds — moving an unencrypted phrase into an account
 * protected by a password.
 *
 * The platforms are not symmetric: `expo-screen-capture` sets `FLAG_SECURE` on
 * Android (blocks the capture and blanks the recents thumbnail), while iOS
 * offers no API to block a screenshot at all and only recording and mirroring
 * are prevented. The safety chip is honest on Android and optimistic on iOS.
 *
 * Scoped to focus rather than mount, so returning to the wizard re-arms it and
 * leaving releases it — a permanently secure app would blank every screenshot
 * the user legitimately wants to take elsewhere.
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
