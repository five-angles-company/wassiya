import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import * as Linking from "expo-linking"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"

import { useState } from "react"
import { View } from "react-native"

import { CountryPicker } from "@/components/country-picker"
import { Screen } from "@/components/screen"
import { SetupStepMeter } from "@/components/setup-step-meter"
import { useStrings } from "@/i18n/use-strings"
import { DEFAULT_COUNTRY, findCountry } from "@/lib/countries"
import { SETUP_STEP_INDEX } from "@/lib/setup-flow"
import { RequirementRow } from "@/screens/setup/kyc/components/requirement-row"

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
    <Screen inset="flow">
      <SetupStepMeter
        step={SETUP_STEP_INDEX.kyc}
        locale={locale}
        separator={common.stepSeparator}
        className="mb-header"
      />

      <Text variant="screenTitle" className="mb-2.5 text-[30px]">
        {t.title}
      </Text>
      <Text className="text-body mb-5.5 leading-[1.7] text-muted-foreground">
        {t.body}
      </Text>

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

      <View className="mb-5 gap-3">
        <RequirementRow
          index={1}
          locale={locale}
          label={documents?.[locale] ?? t.requirementDocument}
        />
        <RequirementRow index={2} locale={locale} label={t.requirementSelfie} />
        <RequirementRow index={3} locale={locale} label={t.requirementTime} />
      </View>

      <AlertBanner variant="security" description={t.blockingNotice} />

      <Text variant="metaSm" className="mt-3 text-muted-foreground">
        {t.nothingEncryptedYet}
      </Text>

      <View className="grow" />

      {error !== null ? (
        <Text variant="meta" className="text-terracotta-800 mt-4 mb-3">
          {error}
        </Text>
      ) : null}

      <Button className="mt-5" disabled={busy} onPress={() => void start()}>
        <Text>{busy ? t.opening : t.cta}</Text>
      </Button>

      {/*
        A guardian escape hatch used to sit here: someone who signed up only to
        hold half a key has no keyring and no verification, which `setup-flow`
        reads as "unfinished owner onboarding", so the splash stranded them on
        this blocking gate with nowhere to go.

        It is gone because the stranding is: a guardian has no reason to install
        this app at all now. They are not in recovery, and their claim duties
        live on the web. Anyone reaching this screen is an owner, and for an
        owner the gate is meant to block.
      */}
    </Screen>
  )
}
