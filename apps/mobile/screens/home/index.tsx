/**
 * الرئيسية — the readiness surface.
 *
 * ## What changed, and why
 *
 * Home used to be a dashboard: a 4/5 ring, a row of chips, an amber banner, a
 * grid of category tiles and a routing summary — seven blocks, none of which
 * answered the question an owner actually has. It also duplicated the
 * Protection Centre, which rendered the same score object one tap away.
 *
 * It now leads with the two things that matter, in the order they're used:
 *
 *  1. **The check-in.** Declaring you're alive is the only thing anyone does in
 *     this app more than once. It gets the most space on the screen.
 *  2. **The verdict.** One sentence answering *would this actually work?*, and
 *     at most one action. Not a percentage — 4/5 can't distinguish "you should
 *     reprint a sheet" from "your family will receive nothing".
 *
 * ## The constraint that still shapes everything here
 *
 * *"Category counts come from encrypted metadata (count + type are plaintext;
 * titles and payloads are not), so this screen renders before any decryption."*
 *
 * There is still **no `useVault` in this file** and nothing waits on a
 * fingerprint. Every figure comes from server metadata the deployment already
 * sees. That's what lets Home be the screen you land on rather than a wall in
 * front of one.
 *
 * ## ⚠️ The check-in confirms HERE, behind a fingerprint
 *
 * The confirm affordance lives on this screen — it moved from the prompt
 * screen rather than being added alongside it, so there is still exactly one.
 * `useConfirmAlive` runs `LocalAuthentication` with `disableDeviceFallback`
 * and only then records; a tap alone can never say "still alive". That is the
 * property AGENTS.md protects — an unlocked phone in the wrong hands must not
 * be able to suppress delivery forever — and it is the fingerprint, not the
 * route, that provides it.
 */
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { CheckInHero } from "@workspace/ui-native/components/wassiya/check-in-hero"
import { InitialDisc } from "@workspace/ui-native/components/wassiya/initial-disc"
import { StatusPill } from "@workspace/ui-native/components/wassiya/status-pill"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { ChevronLeft } from "lucide-react-native"
import { Pressable, View } from "react-native"

import { Screen } from "@/components/screen"
import { useCheckInState } from "@/hooks/use-checkin-state"
import { useConfirmAlive } from "@/hooks/use-confirm-alive"
import { useReadiness } from "@/hooks/use-readiness"
import { fmtCount, type CountForms } from "@/i18n/plural"
import { useStrings } from "@/i18n/use-strings"
import { ReadinessVerdict } from "@/screens/home/components/readiness-verdict"

