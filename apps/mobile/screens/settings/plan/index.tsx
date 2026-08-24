/**
 * ٩.٤ — الخطة والتخزين.
 *
 * ## The lapse rule, which is a product promise and not a billing detail
 *
 * AGENTS.md: *"Subscription lapse: vault stays readable and heir delivery keeps
 * working; only adding assets is blocked."* The backend enforces exactly that —
 * `assertCanAddAssets` is called in `assets.create` and **nowhere else**, and
 * `assets.ts` says so in its own header: *"Reads, updates and the entire release
 * path never consult the plan, because a lapsed card must not cost anyone their
 * inheritance."*
 *
 * So the lapse banner leads with what still works. A dunning notice that made
 * someone fear for their heirs' access would be both untrue and cruel, and this
 * is the screen where that temptation is strongest.
 *
 * The banner uses `notice`, not `info` — the ui-native README records that
 * decision and why the two tints could not be collapsed into one name.
 */
import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { StorageMeter } from "@workspace/ui-native/components/wassiya/storage-meter"
import { fmtDate } from "@workspace/ui-native/lib/format"
import { CreditCard } from "lucide-react-native"
import { Alert, ScrollView, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { useStrings } from "@/i18n/use-strings"
import { ASSET_TYPES, type AssetType } from "@/lib/asset-types"

/** Category labels live in the assets dictionary; reused, not duplicated. */
const CATEGORY_KEY = {
  crypto: "filterCrypto",
  bank: "filterBank",
  document: "filterDocument",
  photos: "filterPhotos",
  digital: "filterDigital",
  note: "filterNote",
} as const satisfies Record<AssetType, string>

/** Free-tier allowance, until a real plan catalogue exists. */
const DEFAULT_QUOTA_BYTES = 5 * 1024 * 1024 * 1024

export function PlanScreen() {
  const { t, locale } = useStrings("settings/plan")
  const { t: common } = useStrings("common")
  const me = useQuery(api.users.me)
  const rows = useQuery(api.assets.list, {})
  const { t: assets } = useStrings("assets")

  const subscription = me?.subscription ?? null

  /**
   * Per-category segments, which is what `StorageMeter` was built for — a
   * single "used" block would waste a component whose whole point is showing
   * *what* is filling the quota.
   *
   * Built from `assets.list`, where `type` and `meta.byteSize` are plaintext
   * columns. No decryption, and no need for the vault to be unlocked, exactly
   * as on Home.
   *
   * The meter is drawn from these segments rather than from
   * `subscription.storageBytesUsed`. The server's counter is the authoritative
   * total and is what a quota check would use; this breakdown is derived from
   * the rows and can lag it by a write. Showing the derived version keeps the
   * bar and its legend telling the same story, which a mismatched pair would
   * not.
   */
  const segments = useMemo(() => {
    const byType = new Map<AssetType, number>()
    for (const row of rows ?? []) {
      byType.set(row.type, (byType.get(row.type) ?? 0) + (row.meta.byteSize ?? 0))
    }
    return ASSET_TYPES.filter((type) => (byType.get(type) ?? 0) > 0).map(
      (type) => ({
        label: assets[CATEGORY_KEY[type]]!,
        bytes: byType.get(type) ?? 0,
      })
    )
  }, [rows, assets])

  // A live clock against a server timestamp. `users.me` returns `renewsAt`
  // rather than a boolean precisely so the client can do this — see its note on
  // why a server-computed boolean would freeze until an unrelated write.
  //
  // Read once per mount rather than on every render: a renewal date crosses
  // midnight, not milliseconds, so a value seeded at open is accurate for as
  // long as anyone looks at this screen — and calling the clock during render
  // is impure regardless.
  const [now] = useState(() => Date.now())
  const lapsed =
    subscription?.renewsAt !== undefined && subscription.renewsAt < now

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-4"
    >
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mb-header mt-4">
        {t.title}
      </Text>

      {lapsed ? (
        <AlertBanner
          className="mb-header"
          variant="notice"
          title={t.lapsedTitle}
          description={t.lapsedBody}
        />
      ) : null}

      <View className="rounded-card bg-card mb-header gap-1.5 p-4">
        <Text variant="metaSm" className="text-muted-foreground">
          {t.planLabel}
        </Text>
        <Text variant="rowTitle">{subscription?.plan ?? t.freePlan}</Text>
        {subscription?.renewsAt !== undefined ? (
          <Text variant="metaSm" className="text-muted-foreground">
            {t.renewsAt.replace(
              "{date}",
              fmtDate(new Date(subscription.renewsAt), locale)
            )}
          </Text>
        ) : null}
      </View>

      <Text variant="sectionLabel" className="mb-2">
        {t.storageTitle}
      </Text>
      <StorageMeter
        quotaBytes={DEFAULT_QUOTA_BYTES}
        segments={segments}
        empty={segments.length === 0}
        locale={locale}
      />
      {segments.length === 0 ? (
        <Text variant="metaSm" className="text-muted-foreground mt-2">
          {t.emptyStorage}
        </Text>
      ) : null}

      <View className="rounded-card bg-card mt-header overflow-hidden">
        {/* Billing is not wired. An alert that says so beats a row that looks
            live and does nothing — the same rule the OTP resend taught. */}
        <SettingsRow
          icon={CreditCard}
          label={t.manage}
          onPress={() => Alert.alert(t.manage, t.billingSoon)}
        />
      </View>
    </ScrollView>
  )
}
