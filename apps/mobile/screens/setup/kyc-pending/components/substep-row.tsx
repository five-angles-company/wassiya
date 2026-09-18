import { Text } from "@workspace/ui-native/components/ui/text"
import { View } from "react-native"

export type SubstepRowProps = {
  label: string
}

/**
 * One of the checks the provider is running on 2.1b.
 *
 * ⚠️ **It has no "done" state, and must not grow one.** Didit returns a single
 * verdict and streams no sub-steps, so the app cannot know that any individual
 * check has passed. This row used to take a `done` flag driven by
 * `hasOpenSession` — true the instant a session was *created* — so opening the
 * provider and closing it again ticked "ID document received" and "liveness
 * confirmed" for someone who had done neither.
 *
 * Naming the checks is the honest version of the same reassurance: it tells a
 * waiting reader what is happening without asserting an outcome nobody has
 * reported.
 */
export function SubstepRow({ label }: SubstepRowProps) {
  return (
    <View className="rounded-row bg-sand-200 flex-row items-center gap-2.75 px-4 py-3.25">
      <View className="bg-sand-500 size-1.75 shrink-0 rounded-full" />
      <Text className="text-section flex-1">{label}</Text>
    </View>
  )
}
