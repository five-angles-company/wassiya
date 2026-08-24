import { useSignIn } from "@clerk/expo"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { router } from "expo-router"
import { useState } from "react"
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  View,
} from "react-native"

import { BackButton } from "@/components/back-button"
import { Field } from "@/components/field"
import { NewDeviceCard } from "@/screens/auth/signin/components/new-device-card"
import { useStrings } from "@/i18n/use-strings"
import { useOnboarding } from "@/stores/onboarding"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 1.5 — sign in.
 *
 * Deliberately a separate screen from 1.3 rather than a combined
 * sign-in-or-up. The combined form has to pivot on
 * `form_identifier_not_found`, which a Clerk instance with enumeration
 * protection enabled will never return — and the board specifies both screens
 * anyway, with explicit cross-links between them.
 *
 * That caveat still applies to the one cross-link here: if the instance
 * suppresses the code, an unknown address surfaces as a generic error instead
 * of routing to sign-up. Worth knowing before blaming this screen.
 */
export function SignInScreen() {
  const { t } = useStrings("auth/signin")
  const { t: common } = useStrings("common")
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
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.select({ ios: "padding", default: undefined })}
    >
      <ScrollView
        contentContainerClassName="grow px-gutter pb-6 pt-3.5"
        keyboardShouldPersistTaps="handled"
      >
        <BackButton
          label={common.back}
          fallbackHref="/welcome"
          className="mb-header"
        />

        <Text variant="screenTitle" className="mb-2 text-[30px]">
          {t.title}
        </Text>
        <Text className="mb-6.5 text-[14.5px] text-muted-foreground">
          {t.subtitle}
        </Text>

        <Field
          label={t.emailLabel}
          value={email}
          onChangeText={setEmail}
          error={fieldError ?? undefined}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!busy}
          style={{ writingDirection: "ltr", textAlign: "left" }}
          className="text-[17px]"
          containerClassName="mb-4.5"
        />

        <Button
          className="mb-6.5"
          disabled={!ready}
          onPress={() => void submit()}
        >
          <Text>{t.cta}</Text>
        </Button>

        <NewDeviceCard title={t.newDeviceTitle} body={t.newDeviceBody} />

        <View className="grow" />

        <Pressable
          accessibilityRole="button"
          className="mt-6 flex-row justify-center gap-1"
          onPress={() => router.replace("/auth/signup")}
        >
          <Text className="text-section">{t.noAccount}</Text>
          <Text className="text-section text-terracotta-700">
            {t.createOne}
          </Text>
        </Pressable>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}
