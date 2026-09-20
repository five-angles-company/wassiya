/**
 * The paywall: one sheet, opened from wherever a plan limit was hit.
 *
 * It lives in a provider rather than in each screen because the refusal is
 * thrown at the mutation, not at the button — six asset wizards and the heir
 * form would otherwise each mount their own copy and each wire the same catch.
 * `useAssetSubmit` and `heirs/new` call `open(limit)` from the catch block, and
 * the sheet appears over whatever screen they are on.
 *
 * The copy rule is in the strings file and is load-bearing: this sheet says
 * what the plan unlocks and never what the owner risks losing.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { Check } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { useBilling } from "@/lib/billing"
import { fmtBytes } from "@/lib/bytes"
import type { PlanLimit } from "@/lib/plan-limit"

type PaywallContext = { open: (limit: PlanLimit) => void }

/**
 * A no-op default so a hook that catches a limit outside the provider degrades
 * to "the mutation failed" rather than crashing the wizard it was called from.
 */
const Context = createContext<PaywallContext>({ open: () => {} })

export function usePaywall(): PaywallContext {
  return useContext(Context)
}

export function PaywallProvider({ children }: { children: ReactNode }) {
  // Which wall, and whether the sheet is up — two fields rather than a
  // nullable one, because the sheet animates out and would flicker to another
  // wall's copy on the way if closing also cleared the limit.
  const [state, setState] = useState<{ limit: PlanLimit; open: boolean }>({
    limit: "assets",
    open: false,
  })

  const value = useMemo(
    () => ({ open: (limit: PlanLimit) => setState({ limit, open: true }) }),
    []
  )

  const close = useCallback(
    () => setState((prev) => ({ ...prev, open: false })),
    []
  )

  return (
    <Context.Provider value={value}>
      {children}
      <Paywall limit={state.limit} open={state.open} onClose={close} />
    </Context.Provider>
  )
}

/** Which of the six walls was hit, in strings. */
const COPY = {
  assets: ["assetsTitle", "assetsBody"],
  storage: ["storageTitle", "storageBody"],
  heirs: ["heirsTitle", "heirsBody"],
  photos: ["photosTitle", "photosBody"],
  fileSize: ["fileSizeTitle", "fileSizeBody"],
  lapsed: ["lapsedTitle", "lapsedBody"],
} as const satisfies Record<PlanLimit, readonly [string, string]>

