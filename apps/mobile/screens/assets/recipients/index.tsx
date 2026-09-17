/**
 * ٥.٣b — who receives one asset, and the screen that makes every "بلا مستلم"
 * badge actionable.
 *
 * A multi-select with no numbers anywhere: *"cryptographically this is
 * per-recipient key wrapping, one wrapped copy per selected heir — so the
 * picker's real output is a list of key envelopes, not a ratio."* Every selected
 * recipient receives the asset whole, because a seed phrase cannot be divided
 * and neither can a deed. How the value is later split is the fara'id's
 * business.
 *
 * The executor is a distinct capability, not another heir: instructions and
 * handover steps without the payload. A key envelope would hand the person
 * administering the estate the contents of it.
 *
 * Zero recipients is allowed and never silently accepted — it surfaces amber on
 * 4.1, 4.9 and 5.1.
 */
import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"

import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { RecipientRow } from "@workspace/ui-native/components/wassiya/recipient-row"
import { ScreenTop } from "@workspace/ui-native/components/wassiya/screen-top"
import { router, useLocalSearchParams } from "expo-router"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { relationLabel } from "@/screens/heirs/relations"

type Selection = {
  selected: Set<string>
  executor: boolean
  allHeirs: boolean
}

/** Stable identity, so an unanswered query does not rebuild the row list. */
const EMPTY_SET: Set<string> = new Set()

export function AssetRecipientsScreen() {
  /**
   * `step` is set only by the create wizards, which hand off here as their
   * second step. Reached from an asset's detail screen to change recipients
   * later, there is no run in progress — a "٢ من ٢" meter would be inventing
   * one, and a progress bar that lies about where you are is worse than none.
   */
  const { id, step } = useLocalSearchParams<{ id: string; step?: string }>()
  const assetId = id as Id<"assets">
  const { t } = useStrings("assets/recipients")
  const { t: common } = useStrings("common")
  // Only for the eight relation labels the heir records store as English keys.
  const { t: heirFields } = useStrings("heirs/new")

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

  const people = allHeirs ? [] : (heirs ?? [])

  return (
    <Screen>
      <ScreenTop
        backLabel={common.back}
        onBack={() => (router.canGoBack() ? router.back() : router.replace("/assets"))}
        className="mb-6"
      />

      <Text className="font-heading-extrabold text-foreground mb-[5px] text-[28px] leading-[1.25]">
        {t.recipientsTitle}
      </Text>
      <Text className="mb-[26px] text-[13px] opacity-50">
        {step === "2" ? t.stepTwo : t.recipientsSubtitle}
      </Text>

      {heirs !== undefined && heirs.length === 0 ? (
        <AlertBanner variant="security" description={t.noHeirs} className="mb-5" />
      ) : null}

      <View className="mb-5">
        {/* The joint bucket sits in the same list rather than in a section of
            its own, and picking it clears the individual ticks — "all heirs"
            and "these three heirs" are two different edges, and storing both
            would produce a duplicate envelope for anyone in the list. */}
        <RecipientRow
          group
          name={t.allHeirs}
          detail={t.allHeirsDetail}
          selected={allHeirs}
          onToggle={() => edit({ allHeirs: !allHeirs })}
          divider
        />

        {people.map((heir) => (
          <RecipientRow
            key={heir.id}
            name={heir.name}
            // Stored as an English key — see `screens/heirs/relations.ts`.
            detail={relationLabel(heir.relation, heirFields)}
            selected={selected.has(heir.id)}
            onToggle={() => toggle(heir.id)}
            divider
          />
        ))}

        <RecipientRow
          group
          name={t.executor}
          detail={t.executorNote}
          selected={executor}
          onToggle={() => edit({ executor: !executor })}
        />
      </View>

      {/* Body text, not a tinted notice: this is a fact about the product, not
          a warning about what you just did. */}
      <Text className="mb-auto text-[12px] leading-[1.65] opacity-55">
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

      <PrimaryCta
        label={t.saveRecipients!}
        onPress={() => void save()}
        disabled={!ready}
        busy={saving}
        className="mt-5"
      />
    </Screen>
  )
}
