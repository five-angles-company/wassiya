/**
 * ٧ — the guardian's side of a death claim.
 *
 * Two duties land here, and until this screen existed both were dead ends:
 * `claims.guardianConfirm` and `release.guardianShareForClaim` were written,
 * tested by nothing, and called by no UI anywhere in the product. A claim the
 * admin console approved sat in `guardian_review` permanently, and a released
 * claim left the heir holding one half of a key with no way to obtain the other.
 *
 * ## Confirming is biometric-gated, for the veto's reason mirrored
 *
 * The owner's veto is gated because *"a tap on an unlocked handset"* must not be
 * able to suppress a legitimate claim. The mirror is exactly as true: a tap on a
 * guardian's unlocked handset would advance a claim toward releasing someone's
 * entire vault. Same gate, same `disableDeviceFallback: true`, and the mutation
 * runs only after `auth.success` — the pattern `use-confirm-alive` establishes.
 *
 * ## There is no "decline"
 *
 * The backend has no such transition, and that is right rather than missing: a
 * guardian who is unsure should let the claim wait, not kill it. Doubt stalls a
 * claim; only the owner can end one. The screen says so instead of offering a
 * button that would have to lie.
 *
 * ## The share half repeats `recovery/approve`'s ceremony deliberately
 *
 * Same secure screen, same warning-before-value ordering, same bounded
 * clipboard. A guardian who has done the recovery ceremony should recognise
 * this one on sight, because the risk is identical: whoever holds this half
 * together with the heir's opens what the owner left them.
 */