function Paywall({
  limit,
  open,
  onClose,
}: {
  limit: PlanLimit
  open: boolean
  onClose: () => void
}) {
  const { t, locale } = useStrings("paywall")
  const billing = useBilling()
  const plan = useQuery(api.plans.current)
  const sheet = useRef<TrueSheet>(null)

  // Only dismiss something that was actually presented — the same guard every
  // other sheet in the app carries, for the same TrueSheet warning.
  const presented = useRef(false)
  useEffect(() => {
    if (open) {
      presented.current = true
      void sheet.current?.present()
      return
    }
    if (presented.current) void sheet.current?.dismiss()
  }, [open])

  const [titleKey, bodyKey] = COPY[limit]
  const renewing = limit === "lapsed"

  // Every number in this sheet comes from the server. The catalogue is
  // editable, so a sentence that remembered its own limits would be wrong the
  // first time a tier moved — and wrong silently, because the server would go
  // on enforcing the real one.
  const units = { mb: t.unitMb, gb: t.unitGb }
  const here = plan?.limits
  const paid = plan?.upgrade ?? plan?.limits

  const body = t[bodyKey]
    .replace("{free}", freeSide(limit, here, t, locale, units))
    .replace("{paid}", paidSide(limit, paid, t, locale, units))

  const unlocks = [
    count(paid?.assets, t.unlockAssets, t.unlockAssetsCount, locale),
    count(paid?.heirs, t.unlockHeirs, t.unlockHeirsCount, locale),
    t.unlockPhotos,
    paid?.storageBytes == null
      ? t.unlockStorage.replace("{paid}", t.unlimited)
      : t.unlockStorage.replace(
          "{paid}",
          fmtBytes(paid.storageBytes, locale, units)
        ),
  ]

  return (
    <Sheet ref={sheet} onDismiss={onClose} contentClassName="px-6 pb-[26px] pt-4">
      <Text className="font-heading-extrabold text-foreground mb-3 text-[24px] leading-[1.3]">
        {t[titleKey]}
      </Text>
      <Text className="mb-[22px] text-[15px] leading-[1.75] opacity-75">
        {body}
      </Text>

      <Text variant="sectionLabel" className="mb-1">
        {t.unlocksTitle}
      </Text>
      <View className="mb-6">
        {unlocks.map((line, i) => (
          <View key={line}>
            <View className="flex-row items-center gap-[13px] py-3">
              <View className="bg-olive-200 size-[26px] shrink-0 items-center justify-center rounded-full">
                <Icon
                  as={Check}
                  size={14}
                  strokeWidth={3}
                  className="text-olive-900"
                />
              </View>
              <Text className="flex-1 text-[14.5px]">{line}</Text>
            </View>
            {i < unlocks.length - 1 ? (
              <View className="bg-border ms-[39px] h-px" />
            ) : null}
          </View>
        ))}
      </View>

      {billing.available ? (
        <PrimaryCta
          className="mb-2.5"
          label={`${renewing ? t.renew : t.subscribe} · ${billing.priceLabel} ${t.perYear}`}
          busy={billing.busy}
          onPress={() => void billing.purchase()}
        />
      ) : (
        <View className="bg-card rounded-card mb-2.5 gap-1.5 p-4">
          <Text variant="rowTitle">{t.soonTitle}</Text>
          <Text variant="metaSm" className="text-muted-foreground">
            {t.soonBody}
          </Text>
        </View>
      )}

      <Pressable
        accessibilityRole="button"
        onPress={onClose}
        className="bg-card h-[54px] items-center justify-center rounded-full active:opacity-80"
      >
        <Text className="font-heading-extrabold text-foreground text-[16px]">
          {t.notNow}
        </Text>
      </Pressable>
    </Sheet>
  )
}

type Limits = {
  storageBytes: number | null
  assets: number | null
  heirs: number | null
  maxFileBytes: number | null
}

type Units = { mb: string; gb: string }

type Copy = Record<string, string>

/**
 * The limit the owner just hit, in words. Which field that is depends on the
 * wall, which is why this is a switch and not a lookup: "five assets" and
 * "500 MB" are the same sentence slot and different types.
 */
function freeSide(
  limit: PlanLimit,
  limits: Limits | undefined,
  t: Copy,
  locale: Locale,
  units: Units
): string {
  if (limits === undefined) {
    return ""
  }
  switch (limit) {
    case "assets":
      return plural(limits.assets, t.assetsCount!, t.unlimited!, locale)
    case "heirs":
      return plural(limits.heirs, t.heirsCount!, t.unlimited!, locale)
    case "storage":
      return size(limits.storageBytes, t.unlimited!, locale, units)
    case "fileSize":
      return size(limits.maxFileBytes, t.unlimited!, locale, units)
    default:
      return ""
  }
}

/** The same slot on the plan being sold. */
function paidSide(
  limit: PlanLimit,
  limits: Limits | null | undefined,
  t: Copy,
  locale: Locale,
  units: Units
): string {
  if (limits === null || limits === undefined) {
    return ""
  }
  return freeSide(limit, limits, t, locale, units)
}

function plural(
  value: number | null,
  template: string,
  unlimited: string,
  locale: Locale
): string {
  return value === null
    ? unlimited
    : template.replace("{n}", fmtNum(value, locale))
}

function size(
  value: number | null,
  unlimited: string,
  locale: Locale,
  units: Units
): string {
  return value === null ? unlimited : fmtBytes(value, locale, units)
}

/** An unlocked line: "unlimited heirs", or the number when there is a cap. */
function count(
  value: number | null | undefined,
  unlimitedLine: string,
  countedLine: string,
  locale: Locale
): string {
  return value === null || value === undefined
    ? unlimitedLine
    : countedLine.replace("{paid}", fmtNum(value, locale))
}