export function HomeScreen() {
  const { t, locale } = useStrings("home")
  const { t: claimCopy } = useStrings("protection/claim")
  const me = useQuery(api.users.me)
  const rows = useQuery(api.assets.list, {})
  const heirs = useQuery(api.heirs.list)
  const claims = useQuery(api.claims.againstMe)

  const checkin = useCheckInState()
  // The gate. The hero renders the button; this runs the fingerprint.
  const alive = useConfirmAlive()
  const { verdict } = useReadiness(
    {
      identity: t.itemIdentity,
      key: t.itemKey,
      guardian: t.itemGuardian,
      sheet: t.itemSheet,
      heirs: t.itemHeirs,
      routing: t.itemRouting,
      checkin: t.itemCheckin,
    },
    heirs?.length ?? 0
  )

  const openClaim = claims?.find((claim) => claim.canVeto) ?? null
  const total = rows?.length ?? 0
  const unrouted =
    rows?.filter((row) => row.recipientRule !== "explicit").length ?? 0

  const heirForms: CountForms = {
    zero: t.countZero,
    one: t.countOne,
    two: t.countTwo,
    few: t.countFew,
    many: t.countMany,
  }
  const heirLabel = fmtCount(
    heirs?.length ?? 0,
    fmtNum(heirs?.length ?? 0, locale),
    heirForms,
    locale
  )
  const assetForms: CountForms = {
    zero: t.assetZero,
    one: t.assetOne,
    two: t.assetTwo,
    few: t.assetFew,
    many: t.assetMany,
  }
  const assetLabel = fmtCount(total, fmtNum(total, locale), assetForms, locale)


  return (
    <Screen inset="tab" contentClassName="gap-header">
      {/* Greeting. First name only — what makes a security app read as
          someone's own vault rather than an admin console. */}
      <View className="flex-row items-center gap-3">
        <InitialDisc name={me?.name ?? ""} />
        <View className="min-w-0 flex-1">
          <Text variant="metaSm">{greeting(t)}</Text>
          <Text variant="pageTitle">{firstName(me?.name)}</Text>
        </View>
      </View>

      {/* Above even the check-in: a veto window is measured in days and closes
          whether or not anyone opened the app. Nothing outranks it. */}
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

      <CheckInHero
        state={checkin.state}
        detail={checkin.detail}
        locale={locale}
        failed={alive.failed}
        onConfirm={alive.confirm}
        onEnable={() => router.push("/protection/checkin")}
        onOpenSettings={() => router.push("/protection/checkin")}
      />

      {/*
        Always rendered. When the check-in is the blocker the hero above states
        *what* is wrong and this states *why it matters* — two different
        sentences — and only the hero carries a button, so there is still
        exactly one action on screen.
      */}
      <ReadinessVerdict {...verdictProps(verdict, t, heirLabel)} />

      {/*
        Who would actually receive it.

        The abstraction this product suffers from is that "routing" is a table
        of rules nobody pictures. Names and faces are what make an owner notice
        that a person they meant to provide for is receiving nothing — and it
        gives Home something worth its space rather than a decorative filler.
      */}
      {heirs !== undefined && heirs.length > 0 ? (
        <View className="gap-3">
          <Text variant="sectionLabel">{t.whoReceives}</Text>
          <View className="gap-row">
            {heirs.slice(0, 4).map((heir) => (
              <Pressable
                key={heir.id}
                accessibilityRole="button"
                onPress={() => router.push(`/heirs/${heir.id}/preview`)}
                className="active:bg-sand-300 rounded-row bg-card flex-row items-center gap-3 px-4 py-3"
              >
                <InitialDisc name={heir.name} />
                <View className="min-w-0 flex-1">
                  <Text variant="rowTitle">{heir.name}</Text>
                  <Text variant="metaSm" className="mt-0.5">
                    {heir.routedAssetCount === 0
                      ? t.receivesNothing
                      : t.receives.replace(
                          "{n}",
                          fmtCount(
                            heir.routedAssetCount,
                            fmtNum(heir.routedAssetCount, locale),
                            assetForms,
                            locale
                          )
                        )}
                  </Text>
                </View>
                {/* The amber case, and the only one on this row. */}
                {heir.routedAssetCount === 0 ? (
                  <StatusPill status="action">{t.unrouted}</StatusPill>
                ) : null}
              </Pressable>
            ))}
          </View>
        </View>
      ) : null}

      {/* The vault in one quiet line. The old grid of six category tiles put
          "how many notes do I have" at the same visual weight as "would this
          reach my family", which is the wrong ranking here — the Vault tab is
          one tap away and exists to answer it properly. */}
      <Pressable
        onPress={() => router.push("/assets")}
        accessibilityRole="button"
        className="active:bg-sand-300 rounded-row bg-card flex-row items-center gap-3 px-4 py-3.5"
      >
        <View className="min-w-0 flex-1">
          <Text variant="rowTitle">
            {total === 0
              ? t.emptyAssets
              : t.vaultLine
                  .replace("{assets}", assetLabel)
                  .replace("{heirs}", heirLabel)}
          </Text>
          {unrouted > 0 ? (
            <Text variant="metaSm" className="mt-0.5">
              {t.unroutedLine.replace("{n}", fmtNum(unrouted, locale))}
            </Text>
          ) : null}
        </View>
        <Icon as={ChevronLeft} className="text-muted-foreground size-5" flip />
      </Pressable>
    </Screen>
  )
}

/**
 * Maps the verdict to its sentence and its single action.
 *
 * **The `checkin` gap deliberately carries no action.** The hero directly above
 * already offers "فعّله الآن" for exactly that, and two buttons for one task is
 * the duplication this redesign exists to remove. The verdict still states the
 * consequence, because "the switch is off" and "nothing will ever be delivered"
 * are different sentences and only the second one lands.
 */
function verdictProps(
  verdict: ReturnType<typeof useReadiness>["verdict"],
  t: Record<string, string>,
  heirLabel: string
) {
  const question = t.question!

  if (verdict.kind === "ready") {
    return {
      kind: "ready" as const,
      question,
      answer: t.answerReady!.replace("{heirs}", heirLabel),
    }
  }

  // Loading resolves in a frame or two. Showing the question with no answer
  // beats a spinner that flashes a verdict the moment it lands.
  if (verdict.kind === "loading") {
    return { kind: "ready" as const, question, answer: "" }
  }

  const { id, href } = verdict.gap
  const COPY: Record<string, { answer?: string; fix?: string }> = {
    heirs: { answer: t.blockedHeirs, fix: t.fixHeirs },
    routing: { answer: t.blockedRouting, fix: t.fixRouting },
    identity: { answer: t.blockedIdentity, fix: t.fixIdentity },
    key: { answer: t.blockedIdentity },
    checkin: { answer: t.blockedCheckin },
    sheet: { answer: t.riskSheet, fix: t.fixSheet },
    guardian: { answer: t.riskGuardian, fix: t.fixGuardian },
  }
  const copy = COPY[id] ?? {}

  return {
    kind: verdict.kind,
    question,
    answer: copy.answer ?? "",
    action:
      copy.fix !== undefined && href !== undefined
        ? { label: copy.fix, onPress: () => router.push(href) }
        : undefined,
  }
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
