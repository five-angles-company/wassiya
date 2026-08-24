import { Stack } from "expo-router"

/**
 * The six add-asset wizards (٤.٣–٤.٨).
 *
 * Outside `(tabs)` on purpose: a wizard is a task the user is *in*, and
 * leaving the tab bar visible would offer four ways to abandon a half-typed
 * seed phrase. `headerShown` stays false because every screen draws the
 * board's own round back button inside its content.
 */
export default function NewAssetLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
