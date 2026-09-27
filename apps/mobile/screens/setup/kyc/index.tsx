import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import * as Linking from "expo-linking"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"

import { useState } from "react"
import { View } from "react-native"

import { CountryPicker } from "@/components/country-picker"
import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { DEFAULT_COUNTRY, findCountry } from "@/lib/countries"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"
import { NumberedRow } from "@/components/numbered-row"

/**
 * 2.1 — the blocking identity gate.
 *
 * Nothing cryptographic has happened at this point, and the copy says so: a
 * user who backs out here loses nothing, because no key exists to lose. The
 * first act that brings a vault into existence is `keyring.save`, and that is
 * where the deployment enforces this gate with `assertIdentityVerified` — the
 * screen only has to be honest about it.
 *
 * The hosted flow opens in a **Custom Tab, not a WebView**. Didit's liveness
 * check needs reliable camera access and an embedded WebView is where that
 * quietly stops working.
 */
export function KycScreen() {
  const { t, locale } = useStrings("setup/kyc")
  const { t: common } = useStrings("common")
  const me = useQuery(api.users.me)
  const startSession = useAction(api.identity.startSession)
  const saveProfile = useMutation(api.users.saveProfile)

  // Normally already set from 1.3. Null only when the app died between the
  // OTP finalising and the first profile write.
  const [country, setCountry] = useState(me?.country ?? DEFAULT_COUNTRY)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const needsCountry = me !== undefined && me !== null && me.country === null
  const documents = findCountry(needsCountry ? country : me?.country)?.documents

  async function start() {
    setBusy(true)
    setError(null)
    try {
      if (needsCountry) {
        await saveProfile({ country, locale: locale === "en" ? "en" : "ar-SA" })
      }

      // Deep link back into the pending screen. Didit also reports the verdict
      // out of band on the HMAC-verified webhook, which is the only thing that
      // can actually write "verified" — this is just where the user lands.
      const callbackUrl = Linking.createURL("/setup/kyc/pending")
      const { url } = await startSession({ callbackUrl })

      router.push("/setup/kyc/pending")
      await WebBrowser.openAuthSessionAsync(url, callbackUrl)
    } catch {
      setError(t.failed)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Screen
      inset="flow"
      footer={
        <View className="gap-3">
          {error !== null ? (
            <Text variant="meta" className="text-terracotta-800">
              {error}
            </Text>
          ) : null}
          <PrimaryCta label={busy ? t.opening! : t.cta!} onPress={() => void start()} busy={busy} />
        </View>
      }
    >
      <SetupStepMeter
        step={SETUP_STEP_INDEX.kyc}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-6"
      />

      <ScreenHeader title={t.title!} description={t.body} />

      {needsCountry ? (
        <CountryPicker
          className="mb-5"
          label={t.countryLabel}
          hint={t.countryNotice}
          value={country}
          onChange={setCountry}
          locale={locale}
        />
      ) : null}

      <View className="gap-row">
        <NumberedRow
          index={1}
          locale={locale}
          label={documents?.[locale] ?? t.requirementDocument}
        />
        <NumberedRow index={2} locale={locale} label={t.requirementSelfie} />
        <NumberedRow index={3} locale={locale} label={t.requirementTime} />
      </View>

    </Screen>
  )
}
