/**
 * ٦.٤ — the life check-in.
 *
 * ⚠️ **The load-bearing product rule, restated because this file is where it
 * is enforced:** confirming life is ALWAYS biometric-gated and exists in
 * exactly ONE place — this prompt. Rows, notifications and widgets may report
 * and navigate, never confirm. `AGENTS.md` says no alternate confirm affordance
 * may ever be added, and the reason is specific: an unlocked phone in the wrong
 * hands could otherwise suppress delivery forever, which is the one failure
 * this whole product exists to prevent.
 *
 * `CheckInPrompt.onConfirm` is the gate. It returns a boolean and the primitive
 * refuses to record anything on `false`, so the biometric is not advisory —
 * a declined prompt cannot check in.
 *
 * The screen has two halves because the switch has two states: not configured
 * (a cadence to choose) and running (a question to answer). They are one route
 * rather than two because "turn it on" and "confirm you're well" are the same
 * decision at different times.
 */
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { CheckInPrompt } from "@workspace/ui-native/components/wassiya/check-in-prompt"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import * as LocalAuthentication from "expo-local-authentication"
import { ScrollView, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { useStrings } from "@/i18n/use-strings"
import { OptionChips } from "@/screens/assets/new/components/option-chips"

export function CheckInScreen() {
  const { t, locale } = useStrings("protection/checkin")
  const { t: common } = useStrings("common")
  const config = useQuery(api.checkin.get)
  const configure = useMutation(api.checkin.configure)
  const confirm = useMutation(api.checkin.confirm)

  const [cadence, setCadence] = useState("6")
  const [grace, setGrace] = useState("30")
  const [saving, setSaving] = useState(false)
  const [failedBiometric, setFailedBiometric] = useState(false)

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

  /**
   * The single confirmation path in the product.
   *
   * Returning `false` on anything other than a successful biometric is the
   * whole contract — the primitive will not record a check-in without a `true`,
   * so there is no code path where a tap alone says "still alive".
   */
  async function confirmAlive(): Promise<boolean> {
    setFailedBiometric(false)
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: t.confirmPrompt,
        // No passcode fallback. A device passcode is something a person who
        // has the phone may also have; the point of this gate is presence.
        disableDeviceFallback: true,
      })
      if (!auth.success) {
        setFailedBiometric(true)
        return false
      }
      await confirm({})
      return true
    } catch {
      setFailedBiometric(true)
      return false
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-4"
    >
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
        <View className="mt-header gap-4">
          <CheckInPrompt
            // `escalationState` is the server-materialised view of overdue —
            // a query is not rerun because time passed, so a `Date.now()`
            // comparison here would be stale exactly when it matters. See the
            // note in `convex/checkin.ts`.
            state={
              failedBiometric
                ? "biometricFailed"
                : config.escalationState === "idle"
                  ? "due"
                  : "overdue"
            }
            cadence={cadenceLabel(config.cadenceMonths, t, locale)}
            lastConfirmedAt={fmtDate(new Date(config.lastConfirmedAt), locale)}
            locale={locale}
            labels={{
              confirm: t.confirm,
              snooze: t.snooze,
            }}
            onConfirm={confirmAlive}
          />

          <Text variant="metaSm" className="text-muted-foreground">
            {t.nextDue.replace(
              "{date}",
              fmtDate(new Date(config.nextDueAt), locale)
            )}
          </Text>

          {failedBiometric ? (
            <Text variant="meta" className="text-terracotta-800 leading-[1.7]">
              {t.biometricFailed}
            </Text>
          ) : null}
        </View>
      )}
    </ScrollView>
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
