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
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Surface } from "@workspace/ui-native/components/wassiya/surface"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"

export function CheckInScreen() {
  const { t, locale } = useStrings("protection/checkin")
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
    <Screen
      footer={
        config === null ? (
          <PrimaryCta
            label={saving ? t.saving! : t.enable!}
            onPress={() => void enable()}
            busy={saving}
          />
        ) : undefined
      }
    >
      <ScreenHeader back title={t.title!} description={t.intro} />

      {config === null ? (
        <View className="gap-4">
          <AlertBanner variant="security" description={t.notConfigured} />
          <ChipRow
            fill
            label={t.cadenceLabel}
            options={[
              { value: "3", label: t.cadence3 },
              { value: "6", label: t.cadence6 },
              { value: "12", label: t.cadence12 },
            ]}
            value={cadence}
            onChange={setCadence}
          />
          <ChipRow
            fill
            label={t.graceLabel}
            options={[
              { value: "14", label: t.grace14 },
              { value: "30", label: t.grace30 },
              { value: "60", label: t.grace60 },
            ]}
            value={grace}
            onChange={setGrace}
          />
        </View>
      ) : config === undefined ? null : (
        <View className="gap-3">
          {/*
            Status and settings only — **no confirm affordance lives here any
            more.** It moved to Home's hero, where the owner asked for it and
            where the action actually belongs. It was moved, not duplicated:
            there is still exactly one place in the product that can record a
            check-in, and it is still behind a fingerprint (`useConfirmAlive`).
          */}
          <Surface gap="tight">
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
          </Surface>

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
