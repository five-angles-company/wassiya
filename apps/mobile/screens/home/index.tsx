/**
 * الرئيسية — a check-in bar, then tiles, each a number or a state and each one
 * tap from the thing it describes.
 *
 * Colour is the message: terracotta means "this needs you", olive means done,
 * sand is just a count. The gaps are findable by sweeping the grid before
 * reading a word, which is what lets the labels stay this short. One line above
 * the grid names the gap, so the screen answers "what's missing?" in three
 * words rather than making anyone decode five tiles.
 *
 * **There is no `useVault` in this file and nothing waits on a fingerprint to
 * draw.** Category counts come from encrypted metadata — count and type are
 * plaintext, titles and payloads are not — so this screen renders before any
 * decryption, which is what lets Home be the screen you land on rather than a
 * wall in front of one.
 *
 * ⚠️ **The check-in confirms here, behind a fingerprint, and nowhere else.**
 * `useConfirmAlive` runs `LocalAuthentication` with `disableDeviceFallback` and
 * only then records, so a tap alone can never say "still alive" — an unlocked
 * phone in the wrong hands must not be able to suppress delivery forever.
 */
import { useRef } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { CheckInHero } from "@workspace/ui-native/components/wassiya/check-in-hero"
import { InitialDisc } from "@workspace/ui-native/components/wassiya/initial-disc"
import { StatTile } from "@workspace/ui-native/components/wassiya/stat-tile"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import {
  BadgeCheck,
  FileText,
  Route as RouteIcon,
  ShieldCheck,
  Users,
  Wallet,
} from "lucide-react-native"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { useCheckInState } from "@/hooks/use-checkin-state"
import { useConfirmAlive } from "@/hooks/use-confirm-alive"
import { useProtectionScore } from "@/hooks/use-protection-score"
import { useStrings } from "@/i18n/use-strings"
import { CheckInSettingsSheet } from "@/screens/home/components/checkin-settings-sheet"

