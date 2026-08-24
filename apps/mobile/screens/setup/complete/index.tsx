import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ProtectionScore } from "@workspace/ui-native/components/wassiya/protection-score"
import {
  ProtectionScoreList,
  type ProtectionItem,
} from "@workspace/ui-native/components/wassiya/protection-score-list"
import { router } from "expo-router"
import { ScrollView, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"

/**
 * 2.6 — setup complete.
 *
 * The five-item score defined here is the same object Home and the Protection
 * Centre render, so the three surfaces can never disagree about how safe the
 * vault is.
 *
 * Ranking is the point, not decoration: heirs are **needed** (terracotta) and
 * the life check-in is **later** (sand). Exactly one amber item at a time is
 * what keeps the colour meaningful — flatten them and the user has five equal
 * chores instead of one next step.
 *
 * The list has no guardian row, matching the board. That is worth knowing
 * rather than quietly fixing: until a guardian is enrolled in section ٦ the
 * printed sheet has no second key to pair with, so recovery is not yet
 * possible. Nothing on this screen claims otherwise.
 */
export function SetupCompleteScreen() {
  const { t, locale } = useStrings("setup/complete")
  const keyring = useQuery(api.keyring.get)

  const printed = keyring !== undefined && keyring?.paperPrintedAt !== null

  const items: ProtectionItem[] = [
    { id: "identity", label: t.identity, done: true },
    { id: "device", label: t.deviceKey, done: true },
    {
      id: "sheet",
      label: printed ? t.recoverySheet : t.recoverySheetPending,
      done: printed,
      priority: "needed",
      pillLabel: t.needed,
    },
    {
      id: "heirs",
      label: t.heirs,
      done: false,
      // Only one `needed` item may be pending at a time. An unprinted sheet
      // outranks adding heirs, so heirs drop to `later` in that case.
      priority: printed ? "needed" : "later",
      pillLabel: printed ? t.needed : t.later,
    },
    {
      id: "checkin",
      label: t.checkIn,
      done: false,
      priority: "later",
      pillLabel: t.later,
    },
  ]

  const earned = items.filter((item) => item.done).length

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow px-6 pb-6 pt-5.5"
    >
      <View className="mb-6 flex-row items-center gap-3.5">
        <ProtectionScore
          earned={earned}
          total={items.length}
          size="lg"
          locale={locale}
        />
        <View className="flex-1">
          <Text variant="screenTitle" className="mb-1">
            {t.title}
          </Text>
          <Text className="text-section text-muted-foreground">
            {t.subtitle}
          </Text>
        </View>
      </View>

      <ProtectionScoreList className="mb-5" items={items} />

      <View className="bg-terracotta-100 rounded-card px-4.5 py-4">
        <Text className="text-section text-terracotta-800 leading-[1.65]">
          {t.warning}
        </Text>
      </View>

      <View className="grow" />

      <View className="mt-5 gap-2.25">
        <Button onPress={() => router.replace("/heirs")}>
          <Text>{t.addHeirs}</Text>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onPress={() => router.replace("/assets")}
        >
          <Text>{t.addAsset}</Text>
        </Button>
      </View>
    </ScrollView>
  )
}
