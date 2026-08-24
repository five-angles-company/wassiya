import { useSignIn, useSignUp } from "@clerk/expo"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { OtpInput } from "@workspace/ui-native/components/wassiya/otp-input"
import { isolateLtr } from "@workspace/ui-native/lib/rtl"
import { router } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Pressable, ScrollView, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { useStrings } from "@/i18n/use-strings"
import { useOnboarding } from "@/stores/onboarding"

const RESEND_COOLDOWN_SECONDS = 60
const MAX_SENDS = 3
const CODE_LENGTH = 6

type Phase = "input" | "verifying" | "wrong" | "expired" | "lockedOut"

/**
 * 1.4 — the one-time code.
 *
 * The screen's own copy is the point: this code proves who someone is and
 * touches no key material. Identity and custody are separate jobs in this
 * product, and the OTP only ever does the first — saying so here is what stops
 * a user assuming the code is what protects their vault.
 *
 * The board draws a bespoke numeric keypad. That is mockup furniture: the
 * `otp-input` primitive puts one real, transparent `TextInput` over the painted
 * boxes precisely so autofill and paste work, and a hand-drawn keypad would
 * break both. The OS keyboard with `autoComplete="one-time-code"` is the
 * behaviour the spec actually asks for.
 */
export function OtpScreen() {
  const { t, locale } = useStrings("auth/otp")
  const { t: common } = useStrings("common")
  const { signIn } = useSignIn()
  const { signUp } = useSignUp()
  const saveProfile = useMutation(api.users.saveProfile)
  const { email, country, isNewAccount, clearDraft } = useOnboarding()

  const [code, setCode] = useState("")
  const [phase, setPhase] = useState<Phase>("input")
  const [sends, setSends] = useState(1)
  const [cooldown, setCooldown] = useState(RESEND_COOLDOWN_SECONDS)
  const [notice, setNotice] = useState<string | null>(null)
  const verifying = useRef(false)

  useEffect(() => {
    if (cooldown <= 0) return
    const timer = setInterval(
      () => setCooldown((n) => Math.max(0, n - 1)),
      1000
    )
    return () => clearInterval(timer)
  }, [cooldown])

  async function verify(value: string) {
    // `onComplete` can fire again while the request is in flight — a second
    // attempt would burn one of Clerk's tries on the same code.
    if (verifying.current) return
    verifying.current = true
    setPhase("verifying")
    setNotice(null)

    try {
      const attempt = isNewAccount
        ? await signUp.verifications.verifyEmailCode({ code: value })
        : await signIn.emailCode.verifyCode({ code: value })

      if (attempt.error) {
        setPhase(
          attempt.error.code === "verification_expired" ? "expired" : "wrong"
        )
        return
      }

      const status = isNewAccount ? signUp.status : signIn.status
      if (status !== "complete") {
        setNotice(t.needsMoreSteps)
        setPhase("input")
        return
      }

      // `finalize` is what makes the session live; nothing authenticated may
      // run before it resolves.
      if (isNewAccount) {
        await signUp.finalize({ navigate: () => undefined })
      } else {
        await signIn.finalize({ navigate: () => undefined })
      }

      // First authenticated write: persist the country picked on 1.3. If this
      // fails or the app dies here, 2.1 asks for it again — `me.country` being
      // null is a state that screen already handles.
      if (isNewAccount && country !== "") {
        try {
          await saveProfile({
            country,
            locale: locale === "en" ? "en" : "ar-SA",
          })
        } catch {
          // Non-fatal by design: losing the country costs one tap on 2.1, and
          // blocking a completed sign-up on it would be worse.
        }
      }

      clearDraft()
      router.replace("/")
    } finally {
      verifying.current = false
    }
  }

  async function resend() {
    if (sends >= MAX_SENDS) {
      setPhase("lockedOut")
      setNotice(t.resendLimit)
      return
    }
    setNotice(null)
    setCode("")
    setPhase("input")
    // Both resends take no arguments — the attempt already exists.
    if (isNewAccount) {
      await signUp.verifications.sendEmailCode()
    } else {
      await signIn.emailCode.sendCode()
    }
    setSends((n) => n + 1)
    setCooldown(RESEND_COOLDOWN_SECONDS)
  }

  const canResend = cooldown === 0 && sends < MAX_SENDS && phase !== "verifying"

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="grow px-gutter pb-6 pt-3.5"
      keyboardShouldPersistTaps="handled"
    >
      <BackButton
        label={common.back}
        fallbackHref="/auth/signup"
        className="mb-5.5"
      />

      <Text variant="screenTitle" className="mb-2 text-[30px]">
        {t.title}
      </Text>
      <Text className="mb-6.5 text-[14.5px] text-muted-foreground">
        {`${t.subtitlePrefix} ${isolateLtr(email)}`}
      </Text>

      <OtpInput
        value={code}
        onChangeText={(next) => {
          setCode(next)
          if (phase === "wrong" || phase === "expired") setPhase("input")
        }}
        length={CODE_LENGTH}
        state={
          phase === "input" ? (code.length === 0 ? "empty" : "partial") : phase
        }
        resendInSeconds={cooldown}
        onComplete={(value) => void verify(value)}
        autoFocus
        locale={locale}
        className="mb-4.5"
      />

      {canResend ? (
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => void resend()}
        >
          <Text variant="action" className="text-terracotta-700 py-1">
            {t.resend}
          </Text>
        </Pressable>
      ) : null}

      {notice !== null ? (
        <Text variant="meta" className="text-terracotta-800 mt-3">
          {notice}
        </Text>
      ) : null}

      <View className="bg-sand-200 rounded-row mt-5 px-3.75 py-3.25">
        <Text variant="meta" className="text-muted-foreground">
          {t.notice}
        </Text>
      </View>

      <View className="grow" />

      <Button
        className="mt-6"
        disabled={code.length !== CODE_LENGTH || phase === "verifying"}
        onPress={() => void verify(code)}
      >
        <Text>{t.verify}</Text>
      </Button>

      <View nativeID="clerk-captcha" />
    </ScrollView>
  )
}
