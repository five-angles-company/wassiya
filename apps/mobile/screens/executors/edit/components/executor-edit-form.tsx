import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { FieldLink } from "@workspace/ui-native/components/wassiya/field-link"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"
import { ExecutorFields } from "@/screens/executors/components/executor-fields"
import { DeleteExecutorSheet } from "@/screens/executors/edit/components/delete-executor-sheet"
import { useExecutorForm } from "@/screens/executors/use-executor-form"

/** The loaded half of ٥.٢b — mounts only once the executor's values exist. */
export type ExecutorEditFormProps = {
  executor: {
    id: Id<"executors">
    name: string
    phone: string
    email: string | null
    sheetVersion: number | null
    sheetPrintedAt: number | null
  }
  /** Deleting the only executor leaves the handover reaching nobody. */
  isOnly: boolean
}

export function ExecutorEditForm({ executor, isOnly }: ExecutorEditFormProps) {
  const { t, locale } = useStrings("executors/edit")
  const { t: fields } = useStrings("executors/new")

  const update = useMutation(api.executors.update)
  const form = useExecutorForm(
    {
      name: executor.name,
      phone: executor.phone,
      email: executor.email ?? "",
      idNumber: "",
    },
    { selfId: executor.id, idNumberRequired: false }
  )

  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)
  const [confirming, setConfirming] = useState(false)

  async function save() {
    if (!form.canSubmit || !form.dirty) return
    setSaving(true)
    setFailed(false)
    try {
      const { name, phone, email, idNumber } = form.values
      await update({
        executorId: executor.id,
        name,
        phone,
        email: email === (executor.email ?? "") ? undefined : email,
        // Only a newly typed number replaces the registered one.
        idNumber: idNumber === "" ? undefined : idNumber,
      })
      router.back()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const sheetLine =
    executor.sheetPrintedAt === null || executor.sheetVersion === null
      ? ""
      : t
          .sheetPrinted!.replace(
            "{date}",
            fmtDate(new Date(executor.sheetPrintedAt), locale)
          )
          .replace("{v}", fmtNum(executor.sheetVersion, locale))

  return (
    <Screen
      keyboard
      inset="footer"
      footer={
        form.dirty ? (
          <PrimaryCta
            label={t.save!}
            onPress={() => void save()}
            disabled={!form.canSubmit}
            busy={saving}
          />
        ) : undefined
      }
    >
      <ScreenHeader back="/executors" title={t.title!} />

      <View className="gap-header">
        <ExecutorFields
          form={form}
          t={fields}
          error={failed ? t.failed : undefined}
          hasIdNumber
        />

        <FieldLink
          label={t.sheetRow!}
          value={sheetLine}
          placeholder={t.sheetNone}
          chevron="forward"
          onPress={() =>
            router.push({
              pathname: "/executors/[id]/sheet",
              params: { id: executor.id },
            })
          }
        />

        {/* Quiet — deleting is available, never suggested. */}
        <PrimaryCta
          tone="quiet"
          label={t.deleteExecutor!}
          onPress={() => setConfirming(true)}
        />
      </View>

      <DeleteExecutorSheet
        executorId={executor.id}
        name={executor.name}
        isOnly={isOnly}
        open={confirming}
        onClose={() => setConfirming(false)}
      />
    </Screen>
  )
}
