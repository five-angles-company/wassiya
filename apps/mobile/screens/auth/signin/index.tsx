import { useSignIn } from "@clerk/expo"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { router } from "expo-router"
import { useState } from "react"
import { Pressable, View } from "react-native"

import { Field } from "@/components/field"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"
import { useOnboarding } from "@/stores/onboarding"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 1.5 — sign in.
 *
 * Deliberately a separate screen from 1.3 rather than a combined
 * sign-in-or-up. The combined form has to pivot on
 * `form_identifier_not_found`, which a Clerk instance with enumeration
 * protection enabled will never return — and both screens are specified
 * anyway, with explicit cross-links between them.
 *
 * That caveat still applies to the one cross-link here: if the instance
 * suppresses the code, an unknown address surfaces as a generic error instead
 * of routing to sign-up. Worth knowing before blaming this screen.
 */
export function SignInScreen() {
  const { t } = useStrings("auth/signin")
  const { signIn, errors, fetchStatus } = useSignIn()
  const { email: draftEmail, setDraft } = useOnboarding()

  const [email, setEmail] = useState(draftEmail)
  const [localError, setLocalError] = useState<string | null>(null)

  const busy = fetchStatus === "fetching"
  const ready = EMAIL_PATTERN.test(email.trim()) && !busy

  const fieldError =
    localError ??
    errors.fields.identifier?.message ??
    errors.global?.[0]?.message ??
    null

  async function submit() {
    setLocalError(null)
    const emailAddress = email.trim()

    const { error } = await signIn.emailCode.sendCode({ emailAddress })
    if (error) {
      if (error.code === "form_identifier_not_found") {
        setDraft({ email: emailAddress })
        setLocalError(t.unknownAccount)
      }
      return
    }

    setDraft({ email: emailAddress, isNewAccount: false })
    router.push("/auth/otp")
  }

  return (
    <Screen
      keyboard
      inset="flow"
      footer={
        <View className="gap-4">
          <PrimaryCta
            label={t.cta!}
            onPress={() => void submit()}
            disabled={!ready}
            busy={busy}
          />
          <Pressable
            accessibilityRole="button"
            className="flex-row justify-center gap-1"
            onPress={() => router.replace("/auth/signup")}
          >
            <Text className="text-section">{t.noAccount}</Text>
            <Text className="text-section text-terracotta-700">
              {t.createOne}
            </Text>
          </Pressable>
        </View>
      }
    >
      <ScreenHeader back="/welcome" title={t.title!} description={t.subtitle} />

      <Field
        label={t.emailLabel!}
        value={email}
        onChangeText={setEmail}
        error={fieldError ?? undefined}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        editable={!busy}
        style={{ writingDirection: "ltr", textAlign: "left" }}
        containerClassName="mb-6"
      />

      <Text variant="metaSm">{t.newDeviceBody}</Text>
    </Screen>
  )
}
