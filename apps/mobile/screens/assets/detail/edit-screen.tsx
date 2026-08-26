/**
 * One asset, as the form that edits it.
 *
 * ## There is no view mode
 *
 * Tapping an asset opens this. The screen that used to sit in front of it —
 * read-only rows, with the payload behind a fingerprint and a ten-second timer
 * — was a page whose only action was "go somewhere else to change this", and
 * changing anything meant deleting the asset and adding it again.
 *
 * The layout is the one the owner picked: **no card per item, one soft
 * container per group**, hairlines between rows. Identical to section ٩, which
 * is the one area of this app that was never called ugly. `EditableRow` is
 * `SettingsRow` with a field in the value slot, at the same metrics, so a form
 * and a fact sit in the same list without the rhythm breaking.
 *
 * ## What protects the secrets now
 *
 * Not a gate in front of the screen — a form cannot be prefilled from a blob it
 * has not opened. Instead: every secret masked individually with its own eye
 * (`EditableRow`), the keyboard hardened on each of them, the whole screen under
 * `useSecureScreen`, and the open still written to the audit log. See
 * `use-asset-editor.ts`, which owns all of that.
 *
 * ## Leaving is guarded
 *
 * Both ways out — the header chevron and Android's back gesture — ask before
 * dropping unsaved edits. A password typed into a field and silently discarded
 * is the one failure this screen could cause that the owner would not notice
 * until they needed it.
 */
