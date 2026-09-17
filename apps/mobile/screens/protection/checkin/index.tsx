/**
 * ٦.٤ — the life check-in: cadence settings and status only.
 *
 * ⚠️ **Confirming life is always biometric-gated and exists in exactly one
 * place — Home's `CheckInHero`.** The affordance moved there at the owner's
 * request and was not duplicated, so this screen offers no confirm and no
 * second one may ever be added here. An unlocked phone in the wrong hands must
 * not be able to suppress delivery forever, and it is the fingerprint that
 * provides that, not the route. `hooks/use-confirm-alive.ts` is the single
 * implementation of the gate.
 *
 * Two halves — a cadence to choose, a status to read — on one route, because
 * "turn it on" and "confirm you're well" are the same decision at different
 * times.
 */
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { OptionChips } from "@/screens/assets/new/components/option-chips"

export function CheckInScreen() {
  const { t, locale } = useStrings("protection/checkin")
  const { t: common } = useStrings("common")
  const config = useQuery(api.checkin.get)
  const configure = useMutation(api.checkin.configure)

  const [cadence, setCadence] = useState("6")
  const [grace, setGrace] = useState("30")
  const [saving, setSaving] = useState(false)

  async function enable() {
    setSaving(true)
    try {
      await configure({
        cadenceMonths: Number(cadence),
        graceDays: Number(grace),
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen>
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mt-4">
        {t.title}
      </Text>
      <Text className="mt-3 text-[14.5px] leading-[1.7] text-muted-foreground">
        {t.intro}
      </Text>

      {config === null ? (
        <View className="mt-header gap-4">
          <AlertBanner variant="security" description={t.notConfigured} />
          <OptionChips
            label={t.cadenceLabel}
            options={[
              { value: "3", label: t.cadence3 },
              { value: "6", label: t.cadence6 },
              { value: "12", label: t.cadence12 },
            ]}
            value={cadence}
            onChange={setCadence}
          />
          <OptionChips
            label={t.graceLabel}
            options={[
              { value: "14", label: t.grace14 },
              { value: "30", label: t.grace30 },
              { value: "60", label: t.grace60 },
            ]}
            value={grace}
            onChange={setGrace}
          />
          <Button onPress={() => void enable()} disabled={saving}>
            <Text>{saving ? t.saving : t.enable}</Text>
          </Button>
        </View>
      ) : config === undefined ? null : (
        <View className="mt-header gap-3">
          {/*
            Status and settings only — **no confirm affordance lives here any
            more.** It moved to Home's hero, where the owner asked for it and
            where the action actually belongs. It was moved, not duplicated:
            there is still exactly one place in the product that can record a
            check-in, and it is still behind a fingerprint (`useConfirmAlive`).
          */}
          <View className="rounded-card bg-card gap-1.5 p-4">
            <Text variant="rowTitle">
              {cadenceLabel(config.cadenceMonths, t, locale)}
            </Text>
            <Text variant="metaSm">
              {t.lastConfirmed.replace(
                "{date}",
                fmtDate(new Date(config.lastConfirmedAt), locale)
              )}
            </Text>
            <Text variant="metaSm">
              {t.nextDue.replace(
                "{date}",
                fmtDate(new Date(config.nextDueAt), locale)
              )}
            </Text>
          </View>

          <Text variant="prose">{t.confirmOnHome}</Text>
        </View>
      )}
    </Screen>
  )
}

function cadenceLabel(
  months: number,
  t: Record<string, string>,
  locale: "ar" | "en"
): string {
  if (months === 3) return t.cadence3!
  if (months === 12) return t.cadence12!
  if (months === 6) return t.cadence6!
  return `${fmtNum(months, locale)}`
}
