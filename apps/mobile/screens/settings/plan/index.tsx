/**
 * ٩.٤ — الخطة والتخزين.
 *
 * The lapse rule is a product promise, not a billing detail: a lapsed vault
 * stays readable and executor delivery keeps working; only adding assets is blocked.
 * `assertCanAddAssets` is called in `assets.create` and nowhere else.
 *
 * So the lapse banner leads with what still works. A dunning notice that made
 * someone fear for their executors' access would be both untrue and cruel, and this
 * is the screen where that temptation is strongest.
 *
 * The banner uses `notice`, not `info` — see the ui-native README for why the
 * two tints could not be collapsed into one name.
 *
 * **Every number here comes from `plans.current`.** This screen once carried a
 * `DEFAULT_QUOTA_BYTES` constant claiming 5 GB while the server enforced
 * nothing, which is the failure the catalogue exists to make impossible: the
 * meter and the refusal now read the same row.
 */
import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { StorageMeter } from "@workspace/ui-native/components/wassiya/storage-meter"
import { Surface } from "@workspace/ui-native/components/wassiya/surface"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { router } from "expo-router"
import { CreditCard, Sparkles } from "lucide-react-native"
import { View } from "react-native"

import { usePaywall } from "@/components/paywall"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
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
  investment: "filterInvestment",
  insurance: "filterInsurance",
} as const satisfies Record<AssetType, string>

const BYTES_PER_MB = 1_000_000
const BYTES_PER_GB = 1_000_000_000

export function PlanScreen() {
  const { t, locale } = useStrings("settings/plan")
  const plan = useQuery(api.plans.current)
  const rows = useQuery(api.assets.list, {})
  const executors = useQuery(api.executors.list)
  const { t: assets } = useStrings("assets")
  const paywall = usePaywall()

  /**
   * Per-category segments, which is what `StorageMeter` was built for — a
   * single "used" block would waste a component whose whole point is showing
   * *what* is filling the quota.
   *
   * Built from `assets.list`, where `type` and `meta.byteSize` are plaintext
   * columns. No decryption, and no need for the vault to be unlocked, exactly
   * as on Home.
   *
   * The meter is drawn from these segments rather than from the server's
   * `storageBytesUsed`. That counter is the authoritative total and is what the
   * quota check uses; this breakdown is derived from the rows and can lag it by
   * a write. Showing the derived version keeps the bar and its legend telling
   * the same story, which a mismatched pair would not.
   */
  const segments = useMemo(() => {
    const byType = new Map<AssetType, number>()
    for (const row of rows ?? []) {
      byType.set(
        row.type,
        (byType.get(row.type) ?? 0) + (row.meta.byteSize ?? 0)
      )
    }
    return ASSET_TYPES.filter((type) => (byType.get(type) ?? 0) > 0).map(
      (type) => ({
        label: assets[CATEGORY_KEY[type]]!,
        bytes: byType.get(type) ?? 0,
      })
    )
  }, [rows, assets])

  // A live clock against a server timestamp. `plans.current` returns
  // `renewsAt` rather than a boolean precisely so the client can do this — see
  // its note on why a server-computed boolean would freeze until an unrelated
  // write.
  //
  // Read once per mount rather than on every render: a renewal date crosses
  // midnight, not milliseconds, so a value seeded at open is accurate for as
  // long as anyone looks at this screen — and calling the clock during render
  // is impure regardless.
  const [now] = useState(() => Date.now())
  const lapsed =
    plan !== undefined && plan.renewsAt !== null && plan.renewsAt < now

  const quota = plan?.limits.storageBytes ?? null
  // The meter formats in GB. A 500 MB allowance in GB reads "٠٫٥", which is a
  // number nobody thinks in — so a small quota switches the unit and the
  // formatter together, because the meter shares one formatter between its
  // header and its legend.
  const inMb = quota !== null && quota < BYTES_PER_GB

  return (
    <Screen>
      <ScreenHeader back title={t.title!} />

      {lapsed ? (
        <AlertBanner
          className="mb-6"
          variant="notice"
          title={t.lapsedTitle}
          description={t.lapsedBody}
        />
      ) : null}

      <Surface gap="tight" className="mb-6">
        <Text variant="metaSm">{t.planLabel}</Text>
        <Text variant="rowTitle">
          {plan?.plan === "annual" ? t.annualPlan : t.freePlan}
        </Text>
        {plan?.renewsAt != null ? (
          <Text variant="metaSm">
            {t.renewsAt.replace(
              "{date}",
              fmtDate(new Date(plan.renewsAt), locale)
            )}
          </Text>
        ) : null}
      </Surface>

      <Text variant="sectionLabel" className="mb-2">
        {t.usageTitle}
      </Text>
      <View className="mb-6 overflow-hidden rounded-card bg-card">
        <SettingsRow
          label={t.assetsLabel}
          value={countLine(
            t,
            locale,
            plan?.usage.assets,
            plan?.limits.assets,
            plan?.ceilings.assets,
            rows?.length
          )}
          divider
        />
        <SettingsRow
          label={t.executorsLabel}
          value={countLine(
            t,
            locale,
            plan?.usage.executors,
            plan?.limits.executors,
            plan?.ceilings.executors,
            executors?.length
          )}
        />
      </View>

      <StorageMeter
        quotaBytes={quota ?? 0}
        segments={segments}
        empty={segments.length === 0}
        locale={locale}
        labels={inMb ? { unit: t.unitMb } : undefined}
        formatSize={
          inMb
            ? (bytes, loc) =>
                fmtNum(bytes / BYTES_PER_MB, loc, { maximumFractionDigits: 0 })
            : undefined
        }
      />

      <View className="mt-6 overflow-hidden rounded-card bg-card">
        {plan?.plan === "free" ? (
          <SettingsRow
            icon={Sparkles}
            label={t.upgrade}
            chevron
            divider
            onPress={() => paywall.open("assets")}
          />
        ) : null}
        <SettingsRow
          icon={CreditCard}
          label={t.manage}
          value={t.soon}
          chevron
          onPress={() => router.push("/settings/help/new?topic=billing")}
        />
      </View>
    </Screen>
  )
}

/**
 * "٣ من ٥" — or, where the plan has no cap, "٣ من ١٬٠٠٠" against the vault's
 * ceiling, which is what "unlimited" means. Nothing is counted on a plan with
 * no cap (`used` is null), so the count is taken from the rows on the phone.
 */
function countLine(
  t: { ofLimit: string },
  locale: Locale,
  used: number | null | undefined,
  limit: number | null | undefined,
  ceiling: number | undefined,
  held?: number
): string {
  const cap = limit ?? ceiling
  const count = used ?? held
  if (cap === undefined || count === undefined) return ""
  return t.ofLimit
    .replace("{used}", fmtNum(count, locale))
    .replace("{limit}", fmtNum(cap, locale))
}
