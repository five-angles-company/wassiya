import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtDate, fmtTime } from "@workspace/ui-native/lib/format"
import { Redirect, router } from "expo-router"
import { Check } from "lucide-react-native"
import { ActivityIndicator, View } from "react-native"

import { Screen } from "@/components/screen"
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

  if (status === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator />
      </View>
    )
  }

  if (status === null || status.status !== "verified") {
    return <Redirect href="/" />
  }

  const verifiedAt =
    status.verifiedAt === null ? null : new Date(status.verifiedAt)

  return (
    <Screen inset="flow">
      <SetupStepMeter
        step={SETUP_STEP_INDEX.kyc}
        complete
        locale={locale}
        separator={common.stepSeparator}
        className="mb-11"
      />

      <View className="mb-7 size-37.5 items-center justify-center self-center rounded-full bg-olive-200">
        <Icon as={Check} className="size-16.5 text-olive-800" />
      </View>

      <Text variant="screenTitle" className="mb-2.5 text-center text-[30px]">
        {t.title}
      </Text>
      <Text className="mb-6.5 text-center text-[14.5px] leading-[1.7] text-muted-foreground">
        {t.body}
      </Text>

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

      <View className="grow" />

      <Button
        className="mt-6"
        onPress={() => router.replace("/setup/explainer")}
      >
        <Text>{t.cta}</Text>
      </Button>
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
      <Text variant="metaSm" className="text-muted-foreground">
        {label}
      </Text>
      <Text className="text-notice font-body-semibold shrink text-end">
        {value}
      </Text>
    </View>
  )
}
