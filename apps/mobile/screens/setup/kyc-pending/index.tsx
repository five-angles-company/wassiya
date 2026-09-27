import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { Redirect, router } from "expo-router"
import { ScanFace } from "lucide-react-native"
import { View } from "react-native"

import { CenteredNote } from "@/components/centered-note"
import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { identityRetriesExhausted, SETUP_STEP_INDEX } from "@/lib/setup-flow"

/**
 * 2.1b — the identity check, from waiting to its verdict, on one screen.
 *
 * **This screen does not poll.** `identity.status` is a Convex query, so the
 * HMAC-verified webhook's write pushes the verdict down.
 *
 * ⚠️ The waiting line names the checks and never ticks them: Didit returns one
 * verdict and no sub-steps, so the app cannot know that any single check has
 * passed.
 *
 * The verified name shown here is `identityVerifiedName`, written only by the
 * webhook — the string a death certificate is later matched against.
 */
export function KycPendingScreen() {
  const { t, locale } = useStrings("setup/kyc/pending")
  const { t: verified } = useStrings("setup/kyc/verified")
  const { t: common } = useStrings("common")
  const status = useQuery(api.identity.status)

  if (status === undefined) return <LoadingScreen />
  if (status === null) return <Redirect href="/" />

  const isVerified = status.status === "verified"
  const rejected = status.status === "rejected"
  const exhausted = identityRetriesExhausted(status.attempts)

  const footer = isVerified ? (
    <PrimaryCta label={verified.cta!} onPress={() => router.replace("/setup/biometrics")} />
  ) : !rejected ? undefined : exhausted ? (
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
        complete={isVerified}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-6"
      />

      {isVerified ? (
        <>
          <ScreenHeader title={verified.title!} description={verified.body} />
          <View className="rounded-card bg-card overflow-hidden">
            <SettingsRow
              label={verified.verifiedName!}
              value={status.verifiedName ?? "—"}
              divider
            />
            <SettingsRow label={verified.document!} value={documentLabel(status.docType, verified)} />
          </View>
        </>
      ) : rejected && exhausted ? (
        <ScreenHeader title={t.supportTitle!} description={t.supportBody} />
      ) : rejected ? (
        <>
          <ScreenHeader title={t.rejectedTitle!} description={t.rejectedBody} />
          <Text variant="meta">
            {`${t.attemptsLeft}: ${fmtNum(status.attemptsRemaining, locale)}`}
          </Text>
        </>
      ) : (
        <>
          <ScreenHeader title={t.title!} description={t.body} />
          <CenteredNote icon={ScanFace} body={t.checksLine!} />
        </>
      )}
    </Screen>
  )
}

/**
 * Didit reports a machine string (`national_id`, `PASSPORT`, …); an English
 * snake_case token in an Arabic summary reads as a bug, so anything
 * unrecognised becomes a generic phrase.
 */
function documentLabel(docType: string | null, t: Record<string, string>): string {
  if (docType === null) return "—"
  switch (docType.toLowerCase().replace(/[\s-]/g, "_")) {
    case "national_id":
    case "id_card":
    case "identity_card":
      return t.docNationalId!
    case "passport":
      return t.docPassport!
    case "residence_permit":
    case "iqama":
      return t.docResidencePermit!
    case "driving_license":
    case "drivers_license":
      return t.docDrivingLicense!
    default:
      return t.docOther!
  }
}
