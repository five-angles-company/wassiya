/**
 * The guardian's half of ٨.١.
 *
 * `guardians.approveRecovery` returns the **sealed** share to its own guardian
 * and to nobody else. It is opened here, on this device, with the X25519 secret
 * key that was generated in ٦.٢b and has never left it — and the plaintext then
 * exists in exactly one place in the world: this screen. The deployment cannot
 * produce it, and neither can we.
 *
 * ## Why the warning comes before the share, not after
 *
 * This is the single most socially engineerable moment in the product. Whoever
 * holds this share **and** the printed sheet opens the vault, and a guardian is
 * by definition someone who trusts the caller. "Make sure you are really
 * speaking to the owner" is worth nothing under the value they are about to
 * copy; it has to be read before the thing appears.
 *
 * The share is shown rather than sent because there is no channel this app
 * could use that the owner has already chosen to trust. Handing it to the
 * guardian and stepping back is the honest design — the same reason ٦.٢'s
 * invite token travels out of band.
 *
 * ## The copy button, and what it costs
 *
 * Copying puts the share somewhere `useSecureScreen` does not reach. On
 * Android 13+ the clipboard is also *remembered* by the keyboard, and
 * `expo-clipboard` exposes no way to mark a clip sensitive or to purge that
 * history — so this is a real, unfixable-from-here leak, not a theoretical one.
 *
 * It stays anyway, and the reason is arithmetic: the share is 64 hex
 * characters. A guardian reading those aloud down a phone line to a relative
 * who has just lost their home will get them wrong, repeatedly, and the failure
 * mode of a mistyped share is indistinguishable from a tampered one — the owner
 * is told the halves didn't match and has no way to tell which. Forcing manual
 * transcription would trade a bounded local leak for a recovery that regularly
 * doesn't work.
 *
 * What we can do, we do: the clip is cleared when the share is dismissed and
 * when the screen unmounts, which bounds the window to the ceremony itself.
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
  | { status: "open"; share: string }
  | { status: "failed" }
  | { status: "keyLost" }

export function GuardianApproveScreen() {
  const { t } = useStrings("recovery/approve")
  const { t: common } = useStrings("common")
  // The plaintext share renders here; screenshots must not.
  useSecureScreen("recovery/approve")

  const guardianships = useQuery(api.guardians.guardianFor)
  const approve = useMutation(api.guardians.approveRecovery)
  const [state, setState] = useState<State>({ status: "idle" })
  const [copied, setCopied] = useState(false)

  async function open(guardianId: Id<"guardians">) {
    setState({ status: "working" })
    let secretKey: Uint8Array | null = null
    try {
      const { guardianShareSealed } = await approve({ guardianId })
      secretKey = await readGuardianKey(t.prompt)
      const share = openFromGuardian(
        new Uint8Array(guardianShareSealed),
        secretKey
      )
      const hex = bytesToHex(share)
      share.fill(0)
      setState({ status: "open", share: hex })
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
  // clipboard *history*; see the header.
  useEffect(() => {
    return () => {
      if (copied) void Clipboard.setStringAsync("")
    }
  }, [copied])

  if (state.status === "open") {
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

        <Text className="mt-4 text-[14.5px] leading-[1.75] text-muted-foreground">
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
              // Drop the plaintext from state on the way out rather than
              // leaving it mounted behind a back gesture, and take the clip
              // with it.
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
      <Text className="mt-3 text-[14.5px] leading-[1.75] text-muted-foreground">
        {t.intro}
      </Text>

      {guardianships !== undefined && guardianships.length === 0 ? (
        <EmptyState className="mt-10" icon={ShieldCheck} title={t.empty} />
      ) : (
        <View className="mt-header gap-row">
          {(guardianships ?? []).map((row) => (
            <View
              key={row.guardianId}
              className="rounded-card bg-card gap-3 p-4"
            >
              <View className="flex-row items-center gap-3">
                <InitialDisc name={row.subjectName ?? ""} />
                <View className="min-w-0 flex-1">
                  <Text variant="rowTitle">{row.subjectName ?? ""}</Text>
                  <Text variant="metaSm" className="text-muted-foreground">
                    {t.relation.replace("{relation}", row.relation)}
                  </Text>
                </View>
              </View>
              <Button
                size="sm"
                variant="outline"
                onPress={() => void open(row.guardianId)}
                disabled={state.status === "working"}
              >
                <Text>
                  {state.status === "working" ? t.approving : t.approve}
                </Text>
              </Button>
            </View>
          ))}
        </View>
      )}

      {state.status === "failed" || state.status === "keyLost" ? (
        <Text variant="meta" className="text-terracotta-800 mt-4 leading-[1.7]">
          {state.status === "keyLost" ? t.keyLost : t.failed}
        </Text>
      ) : null}
    </Screen>
  )
}
