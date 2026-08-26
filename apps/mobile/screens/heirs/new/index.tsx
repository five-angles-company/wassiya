/**
 * ٥.٢ — adding an heir.
 *
 * Almost nothing lives here any more: the fields are {@link HeirFields} and the
 * rules are {@link useHeirForm}, both shared with the edit screen. What is left
 * is the one thing add does that edit does not — call `heirs.add` and leave.
 *
 * **Silent is the default**, and that default is set here rather than inside
 * the shared hook, because it is a statement about *new* heirs only: notifying
 * someone that they are in your will is a social act with consequences in a
 * family, and the app must not perform it on the owner's behalf by
 * pre-selecting it. An edit opens on whatever the owner already chose.
 */
import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { router } from "expo-router"

import { useStrings } from "@/i18n/use-strings"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { HeirFields } from "@/screens/heirs/components/heir-fields"
import { useHeirForm } from "@/screens/heirs/use-heir-form"

export function NewHeirScreen() {
  const { t } = useStrings("heirs/new")
  const add = useMutation(api.heirs.add)
  const form = useHeirForm({ name: "", relation: "", phone: "", mode: "silent" })

  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  async function save() {
    if (!form.canSubmit) return
    setSaving(true)
    setFailed(false)
    try {
      await add(form.values)
      router.back()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <WizardFrame
      title={t.title}
      step={1}
      stepCount={1}
      canSubmit={form.canSubmit}
      submitting={saving}
      onSubmit={() => void save()}
    >
      <HeirFields form={form} t={t} error={failed ? t.failed : undefined} />
    </WizardFrame>
  )
}
