import { useSignIn, useSignUp } from "@clerk/expo"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { OtpInput } from "@workspace/ui-native/components/wassiya/otp-input"
import { isolateLtr } from "@workspace/ui-native/lib/rtl"
import { router } from "expo-router"
import { useEffect, useRef, useState } from "react"
import { Pressable, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { useOnboarding } from "@/stores/onboarding"

const RESEND_COOLDOWN_SECONDS = 60
const MAX_SENDS = 3
const CODE_LENGTH = 6

type Phase = "input" | "verifying" | "wrong" | "expired" | "lockedOut"

/**
 * A message, plus the machine-readable reason behind it where one exists.
 * Carried as one value so the two can never drift apart across the four places
 * the notice is set and cleared.
 */
type Notice = { text: string; detail?: string }

/**
 * 1.4 — the one-time code.
 *
 * The screen's own copy is the point: this code proves who someone is and
 * touches no key material. Identity and custody are separate jobs in this
 * product, and the OTP only ever does the first — saying so here is what stops
 * a user assuming the code is what protects their vault.
 *
 * The design draws a bespoke numeric keypad. That is mockup furniture: the
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
  const [notice, setNotice] = useState<Notice | null>(null)
  const verifying = useRef(false)
  const resending = useRef(false)

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
        // Clear the rejected digits rather than leaving the reader to delete
        // six of them before they can try again. The message above the boxes
        // is what carries the verdict; the boxes carry the next attempt.
        setCode("")
        return
      }

      const status = isNewAccount ? signUp.status : signIn.status
      if (status !== "complete") {
        // A dead end for the user, so it has to name itself. Clerk parks the
        // attempt here whenever the instance requires an attribute this screen
        // never collects — a required password is the usual one, since the
        // flow is email-code only by design. Without the outstanding field
        // list this reads as a broken app rather than a dashboard setting.
        const outstanding = isNewAccount
          ? [...signUp.missingFields, ...signUp.unverifiedFields]
          : []
        // Sign-in has no field list; its status *is* the reason
        // (`needs_second_factor`, `needs_new_password`).
        const detail =
          outstanding.length > 0 ? outstanding.join(" · ") : status
        console.warn(
          `[wassiya] Clerk sign-${isNewAccount ? "up" : "in"} stalled at ` +
            `"${status}" — outstanding: ${detail}. Check the required ` +
            "attributes on the instance in the Clerk dashboard."
        )
        setNotice({ text: t.needsMoreSteps, detail })
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
    // Same guard as `verify`: a second tap while the first request is open
    // spends one of the three sends for nothing.
    if (resending.current) return
    resending.current = true
    setNotice(null)

    try {
      // Both take no arguments — the attempt already exists, and Clerk's own
      // typings say to omit the address when it does.
      const { error } = isNewAccount
        ? await signUp.verifications.sendEmailCode()
        : await signIn.emailCode.sendCode()

      if (error) {
        console.warn(
          `[wassiya] Clerk resend failed: ${error.code} — ${error.message}`
        )
        setNotice({ text: t.resendFailed, detail: error.code })
        return
      }

      // Only a send that actually left spends an attempt, restarts the clock
      // and clears the field. Doing any of that before the await meant a
      // rejected resend still cost the user a try, wiped what they had typed,
      // and hid the link for another minute — with no email and no message,
      // which is indistinguishable from a dead button.
      setCode("")
      setPhase("input")
      setSends((n) => n + 1)
      setCooldown(RESEND_COOLDOWN_SECONDS)
    } catch (cause) {
      // AGENTS.md records that Clerk resolves to `{ error }` rather than
      // throwing, so reaching here means the transport failed underneath it —
      // offline, DNS, a dead dev tunnel. Without this the rejection escapes
      // `void resend()` and the tap is silent again, which is the whole bug.
      console.warn("[wassiya] Clerk resend threw", cause)
      setNotice({ text: t.resendFailed })
    } finally {
      resending.current = false
    }
  }

  const canResend = cooldown === 0 && sends < MAX_SENDS && phase !== "verifying"

  return (
    <Screen inset="flow">
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
      ) : sends >= MAX_SENDS ? (
        // Past the limit the link is gone for good, and the countdown that
        // would otherwise explain its absence has already run out. Saying so
        // in the space it used to occupy is the difference between a limit and
        // a button that stopped working.
        <Text variant="metaSm" className="text-muted-foreground py-1">
          {t.resendLimit}
        </Text>
      ) : null}

      {notice !== null ? (
        <View className="mt-3 gap-1">
          <Text variant="meta" className="text-terracotta-800">
            {notice.text}
          </Text>
          {/* Raw Clerk field codes: a Latin run inside Arabic, isolated like
              every other one in this app. Shown rather than dev-gated, because
              this state cannot be recovered from in-app — the line a user can
              quote to support is worth more than the polish it costs. */}
          {notice.detail !== undefined ? (
            <Text variant="metaSm" className="text-muted-foreground">
              {`${t.detailPrefix} ${isolateLtr(notice.detail)}`}
            </Text>
          ) : null}
        </View>
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
    </Screen>
  )
}
