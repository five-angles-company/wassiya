/**
 * ٥.٣ — من يستلم ماذا؟ The screen that **replaces the share calculator**.
 *
 * The board's reasoning, which is why there is not a single percentage in this
 * file: the law fixes the fara'id and a wasiyya can only touch the third for
 * non-heirs, so an in-app split is either redundant or void — and a seed phrase
 * cannot be divided regardless. Whoever receives it receives all of it.
 *
 * So this models exactly one relation: recipients per asset, many-to-many, with
 * "all heirs jointly" as the default bucket. Grouping here is by category for
 * readability; the stored edge is per asset, which is what `routing.overview`
 * returns.
 *
 * **Nothing can be left with no recipient.** Unrouted assets fall to the
 * default bucket, which the owner can change but not empty — a vault that
 * delivers nothing is the one outcome this product must make impossible. That
 * rule is stated on the card and enforced by the row being read-only there.
 */
import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { openLabel } from "@workspace/crypto/label"
import { unwrap } from "@workspace/crypto/wrap"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { AssetRow } from "@workspace/ui-native/components/wassiya/asset-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPE_ICON, ASSET_TYPES, type AssetType } from "@/lib/asset-types"
import { useVault } from "@/stores/vault"

export function RoutingScreen() {
  const { t, locale } = useStrings("will/routing")
  const { t: assets } = useStrings("assets")
  const { t: common } = useStrings("common")
  const overview = useQuery(api.routing.overview)
  const heirs = useQuery(api.heirs.list)
  const mk = useVault((s) => s.mk)

  // Same decrypt shape as 4.1 — names are ciphertext, so a routing screen that
  // lists assets has to open them too.
  const rows = useMemo(() => {
    if (overview === undefined || mk === null) return undefined
    return overview.map((asset) => {
      let title = assets.undecryptable
      try {
        const dek = unwrap(new Uint8Array(asset.dekWrappedByMk), mk)
        title = openLabel(new Uint8Array(asset.labelSealed), dek).title
        dek.fill(0)
      } catch {
        // One unreadable row must not take the screen down.
      }
      return { id: asset.id, type: asset.type, title, recipients: asset.recipients }
    })
  }, [overview, mk, assets.undecryptable])

  const unrouted = rows?.filter((row) => row.recipients.length === 0) ?? []

  return (
    <Screen
      inset="footer"
      /* The bar was an absolutely-positioned View with pb-28 reserved above it
         by hand. That is what `footer` is for: it sits after the scroll area
         in normal flow, so the list ends above it instead of guessing a gap. */
      /* No "save": every edit is committed on ٥.٣b, so a save button on the
         overview would imply a draft that does not exist. */
      footer={
        <Button variant="outline" onPress={() => router.back()}>
          <Text>{common.back}</Text>
        </Button>
      }
    >
        <BackButton label={common.back} />
        <Text variant="screenTitle" className="mt-4">
          {t.title}
        </Text>

        {/* The manifesto, first thing on the screen. It is here because a user
            arriving at "who receives what" is looking for a percentage field,
            and the honest answer is that there will never be one. */}
        <View className="rounded-card bg-olive-100 mt-4 p-4">
          <Text
            variant="metaSm"
            className="text-olive-700 leading-[1.75]"
          >
            {t.manifesto}
          </Text>
        </View>

        {heirs !== undefined && heirs.length === 0 ? (
          <AlertBanner
            className="mt-4"
            variant="security"
            description={t.noHeirs}
          />
        ) : null}

        {/* The default bucket. Shown as a rule rather than a row because it is
            not an asset — it is what happens to everything nobody named. */}
        <View className="rounded-card bg-card mt-4 gap-1.5 p-4">
          <Text variant="rowTitle">{t.defaultRuleTitle}</Text>
          <Text variant="metaSm" className="text-muted-foreground leading-[1.6]">
            {unrouted.length === 0
              ? t.defaultRuleNone
              : t.defaultRuleBody.replace(
                  "{n}",
                  fmtNum(unrouted.length, locale)
                )}
          </Text>
        </View>

        {/* Grouped by category for readability; the stored edge is per asset. */}
        {ASSET_TYPES.map((type) => {
          const group = rows?.filter((row) => row.type === type) ?? []
          if (group.length === 0) return null
          return (
            <View key={type} className="mt-header gap-2">
              <Text variant="sectionLabel">{assets[FILTER_KEY[type]]}</Text>
              <View className="gap-row">
                {group.map((row) => (
                  <AssetRow
                    key={row.id}
                    icon={ASSET_TYPE_ICON[row.type]}
                    title={row.title}
                    meta={describeRecipients(row.recipients, heirs ?? [], t)}
                    recipientStatus={
                      row.recipients.length === 0 ? "action" : "confirmed"
                    }
                    recipientLabel={
                      row.recipients.length === 0
                        ? assets.recipientsZero
                        : fmtNum(row.recipients.length, locale)
                    }
                    onPress={() =>
                      router.push({
                        pathname: "/assets/[id]/recipients",
                        params: { id: row.id },
                      })
                    }
                  />
                ))}
              </View>
            </View>
          )
        })}

        <Text variant="footnote" className="mt-6">
          {t.pendingBundles}
        </Text>
    </Screen>
  )
}

/** "سارة · عمر" — names, never a ratio. */
function describeRecipients(
  recipients: { kind: string; heirId?: string }[],
  heirs: { id: string; name: string }[],
  t: Record<string, string>
): string | undefined {
  if (recipients.length === 0) return undefined
  return recipients
    .map((recipient) => {
      if (recipient.kind === "allHeirs") return t.allHeirs!
      if (recipient.kind === "executor") return t.executor!
      return heirs.find((heir) => heir.id === recipient.heirId)?.name ?? ""
    })
    .filter((name) => name.length > 0)
    .join(" · ")
}

/** Category labels live in the assets dictionary; reused rather than duplicated. */
const FILTER_KEY = {
  crypto: "filterCrypto",
  bank: "filterBank",
  document: "filterDocument",
  photos: "filterPhotos",
  digital: "filterDigital",
  note: "filterNote",
} as const satisfies Record<AssetType, string>
