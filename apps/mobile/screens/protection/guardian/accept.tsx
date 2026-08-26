/**
 * ٦.٢b — accepting a guardian invitation. The **guardian's** side.
 *
 * This is the app's second persona. Everything else in the product is written
 * for an owner protecting their own vault; here the user is protecting someone
 * else's, and the difference is worth stating on screen because what is being
 * asked of them is unusual: hold half a key, for years, and answer once.
 *
 * ## What actually happens when they tap accept
 *
 *  1. An X25519 keypair is generated **on this device**. The secret half goes
 *     into the keystore behind their biometric and never leaves; the public
 *     half is published to `guardians.accept`.
 *  2. That is all. They receive no share at this point — the owner seals it to
 *     the published key afterwards, from the owner's own device. A guardian who
 *     accepts and hears nothing more has not failed at anything.
 *
 * The secret key is the whole capability: lose it and every share sealed to
 * this guardian is unopenable, which is why it is stored the same way MK is
 * rather than anywhere more convenient.
 */
import { useState } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { router } from "expo-router"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Field } from "@/components/field"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import {
  generateAndStoreGuardianKey,
  patchEnrolment,
} from "@/lib/secure-vault"

type AcceptState = "idle" | "working" | "done" | "invalid" | "self" | "failed"

export function GuardianAcceptScreen() {
  const { t } = useStrings("protection/guardian/accept")
  const { t: common } = useStrings("common")
  const accept = useMutation(api.guardians.accept)

  const [token, setToken] = useState("")
  const [state, setState] = useState<AcceptState>("idle")

  async function submit() {
    setState("working")
    try {
      // Generated *before* the accept call: publishing a key this device
      // cannot later produce would leave the owner sealing to nothing.
      const publicKey = await generateAndStoreGuardianKey(t.keyPrompt)
      await accept({
        inviteToken: token.trim(),
        x25519PublicKey: new Uint8Array(publicKey).buffer,
      })
      // The unauthenticated marker, so the app knows this device has a
      // guardian role without raising a biometric prompt to find out.
      await patchEnrolment({ isGuardian: true })
      setState("done")
    } catch (error) {
      const message = error instanceof Error ? error.message : ""
      // The deployment's own words, matched rather than guessed at — see
      // `convex/guardians.ts`, which distinguishes these deliberately.
      setState(
        message.includes("own guardian")
          ? "self"
          : message.includes("not found") || message.includes("expired")
            ? "invalid"
            : "failed"
      )
    }
  }

  if (state === "done") {
    return (
      <Screen>
        <Text variant="screenTitle" className="mt-4">
          {t.acceptedTitle}
        </Text>
        <Text className="mt-3 text-[14.5px] leading-[1.7] text-muted-foreground">
          {t.acceptedBody}
        </Text>
        <View className="grow" />
        {/* Home via the splash, not a fixed destination. Someone who just
            accepted may be a guardian and nothing else — no vault, no tabs —
            and `/` is the one route that resolves by their own evidence. */}
        <Button onPress={() => router.replace("/")}>
          <Text>{common.continue}</Text>
        </Button>
      </Screen>
    )
  }

  return (
    <Screen>
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mt-4">
        {t.title}
      </Text>
      <Text className="mt-3 text-[14.5px] leading-[1.7] text-muted-foreground">
        {t.intro}
      </Text>

      {/* What is actually being asked. A guardian who does not know they will
          be called on one day is not a guardian. */}
      <View className="rounded-card bg-card mt-4 p-4">
        <Text variant="metaSm" className="leading-[1.75]">
          {t.responsibility}
        </Text>
      </View>

      <Field
        containerClassName="mt-header"
        label={t.tokenLabel}
        placeholder={t.tokenPlaceholder}
        value={token}
        onChangeText={(value) => {
          setToken(value)
          if (state !== "idle") setState("idle")
        }}
        autoCapitalize="none"
        autoCorrect={false}
        className="text-left"
        error={
          state === "invalid"
            ? t.invalid
            : state === "self"
              ? t.ownerSelf
              : state === "failed"
                ? t.failed
                : undefined
        }
      />

      <View className="grow" />

      <Button
        className="mt-6"
        onPress={() => void submit()}
        disabled={state === "working" || token.trim().length === 0}
      >
        <Text>{state === "working" ? t.accepting : t.accept}</Text>
      </Button>
    </Screen>
  )
}
