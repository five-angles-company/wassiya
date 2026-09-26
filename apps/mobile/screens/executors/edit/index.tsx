/**
 * ٥.٢b — editing an executor, printing their sheet again, deleting them.
 *
 * The load and the form are two components because `useExecutorForm` seeds its
 * state with `useState`, which reads its argument once: mounting the form
 * before `executors.list` resolves would latch it onto blank values.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { useLocalSearchParams } from "expo-router"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { ExecutorEditForm } from "@/screens/executors/edit/components/executor-edit-form"

export function ExecutorEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useStrings("executors/edit")
  const { t: common } = useStrings("common")

  const executors = useQuery(api.executors.list)
  const executor = executors?.find((row) => row.id === (id as Id<"executors">))

  if (executor === undefined) {
    return (
      <Screen contentClassName="gap-header">
        <BackButton label={common.back} />
        <Text variant="screenTitle">{t.title}</Text>
        {/* Loaded without this id: deleted from another device. */}
        {executors !== undefined ? (
          <Text variant="prose" className="text-muted-foreground">
            {t.notFound}
          </Text>
        ) : null}
      </Screen>
    )
  }

  return (
    <ExecutorEditForm executor={executor} isOnly={executors?.length === 1} />
  )
}
