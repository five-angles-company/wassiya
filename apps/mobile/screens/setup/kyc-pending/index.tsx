import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Redirect, router } from "expo-router"
import { View } from "react-native"

import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
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

  if (status === undefined) return <LoadingScreen />

  if (status === null) return <Redirect href="/" />
  if (status.status === "verified")
    return <Redirect href="/setup/kyc/verified" />

  const rejected = status.status === "rejected"
  const exhausted = identityRetriesExhausted(status.attempts)

  const footer = !rejected ? undefined : exhausted ? (
    <PrimaryCta
      label={t.contactSupport!}
      onPress={() => router.push("/settings/help/new?topic=kyc")}
    />
  ) : (
    <PrimaryCta label={t.tryAgain!} onPress={() => router.replace("/setup/kyc")} />
  )

  return (
    <Screen inset="flow" footer={footer}>
      <SetupStepMeter
        step={SETUP_STEP_INDEX.kyc}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-6"
      />

      {rejected && exhausted ? (
        <ScreenHeader title={t.supportTitle!} description={t.supportBody} />
      ) : rejected ? (
        <>
          <ScreenHeader title={t.rejectedTitle!} />
          <AlertBanner variant="security" description={t.rejectedBody} />
          <Text variant="meta" className="mt-3">
            {`${t.attemptsLeft}: ${fmtNum(status.attemptsRemaining, locale)}`}
          </Text>
        </>
      ) : (
        <>
          <ScreenHeader title={t.title!} description={t.body} />
          <Text variant="metaSm" className="mb-2.5">
            {t.checksHeading}
          </Text>
          <View className="gap-row">
            <SubstepRow label={t.stepDocument} />
            <SubstepRow label={t.stepLiveness} />
            <SubstepRow label={t.stepFaceMatch} />
          </View>
        </>
      )}
    </Screen>
  )
}
