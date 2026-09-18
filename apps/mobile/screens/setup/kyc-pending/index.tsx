import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Redirect, router } from "expo-router"
import { ActivityIndicator, View } from "react-native"

import { Screen } from "@/components/screen"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { identityRetriesExhausted, SETUP_STEP_INDEX } from "@/lib/setup-flow"
import { SubstepRow } from "@/screens/setup/kyc-pending/components/substep-row"

/**
 * 2.1b — while Didit reviews.
 *
 * **This screen does not poll.** `identity.status` is a Convex query, so the
 * client holds a subscription to it and the HMAC-verified webhook's write
 * pushes the new status down. An interval here would be redundant work that
 * arrives later than the reactive update it duplicates.
 *
 * ## ⚠️ The three rows name the checks; none of them can be ticked
 *
 * Didit returns one verdict and streams no sub-steps, so the app has no signal
 * that any individual check has passed. These rows used to be a checklist whose
 * `done` flag was `status.hasOpenSession` — which is `diditSessionId !==
 * undefined`, written by `recordSession` at the moment a session is *created*.
 * Opening the provider and closing it again therefore reported "ID document
 * received" and "liveness confirmed" to someone who had submitted nothing.
 *
 * There is no honest `done` to compute here, so there is no `done`. A verdict
 * only ever arrives as the whole status changing, and `verified` redirects off
 * this screen before any row could show it.
 */
export function KycPendingScreen() {
  const { t, locale } = useStrings("setup/kyc/pending")
  const { t: common } = useStrings("common")
  const status = useQuery(api.identity.status)

  if (status === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    )
  }

  if (status === null) return <Redirect href="/" />
  if (status.status === "verified")
    return <Redirect href="/setup/kyc/verified" />

  const rejected = status.status === "rejected"
  const exhausted = identityRetriesExhausted(status.attempts)

  return (
    <Screen inset="flow">
      <SetupStepMeter
        step={SETUP_STEP_INDEX.kyc}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-header"
      />

      {rejected ? (
        <RejectedBody
          exhausted={exhausted}
          attemptsRemaining={status.attemptsRemaining}
          locale={locale}
          t={t}
        />
      ) : (
        <>
          <Text
            variant="screenTitle"
            className="mb-2.5 text-center text-[27px]"
          >
            {t.title}
          </Text>
          <Text className="mb-6 text-center text-[14.5px] leading-[1.7] text-muted-foreground">
            {t.body}
          </Text>

          <Text variant="metaSm" className="mb-2.5 text-muted-foreground">
            {t.checksHeading}
          </Text>
          <View className="gap-row">
            <SubstepRow label={t.stepDocument} />
            <SubstepRow label={t.stepLiveness} />
            <SubstepRow label={t.stepFaceMatch} />
          </View>
        </>
      )}

      <View className="grow" />
    </Screen>
  )
}

type RejectedBodyProps = {
  exhausted: boolean
  attemptsRemaining: number
  locale: "ar" | "en"
  t: Record<string, string>
}

function RejectedBody({
  exhausted,
  attemptsRemaining,
  locale,
  t,
}: RejectedBodyProps) {
  if (exhausted) {
    return (
      <View className="gap-5">
        <Text variant="screenTitle">{t.supportTitle}</Text>
        <Text className="text-[14.5px] leading-[1.7] text-muted-foreground">
          {t.supportBody}
        </Text>
        <Button variant="outline" onPress={() => router.replace("/setup/kyc")}>
          <Text>{t.contactSupport}</Text>
        </Button>
      </View>
    )
  }

  return (
    <View className="gap-5">
      <Text variant="screenTitle">{t.rejectedTitle}</Text>
      <AlertBanner variant="security" description={t.rejectedBody} />
      <Text variant="meta" className="text-muted-foreground">
        {`${t.attemptsLeft}: ${fmtNum(attemptsRemaining, locale)}`}
      </Text>
      <Button onPress={() => router.replace("/setup/kyc")}>
        <Text>{t.tryAgain}</Text>
      </Button>
    </View>
  )
}
