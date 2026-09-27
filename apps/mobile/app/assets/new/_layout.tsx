import { Stack } from "expo-router"

/**
 * The add-asset step flows, one route per type.
 *
 * Outside `(tabs)` on purpose: a wizard is a task the user is *in*, and
 * leaving the tab bar visible would offer four ways to abandon a half-typed
 * seed phrase. `headerShown` stays false because every screen draws the
 * screen's own round back button inside its content.
 */
export default function NewAssetLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
