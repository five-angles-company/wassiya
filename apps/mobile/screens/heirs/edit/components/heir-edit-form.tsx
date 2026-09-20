import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { FieldLink } from "@workspace/ui-native/components/wassiya/field-link"
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
    routedAssetCount: number
    hasIdNumber: boolean
    birthDate: string | null
    email: string | null
    messageKind: string | null
  }
}

export function HeirEditForm({ heir }: HeirEditFormProps) {
  const { t } = useStrings("heirs/edit")
  // The fields are ٥.٢'s, labels included — an edit form *is* the add form.
  const { t: fields } = useStrings("heirs/new")
  const { t: common } = useStrings("common")

  const update = useMutation(api.heirs.update)
  const form = useHeirForm(
    {
      ...heir,
      idNumber: "",
      email: heir.email ?? "",
      birthDate: heir.birthDate ?? "",
    },
    heir.id
  )

  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function save() {
    if (!form.canSubmit || !form.dirty) return
    setSaving(true)
    setFailed(false)
    try {
      const { idNumber, birthDate, email, ...rest } = form.values
      await update({
        heirId: heir.id,
        ...rest,
        email: email === (heir.email ?? "") ? undefined : email,
        // Only a newly typed number replaces the registered one.
        idNumber: idNumber === "" ? undefined : idNumber,
        birthDate: birthDate === (heir.birthDate ?? "") ? undefined : birthDate,
      })
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
        hasIdNumber={heir.hasIdNumber}
      />

      <FieldLink
        label={t.messageRow!}
        value={heir.messageKind === null ? "" : t.messageSet!}
        placeholder={t.messageNone}
        chevron="forward"
        onPress={() =>
          router.push({ pathname: "/heirs/[id]/message", params: { id: heir.id } })
        }
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
