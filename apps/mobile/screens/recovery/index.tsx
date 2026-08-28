/**
 * ٨.١ — استعادة الخزنة. One sheet, one person, no second party.
 *
 * Two states route here and neither can be resolved by retrying setup: a phone
 * the owner has never enrolled, and one whose keystore invalidated MK because
 * its biometrics changed. `lib/setup-flow.ts` has always sent both here.
 *
 * ## What actually happens
 *
 *   K_rec = S_paper          MK = unwrap(mkWrappedByRecovery, K_rec, aad)
 *
 * The paper share is typed in from the printed sheet, and that is the whole
 * ceremony. It used to need a guardian's half handed over by a person; it no
 * longer does, which is what makes this screen reachable at all for the many
 * owners who never appointed one. See `packages/crypto/src/recovery.ts`.
 *
 * `aad` binds the wrapper to this account and this sheet generation, so a
 * photographed sheet cannot be replayed against another vault or against a
 * sheet that has since been reprinted. Both halves of it come from the server
 * row, never from local state — a stale `paperVersion` would fail identically
 * to a wrong sheet, and that is the one error message nobody could debug.
 *
 * ## The ordering, which is not interchangeable
 *
 *  1. **MK is sealed into the keystore before anything is marked used.** A
 *     crash between them leaves a working device and a sheet the server still
 *     believes is unused — harmless. The reverse burns the sheet without
 *     recovering anything.
 *  2. **`markPaperUsed` last.** It is also what tells the owner: it writes the
 *     in-app alert *and* sends the mail. With no guardian in the loop there is
 *     no longer a second human who notices a recovery, so this message is the
 *     only thing standing between a stolen sheet and a silent theft.
 *  3. **The success screen pushes at reprinting, and says why.** The sheet is
 *     now the entire recovery path and this one has been out in the world.
 *     Marking it used does not invalidate it — only printing a new one does.
 */
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
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
import { patchEnrolment, storeRecoveredMk } from "@/lib/secure-vault"

type Phase = "input" | "working" | "done" | "failed" | "badCode"

export function RecoveryScreen() {
  const { t } = useStrings("recovery")
  // The sheet code is on screen as plaintext while it is typed.
  useSecureScreen("recovery")

  const me = useQuery(api.users.me)
  const keyring = useQuery(api.keyring.get)
  const markPaperUsed = useMutation(api.keyring.markPaperUsed)
  const { signOut } = useClerk()

  const [code, setCode] = useState("")
  const [phase, setPhase] = useState<Phase>("input")

  async function recover() {
    if (keyring == null || me == null) return
    setPhase("working")

    let sPaper: Uint8Array | null = null
    let mk: Uint8Array | null = null
    try {
      ensureWebCrypto()

      // Decoded first and separately: a mistyped sheet is by far the commonest
      // failure and deserves its own message rather than "that didn't work".
      try {
        sPaper = decodePaperCode(code).sPaper
      } catch {
        setPhase("badCode")
        return
      }

      mk = recoverMk(
        sPaper,
        new Uint8Array(keyring.mkWrappedByRecovery),
        me.id,
        keyring.paperVersion
      )

      // 1 — the key, before anything is spent.
      await storeRecoveredMk(mk, t.storePrompt)
      await patchEnrolment({ paperVersion: keyring.paperVersion })
      // 2 — last, and it is what raises the alarm.
      await markPaperUsed({})

      setPhase("done")
    } catch {
      setPhase("failed")
    } finally {
      // Whatever happened, none of this may outlive the attempt.
      sPaper?.fill(0)
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
        {/* Not a nag. The sheet just opened a vault, so it is a live key that
            has been handled — and nothing invalidates it until a new one is
            printed. */}
        <AlertBanner
          className="mt-4"
          variant="security"
          description={t.reprintUrgent}
        />
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

      {keyring === null ? (
        <AlertBanner
          className="mt-header"
          variant="security"
          description={t.noKeyring}
        />
      ) : (
        <>
          <Field
            {...SECRET_INPUT_PROPS}
            className="mt-header h-auto min-h-24 py-3 text-left"
            label={t.codeLabel}
            hint={t.codeHint}
            value={code}
            onChangeText={(value) => {
              setCode(value)
              if (phase !== "input") setPhase("input")
            }}
            autoCapitalize="characters"
            multiline
            error={phase === "badCode" ? t.codeInvalid : undefined}
          />

          {phase === "failed" ? (
            <Text variant="meta" className="text-terracotta-800 mt-4 leading-[1.7]">
              {t.failed}
            </Text>
          ) : null}

          <Button
            className="mt-6"
            onPress={() => void recover()}
            disabled={phase === "working" || code.trim().length === 0}
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
