import { ProtectionScore } from "@workspace/ui-native/components/wassiya/protection-score"
import { ProtectionScoreList } from "@workspace/ui-native/components/wassiya/protection-score-list"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { router } from "expo-router"

import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useProtectionScore } from "@/hooks/use-protection-score"
import { useStrings } from "@/i18n/use-strings"

/**
 * 2.6 — setup complete. The list is `useProtectionScore`, the same one Home
 * reads, so the two can never disagree about what is left to do. One button:
 * the first thing still missing.
 */
export function SetupCompleteScreen() {
  const { t, locale } = useStrings("setup/complete")
  const score = useProtectionScore({
    identity: t.identity!,
    key: t.deviceKey!,
    sheet: t.recoverySheet!,
    executors: t.executors!,
    delivery: t.delivery!,
    checkin: t.checkIn!,
  })

  if (score.loading) return <LoadingScreen />

  const needsExecutor = score.topGap?.id === "executors"

  return (
    <Screen
      inset="flow"
      footer={
        needsExecutor ? (
          <PrimaryCta label={t.addExecutors!} onPress={() => router.replace("/executors/new")} />
        ) : (
          <PrimaryCta label={t.openVault!} onPress={() => router.replace("/home")} />
        )
      }
    >
      <ScreenHeader
        title={t.title!}
        description={needsExecutor ? t.subtitle : undefined}
        trailing={
          <ProtectionScore earned={score.earned} total={score.total} size="lg" locale={locale} />
        }
      />
      <ProtectionScoreList
        items={score.ranked.map((item) => ({
          ...item,
          pillLabel: item.priority === "needed" ? t.needed : t.later,
        }))}
      />
    </Screen>
  )
}