export function HomeScreen() {
  const { t, locale } = useStrings("home")
  const { t: claimCopy } = useStrings("protection/claim")
  const me = useQuery(api.users.me)
  const rows = useQuery(api.assets.list, {})
  const heirs = useQuery(api.heirs.list)
  const claims = useQuery(api.claims.againstMe)

  const checkin = useCheckInState()
  // The gate. The bar renders the button; this runs the fingerprint.
  const alive = useConfirmAlive()

  const checkInSheet = useRef<TrueSheet>(null)
  const openCheckInSettings = () => void checkInSheet.current?.present()

  const score = useProtectionScore({
    identity: t.itemIdentity,
    key: t.itemKey,
    guardian: t.itemGuardian,
    sheet: t.itemSheet,
    heirs: t.itemHeirs,
    routing: t.itemRouting,
    checkin: t.itemCheckin,
  })

  const openClaim = claims?.find((claim) => claim.canVeto) ?? null
  const total = rows?.length ?? 0
  const unrouted =
    rows?.filter((row) => row.recipientRule !== "explicit").length ?? 0
  const heirCount = heirs?.length ?? 0

  const has = (id: string) =>
    score.items.find((item) => item.id === id)?.done === true

  // The line above the grid. The check-in bar owns its own gap, so it is
  // skipped here rather than named twice on one screen.
  const gap = score.items.find((item) => !item.done && item.id !== "checkin")

  // `inset="page"`, not `"tab"`. This app's tab bar is laid out in normal flow
  // rather than overlaying the screen, so `tab`'s 112px of clearance was never
  // clearance — it was dead space at the end of every scroll. The vault ends
  // the same distance above the bar.
  return (
    <Screen inset="page" contentClassName="gap-header">
      <View className="flex-row items-center gap-3">
        <InitialDisc name={me?.name ?? ""} />
        <View className="min-w-0 flex-1">
          <Text variant="metaSm">{greeting(t)}</Text>
          <Text variant="pageTitle">{firstName(me?.name)}</Text>
        </View>
      </View>

      {/* Above everything: a veto window is measured in days and closes whether
          or not anyone opened the app. Nothing outranks it. */}
      {openClaim !== null ? (
        <AlertBanner
          variant="security"
          title={claimCopy.title}
          description={claimCopy.intro.replace(
            "{name}",
            openClaim.claimantName
          )}
          actions={
            <Button size="sm" onPress={() => router.push("/protection/claim")}>
              <Text>{claimCopy.review}</Text>
            </Button>
          }
        />
      ) : null}

      {/* `onEnable` and `onOpenSettings` open the same sheet. They are one
          decision — how often to be asked — and having "off" push a screen
          while "settings" opened a sheet would make one choice two objects. */}
      <CheckInHero
        state={checkin.state}
        detail={checkin.detail}
        locale={locale}
        failed={alive.failed}
        onConfirm={alive.confirm}
        onEnable={openCheckInSettings}
        onOpenSettings={openCheckInSettings}
      />

      <CheckInSettingsSheet
        ref={checkInSheet}
        onSaved={() => void checkInSheet.current?.dismiss()}
      />

      <View className="gap-3">
        <Text
          variant="sectionLabel"
          className={gap !== undefined ? "text-terracotta-700" : ""}
        >
          {gap === undefined
            ? t.allReady
            : t.missing.replace("{what}", gap.label)}
        </Text>

        <View className="gap-row flex-row flex-wrap">
          <StatTile
            icon={Wallet}
            label={t.itemAssets}
            value={fmtNum(total, locale)}
            emphasis="count"
            tone={total === 0 ? "terracotta" : "sand"}
            onPress={() => router.push("/assets")}
          />
          <StatTile
            icon={Users}
            label={t.itemHeirs}
            value={fmtNum(heirCount, locale)}
            emphasis="count"
            tone={heirCount === 0 ? "terracotta" : "sand"}
            onPress={() => router.push("/heirs")}
          />
          {/* The commonest silent failure in the product gets a tile of its own
              rather than a footnote on the assets one. */}
          <StatTile
            icon={RouteIcon}
            label={t.itemRouting}
            value={
              unrouted === 0
                ? t.stateRouted
                : t.stateUnrouted.replace("{n}", fmtNum(unrouted, locale))
            }
            tone={unrouted === 0 ? "olive" : "terracotta"}
            // Into ٤.١ with its "بلا مستلم" chip already set. "من يستلم ماذا؟"
            // was a separate screen whose only content was this same list,
            // grouped and filtered — so it is now this same list, filtered.
            onPress={() =>
              router.push({
                pathname: "/assets",
                params: { filter: "unrouted" },
              })
            }
          />
          <StatTile
            icon={ShieldCheck}
            label={t.itemGuardian}
            value={has("guardian") ? t.stateOn : t.stateOff}
            tone={has("guardian") ? "olive" : "terracotta"}
            onPress={() => router.push("/protection/guardian")}
          />
          <StatTile
            icon={FileText}
            label={t.itemSheet}
            value={has("sheet") ? t.statePrinted : t.stateNotPrinted}
            tone={has("sheet") ? "olive" : "terracotta"}
            onPress={() => router.push("/setup/recovery-kit")}
          />
          {/* Sixth so the grid closes as 2×3. An odd count leaves the last
              tile stretched across the full width, which reads as a different
              kind of thing rather than the last of a set. */}
          <StatTile
            icon={BadgeCheck}
            label={t.itemIdentity}
            value={has("identity") ? t.stateVerified : t.stateUnverified}
            tone={has("identity") ? "olive" : "terracotta"}
            onPress={() => router.push("/setup/kyc")}
          />
        </View>
      </View>
    </Screen>
  )
}

/**
 * Time-of-day greeting. Read at render on purpose and not memoised: it's a
 * label, not a countdown, and being an hour stale across a long session is
 * invisible where a frozen day-counter would not be.
 */
function greeting(t: Record<string, string>): string {
  const hour = new Date().getHours()
  if (hour < 12) return t.greetMorning!
  if (hour < 17) return t.greetAfternoon!
  return t.greetEvening!
}

/** Greeted by first name. Arabic names are space-separated. */
function firstName(full: string | null | undefined): string {
  return (full ?? "").trim().split(/\s+/u)[0] ?? ""
}
