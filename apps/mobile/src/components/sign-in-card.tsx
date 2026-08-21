import { useState } from "react"
import { ActivityIndicator, Alert, View } from "react-native"
import { useSignIn, useSignUp, useSSO } from "@clerk/expo"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Input } from "@workspace/ui-native/components/ui/input"
import { Text } from "@workspace/ui-native/components/ui/text"

// Combined sign-in-or-up: one email field. Clerk's Core 3 hooks return
// { signIn, errors, fetchStatus } and every method resolves to { error } —
// check `error`, don't wrap these in try/catch.
export function SignInCard() {
  const { signIn, errors: signInErrors, fetchStatus: signInFetch } = useSignIn()
  const { signUp, errors: signUpErrors, fetchStatus: signUpFetch } = useSignUp()
  const { startSSOFlow } = useSSO()

  const [emailAddress, setEmailAddress] = useState("")
  const [code, setCode] = useState("")
  const [step, setStep] = useState<"email" | "code">("email")
  // A code sent to an address Clerk has never seen belongs to a sign-UP attempt,
  // which verifies through a different method than sign-in.
  const [isNewUser, setIsNewUser] = useState(false)
  const [ssoBusy, setSsoBusy] = useState(false)
  // Surfaces "the attempt is valid but not finished" — an instance that also
  // requires a password or username lands here. Without it the Verify button
  // would look dead.
  const [notice, setNotice] = useState<string | null>(null)

  const busy = signInFetch === "fetching" || signUpFetch === "fetching" || ssoBusy
  const emailError =
    signInErrors.fields.identifier?.message ?? signUpErrors.fields.emailAddress?.message
  const codeError = signInErrors.fields.code?.message ?? signUpErrors.fields.code?.message
  const globalError =
    signInErrors.global?.[0]?.message ?? signUpErrors.global?.[0]?.message
  const message = notice ?? globalError ?? (step === "email" ? emailError : codeError)

  async function sendCode() {
    setNotice(null)
    // Try sign-in first; if Clerk has never seen this address, create the user.
    // Note: this pivots on `form_identifier_not_found`, which an instance with
    // enumeration protection enabled will not return — turn that off, or split
    // this into explicit sign-in / sign-up screens.
    const { error } = await signIn.emailCode.sendCode({ emailAddress })
    if (error) {
      if (error.code !== "form_identifier_not_found") return
      const created = await signUp.create({ emailAddress })
      if (created.error) return
      const sent = await signUp.verifications.sendEmailCode()
      if (sent.error) return
      setIsNewUser(true)
      setStep("code")
      return
    }
    setIsNewUser(false)
    setStep("code")
  }

  async function resendCode() {
    // The attempt already exists, so both resends take no arguments.
    if (isNewUser) {
      await signUp.verifications.sendEmailCode()
    } else {
      await signIn.emailCode.sendCode()
    }
  }

  async function verifyCode() {
    setNotice(null)

    if (isNewUser) {
      const { error } = await signUp.verifications.verifyEmailCode({ code })
      if (error) return
      if (signUp.status !== "complete") {
        setNotice(
          `This Clerk instance needs more to finish sign-up: ${
            signUp.missingFields.join(", ") || signUp.status
          }. Enable email-code-only sign-up in the dashboard, or collect those fields here.`,
        )
        return
      }
      await signUp.finalize({
        navigate: ({ session }) => {
          if (session?.currentTask) {
            console.warn("Clerk session task pending:", session.currentTask)
          }
          // Single screen: <Authenticated> swaps the UI once the session is live.
        },
      })
      return
    }

    const { error } = await signIn.emailCode.verifyCode({ code })
    if (error) return
    if (signIn.status !== "complete") {
      setNotice(`Sign-in needs another step (${signIn.status}) that this screen doesn't handle.`)
      return
    }
    await signIn.finalize({
      navigate: ({ session }) => {
        if (session?.currentTask) {
          console.warn("Clerk session task pending:", session.currentTask)
        }
      },
    })
  }

  async function signInWithGoogle() {
    setNotice(null)
    setSsoBusy(true)
    try {
      // redirectUrl defaults to <scheme>://sso-callback, and ClerkProvider
      // completes the browser session for us.
      const { createdSessionId, setActive } = await startSSOFlow({
        strategy: "oauth_google",
      })
      // No session id = the user dismissed the browser. That is not an error.
      if (createdSessionId && setActive) {
        await setActive({ session: createdSessionId })
      }
    } catch (err) {
      Alert.alert("Google sign-in failed", err instanceof Error ? err.message : String(err))
    } finally {
      setSsoBusy(false)
    }
  }

  function startOver() {
    signIn.reset()
    signUp.reset()
    setCode("")
    setNotice(null)
    setStep("email")
    setIsNewUser(false)
  }

  return (
    <View className="w-full gap-3">
      {step === "email" ? (
        <>
          <Text variant="muted">Sign in with a code sent to your email.</Text>
          <Input
            value={emailAddress}
            onChangeText={setEmailAddress}
            placeholder="you@example.com"
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            editable={!busy}
          />
          <Button onPress={() => void sendCode()} disabled={busy || !emailAddress}>
            <Text>Send code</Text>
          </Button>
        </>
      ) : (
        <>
          <Text variant="muted">Enter the code sent to {emailAddress}.</Text>
          <Input
            value={code}
            onChangeText={setCode}
            placeholder="123456"
            autoComplete="one-time-code"
            keyboardType="number-pad"
            editable={!busy}
          />
          <Button onPress={() => void verifyCode()} disabled={busy || !code}>
            <Text>Verify</Text>
          </Button>
          <View className="flex-row gap-2">
            <Button variant="ghost" onPress={() => void resendCode()} disabled={busy}>
              <Text>Resend</Text>
            </Button>
            <Button variant="ghost" onPress={startOver} disabled={busy}>
              <Text>Start over</Text>
            </Button>
          </View>
        </>
      )}

      {message ? <Text variant="small">{message}</Text> : null}

      <Text variant="muted">or</Text>
      <Button variant="outline" onPress={() => void signInWithGoogle()} disabled={busy}>
        <Text>Continue with Google</Text>
      </Button>

      {busy ? <ActivityIndicator /> : null}

      {/* Clerk's bot protection is on by default and needs this mount point on
          any screen that can create a sign-up. */}
      <View nativeID="clerk-captcha" />
    </View>
  )
}
