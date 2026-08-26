/**
 * ٨.١ — استعادة الخزنة. The ceremony the whole 2-of-3 exists for.
 *
 * This replaces the stub that has stood here since section ٢ shipped. Two
 * states route here and neither can be resolved by retrying setup: a phone the
 * owner has never enrolled, and one whose keystore invalidated MK because its
 * biometrics changed. `lib/setup-flow.ts` has always sent both here.
 *
 * ## What actually happens
 *
 *   K_rec = S_paper ⊕ S_guardian        MK = unwrap(mkWrappedByRecovery, K_rec)
 *
 * The paper share is typed in from the printed sheet. The guardian share is
 * handed over **by a person** — the guardian opens their own app, approves, and
 * sends it out of band. This deployment holds the wrapper and the *sealed*
 * guardian share and can open neither, which is exactly why recovery needs two
 * humans and not a support ticket.
 *
 * ## Three things done in order, and the order matters
 *
 *  1. **MK is sealed into the keystore before anything is marked used.** A
 *     crash between them leaves a working device and a sheet the server still
 *     believes is unused — harmless. The reverse would burn the sheet without
 *     recovering anything.
 *  2. **S_guardian is stored locally too.** `rotatePaperShare` needs it to
 *     reissue a sheet, so a device that recovered without it could never print
 *     a replacement — which matters immediately, because step 3 is telling the
 *     owner their old sheet is spent.
 *  3. **`markPaperUsed` last**, and the success screen pushes straight at
 *     reprinting. A recovered vault whose only sheet has been read aloud to a
 *     guardian is one bad day from being unrecoverable again.
 */
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { hexToBytes } from "@workspace/crypto/bytes"
import { decodePaperCode } from "@workspace/crypto/papercode"
import { recoverMk } from "@workspace/crypto/recovery"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { useClerk } from "@clerk/expo"
import { router } from "expo-router"
import { ScrollView, View } from "react-native"

import { Field } from "@/components/field"
import { Screen } from "@/components/screen"
import { useSecureScreen } from "@/hooks/use-secure-screen"
import { useStrings } from "@/i18n/use-strings"
import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { SECRET_INPUT_PROPS } from "@/lib/secret-input-props"
import {
  patchEnrolment,
  storeGuardianShare,
  storeRecoveredMk,
} from "@/lib/secure-vault"

type Phase = "input" | "working" | "done" | "failed" | "badCode"

export function RecoveryScreen() {
  const { t } = useStrings("recovery")
  // Both halves are on screen as plaintext while they are typed.
  useSecureScreen("recovery")

  const keyring = useQuery(api.keyring.get)
  const markPaperUsed = useMutation(api.keyring.markPaperUsed)
  const { signOut } = useClerk()

  const [code, setCode] = useState("")
  const [share, setShare] = useState("")
  const [phase, setPhase] = useState<Phase>("input")

  async function recover() {
    if (keyring === null || keyring === undefined) return
    setPhase("working")

    let sPaper: Uint8Array | null = null
    let sGuardian: Uint8Array | null = null
    let mk: Uint8Array | null = null
    try {
      ensureWebCrypto()

      // Decoded first and separately: a mistyped sheet is by far the commonest
      // failure and deserves its own message rather than "those two halves
      // didn't work".
      try {
        sPaper = decodePaperCode(code).sPaper
      } catch {
        setPhase("badCode")
        return
      }

      sGuardian = hexToBytes(share.trim().replace(/\s+/g, ""))
      mk = recoverMk(
        sPaper,
        sGuardian,
        new Uint8Array(keyring.mkWrappedByRecovery)
      )

      // 1 — the key, before anything is spent.
      await storeRecoveredMk(mk, t.storePrompt)
      // 2 — so this device can reissue a sheet later.
      await storeGuardianShare(sGuardian, t.storePrompt)
      await patchEnrolment({
        hasGuardianShare: true,
        paperVersion: keyring.paperVersion,
      })
      // 3 — last.
      await markPaperUsed({})

      setPhase("done")
    } catch {
      setPhase("failed")
    } finally {
      // Whatever happened, none of this may outlive the attempt.
      sPaper?.fill(0)
      sGuardian?.fill(0)
      mk?.fill(0)
    }
  }

  if (phase === "done") {
    return (
      <Screen>
        <Text variant="screenTitle">{t.doneTitle}</Text>
        <Text className="mt-3 text-[15px] leading-[1.75] text-muted-foreground">
          {t.doneBody}
        </Text>
        <View className="grow" />
        <View className="gap-2">
          <Button onPress={() => router.replace("/setup/recovery-kit")}>
            <Text>{t.reprint}</Text>
          </Button>
          <Button variant="outline" onPress={() => router.replace("/")}>
            <Text>{t.later}</Text>
          </Button>
        </View>
      </Screen>
    )
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-8"
      keyboardShouldPersistTaps="handled"
    >
      <Text variant="screenTitle">{t.title}</Text>
      <Text className="mt-3 text-[15px] leading-[1.75] text-muted-foreground">
        {t.intro}
      </Text>
      <View className="rounded-card bg-olive-100 mt-4 p-4">
        <Text variant="metaSm" className="text-olive-700 leading-[1.75]">
          {t.bothNeeded}
        </Text>
      </View>

      {keyring === null ? (
        <AlertBanner
          className="mt-header"
          variant="security"
          description={t.noKeyring}
        />
      ) : (
        <>
          <Text variant="sectionLabel" className="mt-header mb-2">
            {t.step1}
          </Text>
          <Field
            {...SECRET_INPUT_PROPS}
            label={t.codeLabel}
            hint={t.codeHint}
            value={code}
            onChangeText={(value) => {
              setCode(value)
              if (phase !== "input") setPhase("input")
            }}
            autoCapitalize="characters"
            multiline
            className="h-auto min-h-24 py-3 text-left"
            error={phase === "badCode" ? t.codeInvalid : undefined}
          />

          <Text variant="sectionLabel" className="mt-header mb-2">
            {t.step2}
          </Text>
          <Field
            {...SECRET_INPUT_PROPS}
            label={t.shareLabel}
            hint={t.shareHint}
            placeholder={t.sharePlaceholder}
            value={share}
            onChangeText={(value) => {
              setShare(value)
              if (phase !== "input") setPhase("input")
            }}
            multiline
            className="h-auto min-h-20 py-3 text-left"
          />

          {phase === "failed" ? (
            <Text variant="meta" className="text-terracotta-800 mt-4 leading-[1.7]">
              {t.failed}
            </Text>
          ) : null}

          <Button
            className="mt-6"
            onPress={() => void recover()}
            disabled={
              phase === "working" ||
              code.trim().length === 0 ||
              share.trim().length === 0
            }
          >
            <Text>{phase === "working" ? t.recovering : t.recover}</Text>
          </Button>
        </>
      )}

      <View className="grow" />

      <Button
        variant="outline"
        className="mt-6"
        onPress={() => {
          void (async () => {
            await signOut()
            router.replace("/")
          })()
        }}
      >
        <Text>{t.signOut}</Text>
      </Button>
    </ScrollView>
  )
}
