/**
 * The paywall: one sheet, opened from wherever a plan limit was hit.
 *
 * It lives in a provider rather than in each screen because the refusal is
 * thrown at the mutation, not at the button — six asset wizards and the executor
 * form would otherwise each mount their own copy and each wire the same catch.
 * `useAssetSubmit` and `executors/new` call `open(limit)` from the catch block, and
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
import { useConvexAuth, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { Sheet } from "@workspace/ui-native/components/wassiya/sheet"
import { router } from "expo-router"
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
  executors: ["executorsTitle", "executorsBody"],
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
  // "skip" matters: this provider is mounted at the root layout, so it renders
  // over the welcome and auth screens too, and `plans.current` calls
  // `requireUser` — which throws as a render-time error, not a null result.
  // Convex's auth state, never Clerk's: it is what decides whether the query
  // succeeds.
  const { isAuthenticated } = useConvexAuth()
  const plan = useQuery(api.plans.current, isAuthenticated ? {} : "skip")
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
  const ceilings = plan?.ceilings

  const body = t[bodyKey]
    .replace("{free}", freeSide(limit, here, ceilings, t, locale, units))
    .replace("{paid}", paidSide(limit, paid, ceilings, t, locale, units))

  const unlocks = [
    upTo(paid?.assets, ceilings?.assets, t.unlockAssets, locale),
    upTo(paid?.executors, ceilings?.executors, t.unlockExecutors, locale),
    t.unlockPhotos,
    paid?.storageBytes == null
      ? t.unlockStorage.replace("{paid}", t.unlimited)
      : t.unlockStorage.replace(
          "{paid}",
          fmtBytes(paid.storageBytes, locale, units)
        ),
  ].filter((line) => line.length > 0)

  return (
    <Sheet ref={sheet} title={t[titleKey]} onDismiss={onClose}>
      <Text variant="prose" className="mb-6">
        {body}
      </Text>

      <Text variant="sectionLabel" className="mb-2">
        {t.unlocksTitle}
      </Text>
      <View className="mb-6 overflow-hidden rounded-card bg-card">
        {unlocks.map((line, i) => (
          <View key={line}>
            <View className="flex-row items-center gap-3 px-4 py-3.5">
              <View className="size-6.5 shrink-0 items-center justify-center rounded-full bg-olive-100">
                <Icon
                  as={Check}
                  size={14}
                  strokeWidth={2.75}
                  className="text-olive-800"
                />
              </View>
              <Text className="text-row flex-1">{line}</Text>
            </View>
            {i < unlocks.length - 1 ? (
              <View className="mx-4 h-px bg-border" />
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
        <View className="mb-2.5 gap-1.5 rounded-card bg-card p-4">
          <Text variant="rowTitle">{t.soonTitle}</Text>
          <Text variant="metaSm">{t.soonBody}</Text>
          <Pressable
            accessibilityRole="link"
            onPress={() => {
              onClose()
              router.push("/settings/help/new?topic=billing")
            }}
            className="mt-1 self-start py-1 active:opacity-70"
          >
            <Text variant="action">{t.contactUs}</Text>
          </Pressable>
        </View>
      )}

      <PrimaryCta tone="quiet" label={t.notNow} onPress={onClose} />
    </Sheet>
  )
}

type Limits = {
  storageBytes: number | null
  assets: number | null
  executors: number | null
  maxFileBytes: number | null
}

type Units = { mb: string; gb: string }

type Ceilings = { assets: number; executors: number }

type Copy = Record<string, string>

/**
 * The limit the owner just hit, in words. Which field that is depends on the
 * wall, which is why this is a switch and not a lookup: "five" and "500 MB"
 * are the same sentence slot and different types.
 */
function freeSide(
  limit: PlanLimit,
  limits: Limits | undefined,
  ceilings: Ceilings | undefined,
  t: Copy,
  locale: Locale,
  units: Units
): string {
  if (limits === undefined) {
    return ""
  }
  switch (limit) {
    case "assets":
      return count(limits.assets, ceilings?.assets, locale)
    case "executors":
      return count(limits.executors, ceilings?.executors, locale)
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
  ceilings: Ceilings | undefined,
  t: Copy,
  locale: Locale,
  units: Units
): string {
  if (limits === null || limits === undefined) {
    return ""
  }
  return freeSide(limit, limits, ceilings, t, locale, units)
}

/** A count limit as a bare number; a plan with no cap stops at the ceiling. */
function count(
  value: number | null,
  ceiling: number | undefined,
  locale: Locale
): string {
  const cap = value ?? ceiling
  return cap === undefined ? "" : fmtNum(cap, locale)
}

function size(
  value: number | null,
  unlimited: string,
  locale: Locale,
  units: Units
): string {
  return value === null ? unlimited : fmtBytes(value, locale, units)
}

/** An unlocked line — "الأصول: حتى ١٬٠٠٠" — or nothing while the plan loads. */
function upTo(
  value: number | null | undefined,
  ceiling: number | undefined,
  line: string,
  locale: Locale
): string {
  if (value === undefined) return ""
  const cap = count(value, ceiling, locale)
  return cap === "" ? "" : line.replace("{paid}", cap)
}
