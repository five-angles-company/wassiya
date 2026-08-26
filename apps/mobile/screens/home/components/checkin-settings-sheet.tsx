import { useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { fmtDate } from "@workspace/ui-native/lib/format"
import type * as React from "react"
import { View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { OptionChips } from "@/screens/assets/new/components/option-chips"

/**
 * ٦.٤'s cadence, as a sheet over Home.
 *
 * ## A sheet rather than a route
 *
 * "إعدادات النبض" sits at the bottom of Home's heartbeat card, and pushing a
 * whole screen to change one of two numbers takes you off the screen you were
 * reassuring yourself on. The sheet keeps the card behind it, which is the
 * point: you are adjusting the thing you are looking at.
 *
 * ## ⚠️ Settings only — there is no confirm here
 *
 * The life check-in may be recorded in exactly one place in this product:
 * Home's `CheckInHero`, behind `useConfirmAlive`'s fingerprint. This sheet
 * changes *when* you will be asked and never answers the question. Do not add
 * an "أنا بخير" here, however convenient it looks — the protected property is
 * that a tap alone can never say "still alive", and a second affordance is how
 * that gets lost.
 *
 * ## It configures and re-configures
 *
 * `checkin.configure` upserts: it keeps `lastConfirmedAt` and recomputes
 * `nextDueAt` from the new cadence. So the same sheet serves the first setup
 * and every change after it, which is why Home's "off" state opens this too
 * rather than pushing a different screen for the same decision.
 */
export type CheckInSettingsSheetProps = {
  ref?: React.Ref<TrueSheet>
  /** Dismisses once the save lands. */
  onSaved?: () => void
}

export function CheckInSettingsSheet({
  ref,
  onSaved,
}: CheckInSettingsSheetProps) {
  const { t, locale } = useStrings("protection/checkin")
  const config = useQuery(api.checkin.get)
  const configure = useMutation(api.checkin.configure)

  const [cadence, setCadence] = useState("6")
  const [grace, setGrace] = useState("30")
  const [saving, setSaving] = useState(false)

  /**
   * Seeded from the query once it answers.
   *
   * Adjusted during render rather than in an effect — React's own remedy for
   * "derive state from a prop that changed" — because this sheet mounts with
   * Home, long before `config` resolves and long before it is opened, so there
   * is no first render to seed lazily from. Keyed on the stored pair, so
   * reopening after a save shows what was saved rather than a stale draft.
   */
  const stored =
    config == null ? null : `${config.cadenceMonths}:${config.graceDays}`
  const [seeded, setSeeded] = useState<string | null>(null)
  if (stored !== null && stored !== seeded) {
    setSeeded(stored)
    setCadence(String(config!.cadenceMonths))
    setGrace(String(config!.graceDays))
  }

  async function save() {
    setSaving(true)
    try {
      await configure({
        cadenceMonths: Number(cadence),
        graceDays: Number(grace),
      })
      onSaved?.()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet ref={ref} title={t.settingsTitle} contentClassName="pb-7">
      <View className="gap-4">
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

        {/* Context, not controls: what the cadence currently means in dates.
            Absent before the first setup, when there is nothing to date. */}
        {config != null ? (
          <View className="rounded-card bg-card gap-1 p-4">
            <Text variant="metaSm">
              {t.lastConfirmed!.replace(
                "{date}",
                fmtDate(new Date(config.lastConfirmedAt), locale)
              )}
            </Text>
            <Text variant="metaSm">
              {t.nextDue!.replace(
                "{date}",
                fmtDate(new Date(config.nextDueAt), locale)
              )}
            </Text>
          </View>
        ) : null}

        <PrimaryCta
          label={saving ? t.saving! : t.save!}
          onPress={() => void save()}
          busy={saving}
        />
      </View>
    </Sheet>
  )
}
