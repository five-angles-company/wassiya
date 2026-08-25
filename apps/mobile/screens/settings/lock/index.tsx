/**
 * ٩.٢ — القفل التلقائي.
 *
 * The screen `stores/vault.ts` has been pointing at since it was written: the
 * window was a hard-coded five minutes with a comment saying this section owned
 * it. Now it does.
 *
 * ## Saying what the timer actually measures
 *
 * It is a **cap from unlock**, not an idle timer. `AUTO_LOCK_MS`'s own note
 * explains why — a real inactivity window needs a source of interaction events
 * the app does not have — and a settings screen that let someone choose "1
 * hour" while believing it meant "an hour after I stop using it" would be
 * selling a different product. So the honest sentence is on the screen, not
 * only in the source.
 *
 * Backgrounding always locks immediately regardless of this setting, which is
 * the more important half and is stated first.
 */
import { Text } from "@workspace/ui-native/components/ui/text"
import { ScrollView, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { useStrings } from "@/i18n/use-strings"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { AUTO_LOCK_CHOICES, usePreferences } from "@/stores/preferences"

export function AutoLockScreen() {
  const { t } = useStrings("settings/lock")
  const { t: common } = useStrings("common")
  const minutes = usePreferences((s) => s.autoLockMinutes)
  const setMinutes = usePreferences((s) => s.setAutoLockMinutes)

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-4"
    >
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
          label: LABEL_KEY[choice](t),
        }))}
        value={String(minutes)}
        onChange={(value) => setMinutes(Number(value))}
      />

      <View className="rounded-card bg-card mt-5 gap-1.5 p-4">
        <Text variant="metaSm" className="leading-[1.7]">
          {t.capNote}
        </Text>
        <Text variant="footnote">
          {t.perDevice}
        </Text>
      </View>
    </ScrollView>
  )
}

const LABEL_KEY: Record<number, (t: Record<string, string>) => string> = {
  1: (t) => t.minute1!,
  5: (t) => t.minute5!,
  15: (t) => t.minute15!,
  60: (t) => t.minute60!,
}
