/**
 * ٧.٥ — the owner's veto interrupt, and the one screen of section ٧ that is not
 * in the web funnel: *"it must reach a person who is alive, on their own phone,
 * with a biometric to cancel."*
 *
 * A veto asserts "I am not dead". A tap on an unlocked handset would let anyone
 * holding the phone suppress a legitimate claim, and a web link would let anyone
 * who intercepted an email do the same. The biometric is what makes the
 * assertion belong to a person rather than a device — the same reason 6.4's
 * check-in is gated.
 *
 * The screen also states what happens if the owner ignores it. Most claims are
 * genuine, and a screen that only offered "stop this" would read as though
 * objecting were the expected response.
 */
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { fmtDate, fmtNum } from "@workspace/ui-native/lib/format"
import * as LocalAuthentication from "expo-local-authentication"
import { ShieldCheck } from "lucide-react-native"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

type VetoState = "idle" | "working" | "done" | "denied" | "failed"

export function ClaimVetoScreen() {
  const { t, locale } = useStrings("protection/claim")
  const { t: common } = useStrings("common")
  const claims = useQuery(api.claims.againstMe)
  const veto = useMutation(api.claims.veto)
  const [state, setState] = useState<VetoState>("idle")
  // A render-stable clock read, and it must sit above the early returns below —
  // a hook after a conditional return runs in a different order between
  // renders. Calling `Date.now()` during render would also be impure and would
  // freeze at first paint while looking live; seeded once per mount is honest,
  // since a day-granularity countdown need not tick while the screen is open.
  const [now] = useState(() => Date.now())

  // Only a claim inside its window can be stopped; the backend enforces this
  // too, and after the deadline there is genuinely nothing left to undo.
  const open = claims?.find((claim) => claim.canVeto) ?? null

  async function stopClaim(claimId: Id<"claims">) {
    setState("working")
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: t.vetoPrompt,
        // No passcode fallback, for the same reason as the check-in: a
        // passcode is something a person holding the phone may also have.
        disableDeviceFallback: true,
      })
      if (!auth.success) {
        setState("denied")
        return
      }
      await veto({ claimId })
      setState("done")
    } catch {
      setState("failed")
    }
  }

  if (claims !== undefined && open === null) {
    return (
      <View className="px-gutter flex-1 bg-background pt-4">
        <BackButton label={common.back} />
        <EmptyState className="mt-10" icon={ShieldCheck} title={t.none} />
      </View>
    )
  }

  const daysLeft =
    open?.vetoDeadline == null
      ? null
      : Math.max(0, Math.ceil((open.vetoDeadline - now) / 86_400_000))

  return (
    <Screen>
      <BackButton label={common.back} />

      {state === "done" ? (
        <View className="mt-6 gap-4">
          <Text variant="screenTitle">{t.title}</Text>
          <AlertBanner variant="success" description={t.vetoed} />
        </View>
      ) : open === null ? null : (
        <View className="mt-4 gap-4">
          <Text variant="screenTitle">{t.title}</Text>

          <Text className="text-[15px] leading-[1.75] text-muted-foreground">
            {t.intro.replace("{name}", open.claimantName)}
          </Text>

          {open.vetoDeadline !== null ? (
            <View className="rounded-card bg-terracotta-100 gap-2 p-4">
              <Text
                variant="rowTitle"
                className="text-terracotta-800 text-[26px]"
              >
                {t.daysLeft.replace("{n}", fmtNum(daysLeft ?? 0, locale))}
              </Text>
              <Text
                variant="metaSm"
                className="text-terracotta-800 leading-[1.7]"
              >
                {t.deadline.replace(
                  "{date}",
                  fmtDate(new Date(open.vetoDeadline), locale)
                )}
              </Text>
            </View>
          ) : null}

          {/* The other half of the truth: inaction is a choice with a result. */}
          <View className="rounded-card bg-card gap-1.5 p-4">
            <Text variant="rowTitle">{t.ignoreTitle}</Text>
            <Text variant="metaSm" className="leading-[1.7]">
              {t.ignoreBody}
            </Text>
          </View>

          <Button
            onPress={() => void stopClaim(open.id)}
            disabled={state === "working"}
          >
            <Text>{state === "working" ? t.vetoing : t.veto}</Text>
          </Button>

          {state === "denied" || state === "failed" ? (
            <Text variant="meta" className="text-terracotta-800 leading-[1.7]">
              {state === "denied" ? t.biometricFailed : t.vetoFailed}
            </Text>
          ) : null}
        </View>
      )}
    </Screen>
  )
}
