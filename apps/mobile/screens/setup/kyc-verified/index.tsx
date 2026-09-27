import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { fmtDate, fmtTime } from "@workspace/ui-native/lib/format"
import { Redirect, router } from "expo-router"

import { View } from "react-native"

import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"

/**
 * 2.1c — identity confirmed.
 *
 * The name on this card is `identityVerifiedName`, written only by the Didit
 * webhook and settable by no client. That is deliberate: it is the string a
 * death certificate is matched against at claim time, so where it disagrees
 * with the name typed on 1.3, the verified one is the one that counts — here,
 * on the recovery sheet, and in the claim funnel.
 *
 * The step meter turning olive is the only place in the flow the bar changes
 * colour. It marks a step *completed*, not merely reached.
 */
export function KycVerifiedScreen() {
  const { t, locale } = useStrings("setup/kyc/verified")
  const { t: common } = useStrings("common")
  const status = useQuery(api.identity.status)

  if (status === undefined) return <LoadingScreen />

  if (status === null || status.status !== "verified") {
    return <Redirect href="/" />
  }

  const verifiedAt =
    status.verifiedAt === null ? null : new Date(status.verifiedAt)

  return (
    <Screen
      inset="flow"
      footer={<PrimaryCta label={t.cta!} onPress={() => router.replace("/setup/explainer")} />}
    >
      <SetupStepMeter
        step={SETUP_STEP_INDEX.kyc}
        complete
        locale={locale}
        separator={common.stepSeparator}
        className="mb-6"
      />

      <ScreenHeader title={t.title!} description={t.body} />

      <View className="rounded-summary gap-3.5 bg-card p-5">
        <Row label={t.verifiedName} value={status.verifiedName ?? "—"} />
        <View className="h-px bg-border" />
        <Row label={t.document} value={documentLabel(status.docType, t)} />
        {verifiedAt === null ? null : (
          <>
            <View className="h-px bg-border" />
            <Row
              label={t.verifiedAt}
              value={`${fmtDate(verifiedAt, locale)} · ${fmtTime(verifiedAt, locale)}`}
            />
          </>
        )}
      </View>
    </Screen>
  )
}

/**
 * Didit reports a machine string (`national_id`, `PASSPORT`, …). Anything
 * unrecognised falls back to a generic localised phrase rather than the raw
 * token — an English snake_case word in an Arabic summary card reads as a bug,
 * and this card's whole job is to look like a record the user can trust.
 */
function documentLabel(
  docType: string | null,
  t: Record<string, string>
): string {
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

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-baseline justify-between gap-3">
      <Text variant="metaSm">{label}</Text>
      <Text className="text-notice font-body-semibold shrink text-end">
        {value}
      </Text>
    </View>
  )
}
