/**
 * ٩.٢ — القفل التلقائي.
 *
 * The note under the chips changes with the choice, because the two policies are
 * true about different things. Under a duration the useful sentence is what the
 * timer measures — a **cap from unlock**, not an idle timer, and a screen that
 * let someone choose "1 hour" believing it meant "an hour after I stop using it"
 * would be selling a different product. Under "while open" there is no timer to
 * describe; the useful sentence is what an unlocked phone in someone else's hand
 * can now reach.
 */
import { Text } from "@workspace/ui-native/components/ui/text"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import {
  AUTO_LOCK_CHOICES,
  LOCK_WHILE_OPEN,
  usePreferences,
} from "@/stores/preferences"

export function AutoLockScreen() {
  const { t } = useStrings("settings/lock")
  const { t: common } = useStrings("common")
  const minutes = usePreferences((s) => s.autoLockMinutes)
  const setMinutes = usePreferences((s) => s.setAutoLockMinutes)

  const whileOpen = minutes === LOCK_WHILE_OPEN

  return (
    <Screen>
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mt-4">
        {t.title}
      </Text>
      <Text className="mt-3 text-[14.5px] leading-[1.75] text-muted-foreground">
        {t.intro}
      </Text>

      <OptionChips
        className="mt-header"
        options={AUTO_LOCK_CHOICES.map((choice) => ({
          value: String(choice),
          label: LABEL_KEY[choice]!(t),
        }))}
        value={String(minutes)}
        onChange={(value) => setMinutes(Number(value))}
      />

      <View className="rounded-card bg-card mt-5 gap-1.5 p-4">
        <Text variant="metaSm" className="leading-[1.7]">
          {whileOpen ? t.whileOpenNote : t.capNote}
        </Text>
        <Text variant="footnote">
          {t.perDevice}
        </Text>
      </View>
    </Screen>
  )
}

const LABEL_KEY: Record<number, (t: Record<string, string>) => string> = {
  [LOCK_WHILE_OPEN]: (t) => t.whileOpen!,
  1: (t) => t.minute1!,
  5: (t) => t.minute5!,
  15: (t) => t.minute15!,
  60: (t) => t.minute60!,
}
