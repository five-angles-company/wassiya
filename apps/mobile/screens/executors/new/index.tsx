/**
 * ٥.٢ — adding an executor. Saving goes straight to printing their sheet:
 * without one, the executor could open nothing at release.
 */
import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"

import { usePaywall } from "@/components/paywall"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"
import { planLimitOf, vaultCeilingOf } from "@/lib/plan-limit"
import { ExecutorFields } from "@/screens/executors/components/executor-fields"
import { ExecutorSteps } from "@/screens/executors/components/executor-steps"
import { useExecutorForm } from "@/screens/executors/use-executor-form"

export function NewExecutorScreen() {
  const { t, locale } = useStrings("executors/new")
  const add = useMutation(api.executors.add)
  const paywall = usePaywall()
  const form = useExecutorForm(
    { name: "", phone: "", email: "", idNumber: "" },
    { idNumberRequired: true }
  )

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function save() {
    if (!form.canSubmit) return
    setSaving(true)
    setError(null)
    try {
      const { email, ...rest } = form.values
      const executorId = await add({
        ...rest,
        email: email === "" ? undefined : email,
      })
      router.replace({
        pathname: "/executors/[id]/sheet",
        params: { id: executorId },
      })
    } catch (cause) {
      // A plan limit has a remedy, so it opens the paywall instead of turning
      // the form red.
      const limit = planLimitOf(cause)
      const ceiling = vaultCeilingOf(cause)
      if (limit !== null) {
        paywall.open(limit)
      } else if (ceiling !== null) {
        setError(t.atCeiling!.replace("{n}", fmtNum(ceiling, locale)))
      } else {
        setError(t.failed!)
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen
      keyboard
      inset="footer"
      footer={
        <PrimaryCta
          label={t.submit!}
          disabledLabel={t.submitBlocked}
          onPress={() => void save()}
          disabled={!form.canSubmit}
          busy={saving}
        />
      }
    >
      <ScreenHeader back="/executors" title={t.title!} />
      <ExecutorSteps
        className="mb-6"
        locale={locale}
        steps={[
          { label: t.step1!, body: t.step1Body! },
          { label: t.step2!, body: t.step2Body! },
          { label: t.step3!, body: t.step3Body! },
        ]}
      />
      <ExecutorFields form={form} t={t} error={error ?? undefined} />
    </Screen>
  )
}
