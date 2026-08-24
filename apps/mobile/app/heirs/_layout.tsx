import { Stack } from "expo-router"

/** Heir screens outside the tabs — adding one is a task you are *in*. */
export default function HeirsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
