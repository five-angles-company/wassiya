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
import { useLocalSearchParams } from "expo-router"

import { LoadingScreen } from "@/components/loading-screen"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"
import { ExecutorEditForm } from "@/screens/executors/edit/components/executor-edit-form"

export function ExecutorEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useStrings("executors/edit")

  const executors = useQuery(api.executors.list)
  const executor = executors?.find((row) => row.id === (id as Id<"executors">))

  if (executors === undefined) return <LoadingScreen back="/executors" />

  // Loaded without this id: deleted from another device.
  if (executor === undefined) {
    return (
      <Screen>
        <ScreenHeader
          back="/executors"
          title={t.title!}
          description={t.notFound}
        />
      </Screen>
    )
  }

  return (
    <ExecutorEditForm executor={executor} isOnly={executors?.length === 1} />
  )
}
