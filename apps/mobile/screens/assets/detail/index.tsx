/**
 * ٤.٩ — one asset.
 *
 * The board's three-part shape: an identity row, **one** tinted guarded block,
 * then plain surface cards. Two-tier decryption throughout — the label opens
 * when the screen does, the payload only behind a fresh biometric.
 *
 * File-backed types (document, photos) have no phrase to peek at and no viewer
 * yet, so they get a summary card instead of a reveal button. That is the
 * honest shape: the bytes are there and encrypted, and nothing on this screen
 * can render them until a viewer exists.
 */
import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { openLabel } from "@workspace/crypto/label"
import { unwrap } from "@workspace/crypto/wrap"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import { router, useLocalSearchParams } from "expo-router"
import { ScrollView, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPE_ICON, type AssetType } from "@/lib/asset-types"
import { DeleteAssetButton } from "@/screens/assets/detail/components/delete-asset-button"
import { SecretBlock } from "@/screens/assets/detail/components/secret-block"
import {
  REVEAL_SECONDS,
  useAssetSecret,
} from "@/screens/assets/detail/use-asset-secret"
import { useVault } from "@/stores/vault"

/** Types whose payload is a phrase, so it renders as pills rather than text. */
const WORD_TYPES: AssetType[] = ["crypto"]
/** Types stored as files, which have no single revealable string. */
const FILE_TYPES: AssetType[] = ["document", "photos"]

export function AssetDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  const assetId = id as Id<"assets">
  const { t, locale } = useStrings("assets/detail")
  const { t: common } = useStrings("common")
  // The whole screen can put a secret on display, so the guard covers all of it
  // rather than only the moment of reveal.
  useSecureScreen("assets/detail")

  const asset = useQuery(api.assets.get, { assetId })
  const lastRevealed = useQuery(api.assets.lastRevealedAt, { assetId })
  const mk = useVault((s) => s.mk)
  const { state, reveal, hide } = useAssetSecret(assetId, t.biometricPrompt)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const openRecipients = () =>
    router.push({
      pathname: "/assets/[id]/recipients",
      params: { id: assetId },
    })

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

  if (asset === undefined) {
    return (
      <View className="px-gutter flex-1 bg-background pt-4">
        <BackButton label={common.back} />
        <Text variant="meta" className="text-muted-foreground mt-6">
          {common.loading}
        </Text>
      </View>
    )
  }

  const isFileType = FILE_TYPES.includes(asset.type)
  const url = asset.urls[0] ?? null

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-4"
    >
      <BackButton label={common.back} />

      {/* Identity row. */}
      <View className="mb-header mt-4 flex-row items-center gap-3">
        <View className="bg-card size-12 shrink-0 items-center justify-center rounded-full">
          <Icon
            as={ASSET_TYPE_ICON[asset.type]}
            className="text-terracotta-700 size-5.5"
          />
        </View>
        <View className="min-w-0 flex-1">
          <Text variant="pageTitle" numberOfLines={2}>
            {label?.title ?? t.revealFailed}
          </Text>
          {label?.subtitle ? (
            <Text variant="metaSm" numberOfLines={1}>
              {label.subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      {isFileType ? (
        <View className="rounded-card bg-card gap-1.5 p-4">
          <Text variant="rowTitle">{t.filesLabel}</Text>
          <Text variant="metaSm">
            {t.filesCount
              .replace("{n}", fmtNum(asset.storageIds.length, locale))
              .replace("{size}", formatSize(asset.meta.byteSize ?? 0, locale))}
          </Text>
          <Text variant="metaSm" className="text-muted-foreground mt-1">
            {t.viewerSoon}
          </Text>
        </View>
      ) : url === null ? null : (
        <SecretBlock
          title={t.secretLabel}
          state={state}
          wordCount={asset.meta.itemCount ?? 0}
          asWords={WORD_TYPES.includes(asset.type)}
          locale={locale}
          labels={{
            revealPrompt: t.revealPrompt,
            revealing: t.revealing,
            hide: t.hide,
            revealDenied: t.revealDenied,
            revealFailed: t.revealFailed,
            terms: `${t.revealTerms.replace("{n}", fmtNum(REVEAL_SECONDS, locale))} · ${
              lastRevealed == null
                ? t.neverRevealed
                : t.lastRevealed.replace(
                    "{date}",
                    fmtDate(new Date(lastRevealed), locale)
                  )
            }`,
          }}
          onReveal={() => reveal(url, asset.dekWrappedByMk)}
          onHide={hide}
        />
      )}

      {/* Recipients — a list, never a ratio. */}
      <View className="mt-4 gap-2">
        <Text variant="sectionLabel">{t.recipientsLabel}</Text>
        {asset.recipientRule === "default" ? (
          <AlertBanner
            variant="security"
            title={t.recipientsNone}
            description={t.recipientsNoneBody}
            actions={
              <Button size="sm" variant="outline" onPress={openRecipients}>
                <Text>{t.recipientsEdit}</Text>
              </Button>
            }
          />
        ) : (
          <Button variant="outline" onPress={openRecipients}>
            <Text>{t.recipientsEdit}</Text>
          </Button>
        )}
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
    </ScrollView>
  )
}

function formatSize(bytes: number, locale: "ar" | "en"): string {
  const mb = bytes / 1024 / 1024
  const unit = locale === "ar" ? "م.ب" : "MB"
  return `${fmtNum(Math.round(mb * 10) / 10, locale)} ${unit}`
}
