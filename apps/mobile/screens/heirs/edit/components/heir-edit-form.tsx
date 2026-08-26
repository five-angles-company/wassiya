import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { router } from "expo-router"
import { Pressable } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { HeirFields } from "@/screens/heirs/components/heir-fields"
import { DeleteHeirSheet } from "@/screens/heirs/edit/components/delete-heir-sheet"
import { useHeirForm } from "@/screens/heirs/use-heir-form"

/** The loaded half of ٥.٢b — mounts only once the heir's real values exist. */
export type HeirEditFormProps = {
  heir: {
    id: Id<"heirs">
    name: string
    relation: string
    phone: string
    mode: "silent" | "notified"
    routedAssetCount: number
  }
}

export function HeirEditForm({ heir }: HeirEditFormProps) {
  const { t } = useStrings("heirs/edit")
  // The fields are ٥.٢'s, labels included — an edit form *is* the add form.
  const { t: fields } = useStrings("heirs/new")
  const { t: common } = useStrings("common")

  const update = useMutation(api.heirs.update)
  const form = useHeirForm(heir, heir.id)

  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function save() {
    if (!form.canSubmit || !form.dirty) return
    setSaving(true)
    setFailed(false)
    try {
      await update({ heirId: heir.id, ...form.values })
      router.back()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen keyboard contentClassName="gap-header">
      <BackButton label={common.back} />
      <Text variant="screenTitle">{t.title}</Text>

      <HeirFields
        form={form}
        t={fields}
        error={failed ? t.failed : undefined}
      />

      {/* Save appears only once something changed — the same rule the asset
          edit screen uses. A permanently-lit Save on an unedited form invites
          a write that would do nothing but stamp the audit log. */}
      {form.dirty ? (
        <PrimaryCta
          label={t.save!}
          onPress={() => void save()}
          disabled={!form.canSubmit}
          busy={saving}
        />
      ) : null}

      {/* Quiet, surface-toned, the same height as a row — deleting is
          available, never suggested. Matches the asset edit screen exactly. */}
      <Pressable
        accessibilityRole="button"
        onPress={() => setConfirming(true)}
        className="bg-card mb-auto h-[50px] items-center justify-center rounded-full active:opacity-80"
      >
        <Text className="text-[15.5px] opacity-55">{t.deleteHeir}</Text>
      </Pressable>

      <DeleteHeirSheet
        heirId={heir.id}
        name={heir.name}
        routedAssetCount={heir.routedAssetCount}
        open={confirming}
        onClose={() => setConfirming(false)}
      />
    </Screen>
  )
}
