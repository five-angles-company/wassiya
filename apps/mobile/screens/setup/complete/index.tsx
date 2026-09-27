import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Surface } from "@workspace/ui-native/components/wassiya/surface"
import { ProtectionScore } from "@workspace/ui-native/components/wassiya/protection-score"
import {
  ProtectionScoreList,
  type ProtectionItem,
} from "@workspace/ui-native/components/wassiya/protection-score-list"
import { router } from "expo-router"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

/**
 * 2.6 — setup complete.
 *
 * The five-item score defined here is the same object Home and the Protection
 * Centre render, so the three surfaces can never disagree about how safe the
 * vault is.
 *
 * Ranking is the point, not decoration: executors are **needed** (terracotta)
 * and the life check-in is **later** (sand). Exactly one amber item at a time
 * is what keeps the colour meaningful.
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
      id: "executors",
      label: t.executors,
      done: false,
      // Only one `needed` item may be pending at a time. An unprinted sheet
      // outranks naming an executor, which drops to `later` in that case.
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
    <Screen
      inset="flow"
      footer={
        <View className="gap-2.5">
          <PrimaryCta label={t.addExecutors!} onPress={() => router.replace("/executors")} />
          <PrimaryCta tone="quiet" label={t.addAsset!} onPress={() => router.replace("/assets")} />
        </View>
      }
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
          <Text variant="proseSm">{t.subtitle}</Text>
        </View>
      </View>

      <ProtectionScoreList className="mb-5" items={items} />

      <Surface tone="terracotta">
        <Text className="text-section text-terracotta-800 leading-[1.65]">{t.warning}</Text>
      </Surface>
    </Screen>
  )
}
