import { Platform } from "react-native"

import { getInstallId } from "@/lib/secure-vault"

/**
 * This handset as `devices` records it. Reading it persists the install id,
 * which must happen before the enrolling call so a retry after a crash finds
 * the same row instead of enrolling the phone twice.
 */
export async function thisDevice() {
  return {
    installId: await getInstallId(),
    name: Platform.OS === "ios" ? "iPhone" : "Android",
    platform: Platform.OS === "ios" ? ("ios" as const) : ("android" as const),
  }
}
