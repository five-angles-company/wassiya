/**
 * ٥.٢b — editing an heir, and the only place one can be deleted.
 *
 * ## Why the load and the form are two components
 *
 * `useHeirForm` seeds its state with `useState`, which reads its argument
 * **once**. Mounting the form before `heirs.list` resolves would latch it onto
 * an empty heir and never recover — every field blank, over a record that is
 * fine. So this screen owns the wait and `HeirEditForm` only ever mounts with
 * real values.
 *
 * ## Reached by the pencil, not by the card
 *
 * The card opens ٥.٤ — what this person receives. That is the question an owner
 * actually has about an heir, so it keeps the big target; correcting a spelling
 * is the rarer errand and gets the small one. The owner chose that split.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { useLocalSearchParams } from "expo-router"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { HeirEditForm } from "@/screens/heirs/edit/components/heir-edit-form"

export function HeirEditScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const { t } = useStrings("heirs/edit")
  const { t: common } = useStrings("common")

  const heirs = useQuery(api.heirs.list)
  const heir = heirs?.find((row) => row.id === (id as Id<"heirs">))

  if (heir === undefined) {
    return (
      <Screen contentClassName="gap-header">
        <BackButton label={common.back} />
        <Text variant="screenTitle">{t.title}</Text>
        {/* `heirs` still loading is silence; `heirs` loaded without this id
            means it was deleted from another device while the list was open. */}
        {heirs !== undefined ? (
          <Text variant="prose" className="text-muted-foreground">
            {t.notFound}
          </Text>
        ) : null}
      </Screen>
    )
  }

  return <HeirEditForm heir={heir} />
}
