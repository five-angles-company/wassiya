/**
 * One asset, as a grouped row list.
 *
 * ## Why this shape
 *
 * Six earlier versions were variations on one idea — a stack of headed sections,
 * each thing in its own card — and no amount of restyling fixed it, because the
 * problem was that a page of competing surfaces has no hierarchy to read. This
 * is the shape the owner picked: **no card per item, one soft container per
 * group**, hairlines between rows. It is what section ٩ has always been, which
 * is why Settings was never one of the screens that got called ugly.
 *
 * The title sits on the page rather than in a container: it is the page's
 * subject, and a surface around it makes it a card about itself.
 *
 * ## Two-tier decryption, unchanged
 *
 * The label opens when the screen does; the payload only behind a fresh
 * biometric, on a ten-second timer, under a screenshot guard. `SecretRow` moved
 * the presentation into the group but `use-asset-secret.ts` still owns every
 * part of that — the biometric call, the countdown, clearing the plaintext.
 *
 * File-backed types have no single revealable string and no viewer yet, so they
 * get a count-and-size row and say so, rather than offering a control that could
 * not deliver.
 */
import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { openLabel } from "@workspace/crypto/label"
import { unwrap } from "@workspace/crypto/wrap"
import { Text } from "@workspace/ui-native/components/ui/text"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import { router, useLocalSearchParams } from "expo-router"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { type AssetType } from "@/lib/asset-types"
import { DeleteAssetButton } from "@/screens/assets/detail/components/delete-asset-button"
import { SecretRow } from "@/screens/assets/detail/components/secret-row"
import {
  isPhrasePayload,
  parseSecret,
} from "@/screens/assets/detail/secret-fields"
import { useAssetSecret } from "@/screens/assets/detail/use-asset-secret"
import { useVault } from "@/stores/vault"

/** Category copy per type, reused from the vault list rather than restated. */
const CATEGORY_KEY = {
  crypto: "filterCrypto",
  bank: "filterBank",
  document: "filterDocument",
  photos: "filterPhotos",
  digital: "filterDigital",
  note: "filterNote",
} as const satisfies Record<AssetType, string>

/** Types whose payload is a phrase, so it renders as pills rather than fields. */
const WORD_TYPES: AssetType[] = ["crypto"]
/** Types stored as files, which have no single revealable string. */
const FILE_TYPES: AssetType[] = ["document", "photos"]

export function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const assetId = id as Id<"assets">
  const { t, locale } = useStrings("assets/detail")
  const { t: common } = useStrings("common")
  const { t: routing } = useStrings("will/routing")
  const { t: assetCopy } = useStrings("assets")
  // The whole screen can put a secret on display, so the guard covers all of it
  // rather than only the moment of reveal.
  useSecureScreen("assets/detail")

  const asset = useQuery(api.assets.get, { assetId })
  const lastRevealed = useQuery(api.assets.lastRevealedAt, { assetId })
  const recipients = useQuery(api.routing.forAsset, { assetId })
  const heirs = useQuery(api.heirs.list)
  const mk = useVault((s) => s.mk)
  const { state, reveal, hide } = useAssetSecret(assetId, t.biometricPrompt)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  // Tier one: the label, opened as soon as the screen has both the row and MK.
  const label = useMemo(() => {
    if (asset === undefined || asset === null || mk === null) return null
    try {
      const dek = unwrap(new Uint8Array(asset.dekWrappedByMk), mk)
      const opened = openLabel(new Uint8Array(asset.labelSealed), dek)
      dek.fill(0)
      return opened
    } catch {
      return null
    }
  }, [asset, mk])

  /** `null` for a phrase (drawn as pills) or a payload that does not parse. */
  const fields = useMemo(() => {
    if (state.status !== "revealed" || asset === undefined || asset === null) {
      return null
    }
    if (isPhrasePayload(asset.type, state.text)) return null
    return parseSecret(asset.type, state.text, t)
  }, [state, asset, t])

  /**
   * The recipients, as one line.
   *
   * Names rather than a count: "٢ مستلمين" tells an owner nothing they can act
   * on, while seeing who is there lets them notice who isn't.
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

  if (asset === undefined) {
    return (
      <Screen scroll={false}>
        <BackButton label={common.back} />
        <Text variant="meta" className="mt-6">
          {common.loading}
        </Text>
      </Screen>
    )
  }

  const isFileType = FILE_TYPES.includes(asset.type)
  const url = asset.urls[0] ?? null

  return (
    <Screen>
      <BackButton label={common.back} />

      <View className="mb-header mt-4 gap-1">
        <Text variant="screenTitle" numberOfLines={3}>
          {label?.title ?? t.revealFailed}
        </Text>
        <Text variant="metaSm">
          {label?.subtitle ?? assetCopy[CATEGORY_KEY[asset.type]]}
        </Text>
      </View>

      {/*
        One container, hairlines between rows, `px-4` so nothing sits flush
        against a 26px radius. Every other grouped list in the app omits that
        padding and lets its labels touch the curve; this is the version that
        should spread, not the other way round.
      */}
      <View className="rounded-card bg-card overflow-hidden px-4 shadow-sm">
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

        {isFileType || url === null ? null : (
          <SecretRow
            label={t.secretLabel}
            state={state}
            asWords={WORD_TYPES.includes(asset.type)}
            fields={fields}
            locale={locale}
            labels={{
              revealPrompt: t.revealPrompt,
              revealing: t.revealing,
              hide: t.hide,
              revealDenied: t.revealDenied,
              revealFailed: t.revealFailed,
              countdown: t.countdown,
            }}
            onReveal={() => reveal(url, asset.dekWrappedByMk)}
            onHide={hide}
            divider
          />
        )}

        {isFileType ? (
          <SettingsRow
            label={t.filesRowLabel}
            value={t.filesCount
              .replace("{n}", fmtNum(asset.storageIds.length, locale))
              .replace("{size}", formatSize(asset.meta.byteSize ?? 0, locale))}
            chevron={false}
            divider
          />
        ) : null}

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

      {isFileType ? (
        <Text variant="footnote" className="mt-2">
          {t.viewerSoon}
        </Text>
      ) : null}

      <View className="grow" />

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

function formatSize(bytes: number, locale: "ar" | "en"): string {
  const mb = bytes / 1024 / 1024
  const unit = locale === "ar" ? "م.ب" : "MB"
  return `${fmtNum(Math.round(mb * 10) / 10, locale)} ${unit}`
}