import { useEffect, useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Text } from "@workspace/ui-native/components/ui/text"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { cn } from "@workspace/ui-native/lib/utils"
import { router } from "expo-router"
import { Alert, BackHandler, Pressable, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { DeleteAssetButton } from "@/screens/assets/detail/components/delete-asset-button"
import { DigitalFields } from "@/screens/assets/detail/forms/digital-fields"
import {
  isDigitalValid,
  parseDigital,
  toDigitalPayload,
} from "@/screens/assets/detail/forms/digital"
import { useAssetEditor } from "@/screens/assets/detail/use-asset-editor"
import { useEditForm } from "@/screens/assets/detail/use-edit-form"

export function AssetEditScreen({ assetId }: { assetId: Id<"assets"> }) {
  const { t, locale } = useStrings("assets/detail")
  const { t: common } = useStrings("common")
  const { t: routing } = useStrings("will/routing")
  const { t: account } = useStrings("assets/new/account")
  // The screen can put a password on display, so the guard covers all of it
  // rather than only the moment an eye is tapped.
  useSecureScreen("assets/detail")

  const { load, save, saving, error } = useAssetEditor(assetId)
  const { form, patch, dirty, commit } = useEditForm(
    load.status === "ready" ? load.secret : null,
    parseDigital
  )

  const lastRevealed = useQuery(api.assets.lastRevealedAt, { assetId })
  const recipients = useQuery(api.routing.forAsset, { assetId })
  const heirs = useQuery(api.heirs.list)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  /**
   * The recipients, as one line. Names rather than a count: "٢ مستلمين" tells
   * an owner nothing they can act on, while seeing who is there lets them
   * notice who isn't.
   */
  const to = useMemo(() => {
    if (recipients === undefined) return undefined
    if (recipients.length === 0) return null
    return recipients
      .map((row) => {
        // Bound to a `const` first: narrowing on `row.recipient` does not
        // survive into the `find` callback, which reads a fresh closure.
        const target = row.recipient
        if (target.kind === "allHeirs") return routing.allHeirs
        if (target.kind === "executor") return routing.executor
        return heirs?.find((heir) => heir.id === target.heirId)?.name ?? ""
      })
      .filter((name) => name.length > 0)
      .join(" · ")
  }, [recipients, heirs, routing])

  const canSave = form !== null && dirty && isDigitalValid(form) && !saving

  async function onSave() {
    if (form === null) return
    const ok = await save(toDigitalPayload(form, account))
    if (ok) commit()
  }

  function leave() {
    if (router.canGoBack()) return router.back()
    router.replace("/assets")
  }

  function guardedBack() {
    if (!dirty) return leave()
    Alert.alert(t.discardTitle, t.discardBody, [
      { text: t.keepEditing, style: "cancel" },
      { text: t.discardConfirm, style: "destructive", onPress: leave },
    ])
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      // Returning false lets the gesture through; true swallows it and leaves
      // the alert to decide. Only claim it when there is something to lose.
      if (!dirty) return false
      Alert.alert(t.discardTitle, t.discardBody, [
        { text: t.keepEditing, style: "cancel" },
        {
          text: t.discardConfirm,
          style: "destructive",
          onPress: () => {
            if (router.canGoBack()) router.back()
            else router.replace("/assets")
          },
        },
      ])
      return true
    })
    return () => sub.remove()
  }, [dirty, t.discardTitle, t.discardBody, t.keepEditing, t.discardConfirm])

  const header = (
    <View className="flex-row items-center justify-between">
      <BackButton label={common.back} onPress={guardedBack} />
      <Pressable
        accessibilityRole="button"
        onPress={() => void onSave()}
        disabled={!canSave}
        className={cn(
          "h-9 items-center justify-center rounded-full px-4",
          canSave ? "bg-primary active:bg-terracotta-600" : "bg-sand-300"
        )}
      >
        <Text
          variant="metaSm"
          className={cn(
            "font-body-bold",
            canSave ? "text-primary-foreground" : "text-muted-foreground"
          )}
        >
          {saving ? t.saving : t.save}
        </Text>
      </Pressable>
    </View>
  )

  if (load.status === "loading") {
    return (
      <Screen scroll={false}>
        {header}
        <Text variant="meta" className="mt-6">
          {common.loading}
        </Text>
      </Screen>
    )
  }

  if (load.status === "locked") {
    return (
      <Screen scroll={false}>
        {header}
        <Text variant="meta" className="mt-6">
          {t.saveLocked}
        </Text>
      </Screen>
    )
  }

  const unreadable = load.status === "unreadable" || form === null

  return (
    <Screen keyboard>
      {header}

      <View className="mb-header mt-4 gap-1">
        <Text variant="screenTitle" numberOfLines={3}>
          {load.title.length > 0 ? load.title : t.revealFailed}
        </Text>
        {load.subtitle.length > 0 ? (
          <Text variant="metaSm">{load.subtitle}</Text>
        ) : null}
      </View>

      {unreadable ? (
        // Deliberately not an empty form. Rendering blank fields over a payload
        // this screen could not read would be an offer to overwrite a password
        // with nothing, made without ever showing the owner what was there.
        <View className="rounded-card bg-card px-4 py-4 shadow-sm">
          <Text variant="meta" className="text-terracotta-800">
            {t.revealFailed}
          </Text>
        </View>
      ) : (
        <View className="rounded-card bg-card overflow-hidden px-4 shadow-sm">
          <DigitalFields
            value={form}
            onChange={patch}
            labels={t}
            account={account}
            locale={locale}
          />
        </View>
      )}

      <View className="rounded-card bg-card mt-4 overflow-hidden px-4 shadow-sm">
        <SettingsRow
          label={t.toLabel}
          value={to === undefined ? "" : (to ?? t.recipientsNone)}
          valueTone={to === null ? "action" : "default"}
          divider
          onPress={() =>
            router.push({
              pathname: "/assets/[id]/recipients",
              params: { id: assetId },
            })
          }
        />
        <SettingsRow
          label={t.lastOpenedLabel}
          value={
            lastRevealed == null
              ? t.neverRevealed
              : fmtDate(new Date(lastRevealed), locale)
          }
          chevron={false}
        />
      </View>

      <View className="grow" />

      {error !== null ? (
        <Text variant="meta" className="text-terracotta-800 mt-4">
          {error === "locked" ? t.saveLocked : t.saveFailed}
        </Text>
      ) : null}

      {deleteError !== null ? (
        <Text variant="meta" className="text-terracotta-800 mt-4">
          {deleteError}
        </Text>
      ) : null}

      <DeleteAssetButton
        assetId={assetId}
        labels={t}
        onError={() => setDeleteError(t.deleteFailed)}
      />
    </Screen>
  )
}
