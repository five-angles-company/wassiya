/**
 * ٩.٢ — القفل التلقائي, as a sheet over the settings tab.
 *
 * A choice applies the moment it is tapped, and the sheet stays open: the note
 * under the list changes with the choice, and under "while open" it is the
 * trade itself — an unlocked phone in someone else's hand can reopen the vault.
 * An owner who never saw that sentence cannot have chosen it, so choosing must
 * not close the sheet before it is read.
 */
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { Check } from "lucide-react-native"
import type * as React from "react"
import { Pressable, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import {
  AUTO_LOCK_CHOICES,
  LOCK_WHILE_OPEN,
  usePreferences,
} from "@/stores/preferences"

/** The current window, in the words this sheet offers. */
export function autoLockLabel(
  minutes: number,
  t: Record<string, string>
): string {
  if (minutes === LOCK_WHILE_OPEN) return t.whileOpen!
  if (minutes === 1) return t.minute1!
  if (minutes === 15) return t.minute15!
  if (minutes === 60) return t.minute60!
  return t.minute5!
}

export function AutoLockSheet({
  ref,
}: {
  ref: React.RefObject<TrueSheet | null>
}) {
  const { t } = useStrings("settings/lock")
  const minutes = usePreferences((s) => s.autoLockMinutes)
  const setMinutes = usePreferences((s) => s.setAutoLockMinutes)

  return (
    <Sheet ref={ref} title={t.title} description={t.intro}>
      <View className="overflow-hidden rounded-card bg-card">
        {AUTO_LOCK_CHOICES.map((choice, index) => (
          <View key={choice}>
            <Pressable
              accessibilityRole="radio"
              accessibilityState={{ selected: choice === minutes }}
              onPress={() => setMinutes(choice)}
              className="flex-row items-center gap-3 px-4 py-3.5 active:opacity-70"
            >
              <Text variant="rowTitle" className="flex-1">
                {autoLockLabel(choice, t)}
              </Text>
              {choice === minutes ? (
                <Icon
                  as={Check}
                  size={18}
                  strokeWidth={2.75}
                  className="text-primary"
                />
              ) : null}
            </Pressable>
            {index < AUTO_LOCK_CHOICES.length - 1 ? (
              <View className="mx-4 h-px bg-border" />
            ) : null}
          </View>
        ))}
      </View>

      <Text variant="proseSm" className="mt-4">
        {minutes === LOCK_WHILE_OPEN ? t.whileOpenNote : t.capNote}
      </Text>
      <Text variant="footnote" className="mt-2">
        {t.perDevice}
      </Text>

      <PrimaryCta
        className="mt-6"
        label={t.done!}
        onPress={() => void ref.current?.dismiss()}
      />
    </Sheet>
  )
}
