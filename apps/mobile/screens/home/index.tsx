/**
 * الرئيسية — the check-in, what is still to do, and the vault at a glance.
 *
 * "Still to do" lists only what is missing, from `useProtectionScore` — the
 * same list setup ends on — and disappears when nothing is. The check-in is not
 * in it: its card is right above.
 *
 * **There is no `useVault` in this file and nothing waits on a fingerprint to
 * draw.** Counts come from plaintext metadata, so Home renders before any
 * decryption.
 *
 * ⚠️ **The check-in confirms here, behind a fingerprint, and nowhere else.**
 * `useConfirmAlive` runs `LocalAuthentication` with `disableDeviceFallback` and
 * only then records, so a tap alone can never say "still alive" — an unlocked
 * phone in the wrong hands must not be able to suppress delivery forever.
 */
import { useRef, useState } from "react"
import type { TrueSheet } from "@lodev09/react-native-true-sheet"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { CheckInHero } from "@workspace/ui-native/components/wassiya/check-in-hero"
import { ConfirmSheet } from "@workspace/ui-native/components/wassiya/confirm-sheet"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import { router, type Href } from "expo-router"
import {
  BadgeCheck,
  Bell,
  FileText,
  Lock,
  RefreshCw,
  Users,
  Wallet,
  type LucideIcon,
} from "lucide-react-native"
import { View } from "react-native"

import { IconButton } from "@/components/icon-button"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { Section } from "@/components/section"
import { useCheckInState } from "@/hooks/use-checkin-state"
import { useConfirmAlive } from "@/hooks/use-confirm-alive"
import { useProtectionScore, type ProtectionId } from "@/hooks/use-protection-score"
import { useStrings } from "@/i18n/use-strings"
import { CheckInSettingsSheet } from "@/screens/home/components/checkin-settings-sheet"

/** What each missing item asks for, and where it is done. */
type TodoLabel = "todoIdentity" | "todoSheet" | "todoExecutors" | "todoDelivery"

const TODO: Partial<Record<ProtectionId, { icon: LucideIcon; label: TodoLabel; href: Href }>> = {
  identity: { icon: BadgeCheck, label: "todoIdentity", href: "/setup/kyc" },
  sheet: { icon: FileText, label: "todoSheet", href: "/settings/recovery-sheet/reissue" },
  executors: { icon: Users, label: "todoExecutors", href: "/executors/new" },
  delivery: { icon: FileText, label: "todoDelivery", href: "/executors" },
}

export function HomeScreen() {
  const { t, locale } = useStrings("home")
  const { t: claimCopy } = useStrings("protection/claim")
  const { t: notifications } = useStrings("notifications")
  const me = useQuery(api.users.me)
  const rows = useQuery(api.assets.list, {})
  const executors = useQuery(api.executors.list)
  const claims = useQuery(api.claims.againstMe)

  const yearly = useQuery(api.executors.yearlyCheck)
  const confirmYearly = useMutation(api.executors.confirmYearlyCheck)
  const cancelDeletion = useMutation(api.account.cancelDeletion)
  const [yearlyOpen, setYearlyOpen] = useState(false)

  const checkin = useCheckInState()
  // The gate. The card renders the button; this runs the fingerprint.
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

  const executorsMissing = score.items.some((item) => item.id === "executors" && !item.done)
  const todo = score.items.flatMap((item) => {
    const entry = TODO[item.id]
    // "A sheet for every executor" means nothing before there is one.
    if (item.done || entry === undefined) return []
    if (item.id === "delivery" && executorsMissing) return []
    return [{ id: item.id, ...entry }]
  })
  const yearlyDue = yearly?.due === true

  return (
    <Screen>
      <ScreenHeader
        eyebrow={greeting(t)}
        title={firstName(me?.name)}
        trailing={
          <IconButton
            icon={Bell}
            label={notifications.title!}
            onPress={() => router.push("/notifications")}
          />
        }
      />
      <View className="gap-6">
        {/* Above everything: a veto window is measured in days and closes whether
            or not anyone opened the app. The card right below is what stops it —
            there is no second "I'm alive" button. */}
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
        ) : null}

        {me?.deletionDueAt != null ? (
          <AlertBanner
            variant="security"
            description={t.deletionPending!.replace(
              "{date}",
              fmtDate(new Date(me.deletionDueAt), locale)
            )}
            actions={[
              {
                label: t.deletionCancel!,
                onPress: () => void cancelDeletion({}).catch(() => undefined),
              },
            ]}
          />
        ) : null}

        <View className="gap-2">
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
          {openClaim === null && alive.claimsStopped > 0 ? (
            <Text variant="meta" className="text-olive-700">
              {claimCopy.stopped}
            </Text>
          ) : null}
        </View>

        {todo.length > 0 || yearlyDue ? (
          <Section label={t.todoTitle}>
            <View className="rounded-card bg-card overflow-hidden">
              {todo.map((item, index) => (
                <SettingsRow
                  key={item.id}
                  icon={item.icon}
                  label={t[item.label]!}
                  chevron
                  divider={index < todo.length - 1 || yearlyDue}
                  onPress={() => router.push(item.href)}
                />
              ))}
              {yearlyDue ? (
                <SettingsRow
                  icon={RefreshCw}
                  label={t.yearlyRow!}
                  chevron
                  onPress={() => setYearlyOpen(true)}
                />
              ) : null}
            </View>
          </Section>
        ) : null}

        <Section
          label={todo.length === 0 && !yearlyDue ? t.allReady : t.overviewTitle}
          tone={todo.length === 0 && !yearlyDue ? "done" : "default"}
        >
          <View className="rounded-card bg-card overflow-hidden">
            <SettingsRow
              icon={Wallet}
              label={t.itemAssets!}
              value={fmtNum(total, locale)}
              chevron
              divider
              onPress={() => router.push("/assets")}
            />
            <SettingsRow
              icon={Users}
              label={t.itemExecutors!}
              value={fmtNum(executorCount, locale)}
              chevron
              divider={privateCount > 0}
              onPress={() => router.push("/executors")}
            />
            {/* Private is the owner's choice, so it is a count, never a warning. */}
            {privateCount > 0 ? (
              <SettingsRow
                icon={Lock}
                label={t.itemPrivate!}
                value={fmtNum(privateCount, locale)}
                chevron
                onPress={() =>
                  router.push({ pathname: "/assets", params: { filter: "private" } })
                }
              />
            ) : null}
          </View>
        </Section>
      </View>

      <CheckInSettingsSheet
        ref={checkInSheet}
        onSaved={() => void checkInSheet.current?.dismiss()}
      />

      {/* Yearly, and only once a year: an owner asked the same thing every
          week stops reading the question. */}
      <ConfirmSheet
        open={yearlyOpen}
        onClose={() => setYearlyOpen(false)}
        title={t.contactsTitle!}
        body={[t.contactsBody!]}
        tone="primary"
        confirmLabel={t.contactsConfirm!}
        cancelLabel={t.contactsLater!}
        onConfirm={(dismiss) => {
          void confirmYearly({}).then(dismiss)
        }}
      />
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
