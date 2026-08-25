/**
 * One asset, as a sealed envelope addressed to a person.
 *
 * ## Why the shape changed
 *
 * Four rewrites of this screen were the same thing: a scroll of headed sections
 * — identity, recipients, content, maintenance — reordered and recoloured. That
 * shape describes a *record*, which is why it kept coming out looking like a
 * form however it was styled.
 *
 * An asset here is not a record. It is a thing being left to a named person, so
 * the screen is one object and one action: an addressed envelope, and a seal.
 * The recipient is **on** the envelope rather than in a section below it —
 * nothing about this asset can be read without reading who it is for — and the
 * contents stay sealed until a fingerprint opens them.
 *
 * ## Two-tier decryption throughout
 *
 * The label opens when the screen does; the payload only behind a fresh
 * biometric, on a ten-second timer, under a screenshot guard. File-backed types
 * have no single revealable string and no viewer yet, so they say so rather
 * than offering a seal that could not be broken.
 */
import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { openLabel } from "@workspace/crypto/label"
import { unwrap } from "@workspace/crypto/wrap"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import { router, useLocalSearchParams } from "expo-router"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPE_TONE, type AssetType } from "@/lib/asset-types"
import { DeleteAssetButton } from "@/screens/assets/detail/components/delete-asset-button"
import { AssetEnvelope } from "@/screens/assets/detail/components/asset-envelope"
import { SecretBlock } from "@/screens/assets/detail/components/secret-block"
import { SecretFieldList } from "@/screens/assets/detail/components/secret-field-list"
import {
  isPhrasePayload,
  parseSecret,
} from "@/screens/assets/detail/secret-fields"
import {
  REVEAL_SECONDS,
  useAssetSecret,
} from "@/screens/assets/detail/use-asset-secret"
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
  // "كل الورثة" / "الوصي" live with the routing screen that owns those concepts.
  const { t: routing } = useStrings("will/routing")
  // Category names live with the list that names them; reused, not duplicated.
  const { t: assetCopy } = useStrings("assets")
  // The whole screen can put a secret on display, so the guard covers all of it
  // rather than only the moment of reveal.
  useSecureScreen("assets/detail")

  const asset = useQuery(api.assets.get, { assetId })
  const lastRevealed = useQuery(api.assets.lastRevealedAt, { assetId })
  const mk = useVault((s) => s.mk)
  const { state, reveal, hide } = useAssetSecret(assetId, t.biometricPrompt)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const openRecipients = () =>
    router.push({ pathname: "/assets/[id]/recipients", params: { id: assetId } })

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

  /**
   * The revealed payload, as labelled fields.
   *
   * `null` for a phrase (drawn as pills) or a payload that does not parse — a
   * rotated format, a hand-edited row. The block then falls back to plain text,
   * which is ugly but honest: refusing to show a secret the owner has just
   * authenticated for would be worse than showing it plainly.
   */
  const fields = useMemo(() => {
    if (state.status !== "revealed" || asset === undefined || asset === null) {
      return null
    }
    if (isPhrasePayload(asset.type, state.text)) return null
    return parseSecret(asset.type, state.text, t)
  }, [state, asset, t])

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

      <AssetEnvelope
        className="mt-4"
        assetId={assetId}
        kicker={assetCopy[CATEGORY_KEY[asset.type]]!}
        title={label?.title ?? t.revealFailed}
        subtitle={label?.subtitle}
        tone={ASSET_TYPE_TONE[asset.type]}
        toLabel={t.toLabel}
        allHeirsLabel={routing.allHeirs}
        executorLabel={routing.executor}
        unaddressedLabel={t.recipientsNone}
      />

      <Button
        variant="outline"
        size="sm"
        className="mt-3 self-start px-5"
        onPress={openRecipients}
      >
        <Text>{t.recipientsEdit}</Text>
      </Button>

      {/* The seal. */}
      <View className="mt-header gap-2.5">
        {isFileType ? (
          <View className="rounded-card bg-sand-100 gap-1.5 p-4 shadow-sm">
            <Text variant="rowTitle">
              {t.filesCount
                .replace("{n}", fmtNum(asset.storageIds.length, locale))
                .replace("{size}", formatSize(asset.meta.byteSize ?? 0, locale))}
            </Text>
            <Text variant="footnote">{t.viewerSoon}</Text>
          </View>
        ) : url === null ? null : (
          <SecretBlock
            title={t.secretLabel}
            state={state}
            wordCount={asset.meta.itemCount ?? 0}
            asWords={WORD_TYPES.includes(asset.type)}
            revealedBody={
              fields === null ? undefined : <SecretFieldList fields={fields} />
            }
            locale={locale}
            labels={{
              revealPrompt: t.revealPrompt,
              revealing: t.revealing,
              hide: t.hide,
              revealDenied: t.revealDenied,
              revealFailed: t.revealFailed,
              terms: t.revealTerms.replace("{n}", fmtNum(REVEAL_SECONDS, locale)),
            }}
            onReveal={() => reveal(url, asset.dekWrappedByMk)}
            onHide={hide}
          />
        )}

        <Text variant="footnote">
          {lastRevealed == null
            ? t.neverRevealed
            : t.lastRevealed.replace(
                "{date}",
                fmtDate(new Date(lastRevealed), locale)
              )}
        </Text>
      </View>

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
