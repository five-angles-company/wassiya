import { useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChipRow } from "@workspace/ui-native/components/wassiya/chip-row"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { CalendarCheck } from "lucide-react-native"
import type * as React from "react"
import { View } from "react-native"

import { useStrings } from "@/i18n/use-strings"

/** `MONTH_MS` / `DAY_MS` in convex/checkin.ts — the preview must land on the date the server will store. */
const DAY_MS = 24 * 60 * 60 * 1000
const MONTH_MS = 30 * DAY_MS

/**
 * ٦.٤'s cadence, as a sheet over Home. A sheet rather than a route because
 * pushing a whole screen to change one of two numbers takes you off the screen
 * you were reassuring yourself on.
 *
 * ⚠️ **Settings only — there is no confirm here.** The life check-in may be
 * recorded in exactly one place: Home's `CheckInHero`, behind `useConfirmAlive`'s
 * fingerprint. This sheet changes *when* you will be asked and never answers the
 * question. Do not add an "أنا بخير" here, however convenient it looks — the
 * protected property is that a tap alone can never say "still alive", and a
 * second affordance is how that gets lost.
 *
 * `checkin.configure` upserts, keeping `lastConfirmedAt` and recomputing
 * `nextDueAt`, so the same sheet serves the first setup and every change after
 * it — which is why Home's "off" state opens this too.
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
  // Read once per mount: the preview moves by days, not by milliseconds.
  const [now] = useState(() => Date.now())

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

  const from = config?.lastConfirmedAt ?? now
  const askOn = new Date(
    from + Number(cadence) * MONTH_MS + Number(grace) * DAY_MS
  )
  const unchanged = config != null && stored === `${cadence}:${grace}`

  return (
    <Sheet ref={ref} title={t.title} description={t.settingsIntro}>
      <View className="gap-5">
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

        {/* What the choices above mean in dates, as they change. */}
        <View className="flex-row gap-3 rounded-card bg-card p-4">
          <View className="size-9 shrink-0 items-center justify-center rounded-full bg-olive-100">
            <Icon
              as={CalendarCheck}
              size={18}
              strokeWidth={2.75}
              className="text-olive-800"
            />
          </View>
          <View className="flex-1 gap-1">
            <Text variant="rowTitle">
              {t.nextAsk!.replace("{date}", fmtDate(askOn, locale))}
            </Text>
            <Text variant="metaSm">{t.reminders}</Text>
          </View>
        </View>

        <PrimaryCta
          label={config == null ? t.enable! : saving ? t.saving! : t.save!}
          disabledLabel={t.unchanged}
          disabled={unchanged}
          onPress={() => void save()}
          busy={saving}
        />
      </View>
    </Sheet>
  )
}
