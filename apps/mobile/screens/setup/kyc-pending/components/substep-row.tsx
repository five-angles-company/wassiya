import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { cn } from "@workspace/ui-native/lib/utils"
import { Check } from "lucide-react-native"
import { View } from "react-native"

export type SubstepRowProps = {
  label: string
  done: boolean
}

/**
 * One provider sub-step on 2.1b.
 *
 * The checklist exists so a stall is *legible*: "checking" on its own gives a
 * waiting user no way to tell a slow review from a stuck one, while three rows
 * that fill in turn show progress even when the overall verdict has not
 * arrived.
 */
export function SubstepRow({ label, done }: SubstepRowProps) {
  return (
    <View
      className={cn(
        "rounded-row flex-row items-center gap-2.75 px-4 py-3.25",
        done ? "bg-olive-100" : "bg-sand-200 opacity-75"
      )}
    >
      {done ? (
        <Icon as={Check} className="size-4.5 shrink-0 text-olive-800" />
      ) : (
        <View className="border-sand-500 size-4.5 shrink-0 rounded-full border-[2.75px]" />
      )}
      <Text
        className={cn(
          "text-section flex-1",
          done ? "text-olive-800" : "text-foreground"
        )}
      >
        {label}
      </Text>
    </View>
  )
}