import { useEffect, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { bytesToHex } from "@workspace/crypto/bytes"
import { openFromGuardian } from "@workspace/crypto/guardian"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { EmptyState } from "@workspace/ui-native/components/wassiya/empty-state"
import { InitialDisc } from "@workspace/ui-native/components/wassiya/initial-disc"
import { isolateLtr } from "@workspace/ui-native/lib/rtl"
import * as Clipboard from "expo-clipboard"
import * as LocalAuthentication from "expo-local-authentication"
import { ShieldCheck } from "lucide-react-native"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { readGuardianKey, VaultKeyLostError } from "@/lib/secure-vault"

type State =
  | { status: "idle" }
  | { status: "working" }
  | { status: "confirmed" }
  | { status: "share"; share: string }
  | { status: "failed" }
  | { status: "biometricFailed" }
  | { status: "keyLost" }

export function GuardianClaimScreen() {
  const { t } = useStrings("protection/guardian/claim")
  const { t: common } = useStrings("common")
  // The plaintext share renders on this screen; screenshots must not.
  useSecureScreen("protection/guardian/claim")

  const duties = useQuery(api.guardians.pendingApprovals)
  const confirmClaim = useMutation(api.claims.guardianConfirm)
  const openShare = useMutation(api.release.guardianShareForClaim)
  const [state, setState] = useState<State>({ status: "idle" })
  const [copied, setCopied] = useState(false)

  async function confirm(claimId: Id<"claims">) {
    setState({ status: "working" })
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: t.confirmPrompt,
        disableDeviceFallback: true,
      })
      // The mutation runs only after a successful biometric. There is no path
      // where a tap alone confirms a death.
      if (!auth.success) {
        setState({ status: "biometricFailed" })
        return
      }
      await confirmClaim({ claimId })
      setState({ status: "confirmed" })
    } catch {
      setState({ status: "failed" })
    }
  }

  async function handover(claimId: Id<"claims">) {
    setState({ status: "working" })
    let secretKey: Uint8Array | null = null
    try {
      const auth = await LocalAuthentication.authenticateAsync({
        promptMessage: t.handoverPrompt,
        disableDeviceFallback: true,
      })
      if (!auth.success) {
        setState({ status: "biometricFailed" })
        return
      }
      const { guardianShareSealed } = await openShare({ claimId })
      secretKey = await readGuardianKey(t.handoverPrompt)
      const share = openFromGuardian(
        new Uint8Array(guardianShareSealed),
        secretKey
      )
      const hex = bytesToHex(share)
      // Zero the plaintext bytes as soon as they are rendered as hex — the same
      // discipline the recovery ceremony keeps.
      share.fill(0)
      setState({ status: "share", share: hex })
    } catch (error) {
      setState(
        error instanceof VaultKeyLostError
          ? { status: "keyLost" }
          : { status: "failed" }
      )
    } finally {
      secretKey?.fill(0)
    }
  }

  // Bounds the clipboard window to this screen's life. Cannot reach Android's
  // clipboard history — see `recovery/approve`'s header for why that is
  // accepted rather than solved.
  useEffect(() => {
    return () => {
      if (copied) void Clipboard.setStringAsync("")
    }
  }, [copied])

  if (state.status === "share") {
    return (
      <Screen>
        <BackButton label={common.back} />
        <Text variant="screenTitle" className="mt-4">
          {t.shareTitle}
        </Text>

        {/* Before the share, deliberately. */}
        <AlertBanner
          className="mt-4"
          variant="security"
          description={t.verifyFirst}
        />

        <Text className="text-muted-foreground mt-4 text-[14.5px] leading-[1.75]">
          {t.shareBody}
        </Text>

        <View className="rounded-card bg-card mt-4 p-4">
          <Text className="font-latin-medium text-[13px] leading-[1.9]">
            {isolateLtr(state.share)}
          </Text>
        </View>

        <View className="mt-4 gap-2">
          <Button
            onPress={() => {
              void Clipboard.setStringAsync(state.share).then(() =>
                setCopied(true)
              )
            }}
          >
            <Text>{copied ? t.copied : t.copy}</Text>
          </Button>
          <Button
            variant="outline"
            onPress={() => {
              if (copied) void Clipboard.setStringAsync("")
              setState({ status: "idle" })
              setCopied(false)
            }}
          >
            <Text>{t.done}</Text>
          </Button>
        </View>
      </Screen>
    )
  }

  return (
    <Screen>
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mt-4">
        {t.title}
      </Text>
      <Text className="text-muted-foreground mt-3 text-[14.5px] leading-[1.75]">
        {t.intro}
      </Text>

      {duties !== undefined && duties.length === 0 ? (
        <EmptyState className="mt-10" icon={ShieldCheck} title={t.empty} />
      ) : (
        <View className="mt-header gap-row">
          {(duties ?? []).map((row) => (
            <View
              key={row.claimId}
              className="rounded-card bg-card gap-3 p-4"
            >
              <View className="flex-row items-center gap-3">
                <InitialDisc name={row.subjectName ?? ""} />
                <View className="min-w-0 flex-1">
                  <Text variant="rowTitle">{row.subjectName ?? ""}</Text>
                  <Text variant="metaSm" className="text-muted-foreground">
                    {t.claimant.replace("{name}", row.claimantName)}
                  </Text>
                </View>
              </View>

              <Text variant="metaSm" className="text-muted-foreground">
                {row.certificateName === null
                  ? t.certificateNone
                  : t.certificate.replace("{name}", row.certificateName)}
              </Text>

              {row.duty === "confirm" ? (
                <>
                  <Text className="text-[14.5px] leading-[1.75]">
                    {t.confirmBody}
                  </Text>
                  {row.heirLinked ? (
                    <Button
                      size="sm"
                      onPress={() => void confirm(row.claimId)}
                      disabled={state.status === "working"}
                    >
                      <Text>
                        {state.status === "working" ? t.confirming : t.confirm}
                      </Text>
                    </Button>
                  ) : (
                    // `guardianConfirm` throws on a claim with no heir linked.
                    // Saying so beats offering a button that fails.
                    <Text
                      variant="meta"
                      className="text-terracotta-800 leading-[1.7]"
                    >
                      {t.notLinked}
                    </Text>
                  )}
                </>
              ) : (
                <>
                  <Text className="text-[14.5px] leading-[1.75]">
                    {t.handoverBody}
                  </Text>
                  <Button
                    size="sm"
                    variant="outline"
                    onPress={() => void handover(row.claimId)}
                    disabled={state.status === "working"}
                  >
                    <Text>{t.handover}</Text>
                  </Button>
                </>
              )}
            </View>
          ))}
        </View>
      )}

      {/* Doing nothing is a legitimate choice, so it is named rather than left
          for a guardian to infer from the absence of a decline button. */}
      <View className="rounded-card bg-card mt-6 gap-2 p-4">
        <Text variant="rowTitle">{t.unsureTitle}</Text>
        <Text className="text-muted-foreground text-[14.5px] leading-[1.75]">
          {t.unsureBody}
        </Text>
      </View>

      {state.status === "confirmed" ? (
        <Text variant="meta" className="text-olive-800 mt-4 leading-[1.7]">
          {t.confirmed}
        </Text>
      ) : null}
      {state.status === "failed" ||
      state.status === "biometricFailed" ||
      state.status === "keyLost" ? (
        <Text variant="meta" className="text-terracotta-800 mt-4 leading-[1.7]">
          {state.status === "keyLost"
            ? t.keyLost
            : state.status === "biometricFailed"
              ? t.biometricFailed
              : t.failed}
        </Text>
      ) : null}
    </Screen>
  )
}
