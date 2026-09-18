import { useSignUp } from "@clerk/expo"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { router } from "expo-router"
import { Lock } from "lucide-react-native"
import { useState } from "react"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { CountryPicker } from "@/components/country-picker"
import { Field } from "@/components/field"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { DEFAULT_COUNTRY } from "@/lib/countries"
import { splitFullName, useOnboarding } from "@/stores/onboarding"

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * 1.3 — create an account.
 *
 * Email-code only. The design draws a جوال/بريد segmented control and a +966
 * dial code, but this account is identified by email: the heir-claim funnel
 * looks a deceased owner up by `users.email`, and the recovery sheet has to
 * print something that lookup can match.
 *
 * The country picker stays, though. It is not a dial code — it decides which
 * identity documents 2.1 lists, and later the IBAN format and currency. It is
 * a parameter, never a branch.
 *
 * The name warning sits on the field that collects the name, not in a footnote,
 * because this string is the one a death certificate is later matched against.
 */
export function SignUpScreen() {
  const { t, locale } = useStrings("auth/signup")
  const { t: common } = useStrings("common")
  const { signUp, errors, fetchStatus } = useSignUp()
  const { setDraft } = useOnboarding()

  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [country, setCountry] = useState(DEFAULT_COUNTRY)
  const [localError, setLocalError] = useState<string | null>(null)

  const busy = fetchStatus === "fetching"
  const emailValid = EMAIL_PATTERN.test(email.trim())
  const ready = fullName.trim().length > 1 && emailValid && !busy

  const fieldError =
    localError ??
    errors.fields.emailAddress?.message ??
    errors.global?.[0]?.message ??
    null

  async function submit() {
    setLocalError(null)
    const emailAddress = email.trim()
    const { firstName, lastName } = splitFullName(fullName)

    // Clerk methods resolve to `{ error }` with a flat `error.code` — never a
    // thrown exception and never `error.errors[0]`.
    const created = await signUp.create({
      emailAddress,
      firstName,
      lastName,
      legalAccepted: true,
      locale,
    })
    if (created.error) {
      if (created.error.code === "form_identifier_exists") {
        setDraft({ email: emailAddress, country, fullName })
        router.replace("/auth/signin")
        return
      }
      return
    }

    const sent = await signUp.verifications.sendEmailCode()
    if (sent.error) return

    // The country cannot be saved yet: `users.saveProfile` needs a session and
    // there is none until the code on 1.4 finalises. Carried in the draft store
    // until then; 2.1 re-asks if the app dies in that window.
    setDraft({
      fullName,
      email: emailAddress,
      country,
      isNewAccount: true,
    })
    router.push("/auth/otp")
  }

  return (
    <Screen keyboard inset="flow">
      <BackButton
        label={common.back}
        fallbackHref="/welcome"
        className="mb-header"
      />

      <Text variant="screenTitle" className="mb-2 text-[30px]">
        {t.title}
      </Text>
      <Text className="mb-5.5 text-[14.5px] text-muted-foreground">
        {t.subtitle}
      </Text>

      <View className="gap-4">
        <Field
          label={t.nameLabel}
          placeholder={t.namePlaceholder}
          value={fullName}
          onChangeText={setFullName}
          autoCapitalize="words"
          autoComplete="name"
          editable={!busy}
        />

        <Field
          label={t.emailLabel}
          placeholder={t.emailPlaceholder}
          value={email}
          onChangeText={setEmail}
          error={fieldError ?? undefined}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          editable={!busy}
          // The address is Latin inside an Arabic form; keeping the field
          // itself LTR stops the caret and any placeholder from mirroring.
          style={{ writingDirection: "ltr", textAlign: "left" }}
        />

        <CountryPicker
          label={t.countryLabel}
          hint={t.countryHint}
          value={country}
          onChange={setCountry}
          locale={locale}
        />
      </View>

      <AlertBanner
        className="mt-5"
        variant="success"
        icon={Lock}
        description={t.nameNotice}
      />

      <View className="grow" />

      <Text variant="metaSm" className="mt-5 mb-3 text-muted-foreground">
        {t.legal}
      </Text>

      <Button disabled={!ready} onPress={() => void submit()}>
        <Text>{t.cta}</Text>
      </Button>

      {/* Clerk's bot protection is on by default and needs this mount point
          on any screen that can create a sign-up. */}
      <View nativeID="clerk-captcha" />
    </Screen>
  )
}
