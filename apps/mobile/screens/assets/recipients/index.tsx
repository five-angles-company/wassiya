/**
 * ٥.٣b — who receives one asset.
 *
 * This is the screen that makes every "بلا مستلم" badge in the product
 * actionable, and the board is precise about what it is modelling:
 *
 * > *"Cryptographically this is per-recipient key wrapping, one wrapped copy
 * > per selected heir — so the picker's real output is a list of key envelopes,
 * > not a ratio."*
 *
 * Hence a multi-select and no numbers anywhere. Every selected recipient
 * receives the asset **whole**, because a seed phrase cannot be divided and
 * neither can a deed. How the value is later split is the fara'id's business.
 *
 * The executor is a **distinct capability**, not another heir: instructions and
 * handover steps without the payload. That is what an executor actually needs,
 * and giving them a key envelope would hand the person administering the estate
 * the contents of it.
 *
 * Zero recipients is allowed and is never silently accepted — it surfaces amber
 * on 4.1, 4.9 and 5.1, which is exactly what those screens are for.
 */
import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { RecipientPickerRow } from "@workspace/ui-native/components/wassiya/recipient-picker-row"
import { router, useLocalSearchParams } from "expo-router"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"

type Selection = {
  selected: Set<string>
  executor: boolean
  allHeirs: boolean
}

/** Stable identity, so an unanswered query does not rebuild the row list. */
const EMPTY_SET: Set<string> = new Set()

export function AssetRecipientsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const assetId = id as Id<"assets">
  const { t, locale } = useStrings("will/routing")

  const heirs = useQuery(api.heirs.list)
  const current = useQuery(api.routing.forAsset, { assetId })
  const setRecipients = useMutation(api.routing.setRecipients)

  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  /**
   * The user's edits, or null while they have not touched anything.
   *
   * Derived-with-override rather than seeded-in-an-effect. Copying the query
   * into state from a `useEffect` means a render where the toggles are wrong,
   * a second render to correct them, and a standing risk that a later query
   * push overwrites edits mid-tap. Here the server's answer *is* the value
   * until the first toggle, and the user's own state takes over from then on.
   */
  const [edits, setEdits] = useState<Selection | null>(null)

  const fromServer = useMemo((): Selection | null => {
    if (current === undefined) return null
    return {
      selected: new Set(
        current.flatMap((row) =>
          row.recipient.kind === "heir" ? [row.recipient.heirId as string] : []
        )
      ),
      executor: current.some((row) => row.recipient.kind === "executor"),
      allHeirs: current.some((row) => row.recipient.kind === "allHeirs"),
    }
  }, [current])

  const value = edits ?? fromServer
  const selected = value?.selected ?? EMPTY_SET
  const executor = value?.executor ?? false
  const allHeirs = value?.allHeirs ?? false
  // Nothing to save until the query has answered — saving `fromServer === null`
  // would clear the asset's routing on a slow connection.
  const ready = value !== null

  function edit(patch: Partial<Selection>) {
    setEdits({ selected, executor, allHeirs, ...patch })
  }

  function toggle(heirId: string) {
    const next = new Set(selected)
    if (next.has(heirId)) next.delete(heirId)
    else next.add(heirId)
    edit({ selected: next })
  }

  async function save() {
    setSaving(true)
    setFailed(false)
    try {
      await setRecipients({
        assetId,
        recipients: [
          // "All heirs jointly" is one edge, not one per heir — adding an heir
          // later picks it up without rewriting every routing row.
          ...(allHeirs
            ? [{ recipient: { kind: "allHeirs" as const } }]
            : [...selected].map((heirId) => ({
                recipient: {
                  kind: "heir" as const,
                  heirId: heirId as Id<"heirs">,
                },
              }))),
          ...(executor ? [{ recipient: { kind: "executor" as const } }] : []),
        ],
      })
      router.back()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Screen
      inset="footer"
      footer={
        <Button onPress={() => void save()} disabled={saving || !ready}>
          <Text>{saving ? t.saving : t.saveRecipients}</Text>
        </Button>
      }
    >
      <ScreenHeader title={t.recipientsTitle} back="/assets" />

      {heirs !== undefined && heirs.length === 0 ? (
        <AlertBanner variant="security" description={t.noHeirs} />
      ) : null}

      <View className="gap-row">
        {/* The joint bucket first. Selecting it supersedes the individual
            picks rather than adding to them — "all heirs" and "these three
            heirs" are two different edges, and storing both would produce a
            duplicate envelope for anyone in the list. */}
        <RecipientPickerRow
          kind="allHeirs"
          name={t.allHeirs}
          selected={allHeirs}
          onToggle={() => edit({ allHeirs: !allHeirs })}
          locale={locale}
        />

        {!allHeirs
          ? (heirs ?? []).map((heir) => (
              <RecipientPickerRow
                key={heir.id}
                kind="heir"
                name={heir.name}
                detail={heir.relation}
                selected={selected.has(heir.id)}
                onToggle={() => toggle(heir.id)}
                locale={locale}
              />
            ))
          : null}

        <RecipientPickerRow
          kind="executor"
          name={t.executor}
          detail={t.executorNote}
          selected={executor}
          onToggle={() => edit({ executor: !executor })}
          locale={locale}
        />
      </View>

      <Text
        variant="footnote" className="mt-4"
      >
        {t.wholeAssetNote}
      </Text>

      {/* Saved routing is not yet deliverable routing. Said here rather than
          left to be inferred from a screen that says "حفظ". */}
      <Text variant="footnote" className="mt-3">
        {t.pendingBundles}
      </Text>

      {failed ? (
        <Text variant="meta" className="text-terracotta-800 mt-3">
          {t.saveFailed}
        </Text>
      ) : null}
    </Screen>
  )
}
