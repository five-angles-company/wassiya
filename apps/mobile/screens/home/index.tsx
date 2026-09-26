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
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { CheckInHero } from "@workspace/ui-native/components/wassiya/check-in-hero"
import { InitialDisc } from "@workspace/ui-native/components/wassiya/initial-disc"
import { StatTile } from "@workspace/ui-native/components/wassiya/stat-tile"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import {
  BadgeCheck,
  FileText,
  Lock,
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
  const executors = useQuery(api.executors.list)
  const claims = useQuery(api.claims.againstMe)

  const yearly = useQuery(api.executors.yearlyCheck)
  const confirmYearly = useMutation(api.executors.confirmYearlyCheck)

  const checkin = useCheckInState()
  // The gate. The bar renders the button; this runs the fingerprint.
  const alive = useConfirmAlive()

  const checkInSheet = useRef<TrueSheet>(null)
  const openCheckInSettings = () => void checkInSheet.current?.present()

  const score = useProtectionScore({
    identity: t.itemIdentity,
    key: t.itemKey,
    sheet: t.itemSheet,
    executors: t.itemExecutors,
    delivery: t.itemDelivery,
    checkin: t.itemCheckin,
  })

  const openClaim = claims?.find((claim) => claim.open) ?? null
  const total = rows?.length ?? 0
  const privateCount = rows?.filter((row) => !row.handedOver).length ?? 0
  const executorCount = executors?.length ?? 0

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
          or not anyone opened the app. Nothing outranks it, and the heart right
          below is what stops it — there is no second "I'm alive" button. */}
      {openClaim !== null ? (
        <AlertBanner
          variant="security"
          title={claimCopy.title}
          description={[
            claimCopy.intro.replace("{name}", openClaim.claimantName),
            openClaim.vetoDeadline === null
              ? null
              : claimCopy.deadline.replace(
                  "{date}",
                  fmtDate(new Date(openClaim.vetoDeadline), locale)
                ),
          ]
            .filter((line) => line !== null)
            .join("\n\n")}
        />
      ) : alive.claimsStopped > 0 ? (
        <AlertBanner variant="success" description={claimCopy.stopped} />
      ) : null}

      {/* Yearly, and only once a year: an owner who is asked the same thing
          every week stops reading the question. */}
      {yearly?.due === true ? (
        <AlertBanner
          variant="info"
          title={t.contactsTitle}
          description={t.contactsBody}
          actions={
            <>
              <Button size="sm" onPress={() => router.push("/executors")}>
                <Text>{t.contactsReview}</Text>
              </Button>
              <Button
                size="sm"
                variant="outline"
                onPress={() => void confirmYearly({})}
              >
                <Text>{t.contactsConfirm}</Text>
              </Button>
            </>
          }
        />
      ) : null}

      {/* `onEnable` and `onOpenSettings` open the same sheet. They are one
          decision — how often to be asked — and having "off" push a screen
          while "settings" opened a sheet would make one choice two objects. */}
      <CheckInHero
        // An open report asks the question whatever the check-in says — even
        // with the check-in off, an owner must be able to say they are alive.
        state={openClaim !== null ? "overdue" : checkin.state}
        detail={openClaim !== null ? undefined : checkin.detail}
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
            label={t.itemExecutors}
            value={fmtNum(executorCount, locale)}
            emphasis="count"
            tone={executorCount === 0 ? "terracotta" : "sand"}
            onPress={() => router.push("/executors")}
          />
          {/* Private is the owner's choice, so it is a count, never a warning. */}
          <StatTile
            icon={Lock}
            label={t.itemPrivate}
            value={
              privateCount === 0
                ? t.stateAllHandedOver
                : fmtNum(privateCount, locale)
            }
            emphasis={privateCount === 0 ? undefined : "count"}
            tone="sand"
            onPress={() =>
              router.push({
                pathname: "/assets",
                params: { filter: "private" },
              })
            }
          />
          <StatTile
            icon={ShieldCheck}
            label={t.itemDelivery}
            value={has("delivery") ? t.stateDeliveryReady : t.stateDeliveryStale}
            tone={has("delivery") ? "olive" : "terracotta"}
            onPress={() => router.push("/executors")}
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
