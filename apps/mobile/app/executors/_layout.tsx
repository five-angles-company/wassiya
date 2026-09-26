import { Stack } from "expo-router"

/** Executor screens outside the tabs — adding one is a task you are *in*. */
export default function ExecutorsLayout() {
  return <Stack screenOptions={{ headerShown: false }} />
}
