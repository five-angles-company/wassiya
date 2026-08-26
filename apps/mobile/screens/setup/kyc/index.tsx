import { useAction, useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import * as Linking from "expo-linking"
import { router } from "expo-router"
import * as WebBrowser from "expo-web-browser"
import { IdCard } from "lucide-react-native"
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
  const guardianships = useQuery(api.guardians.guardianFor)
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

      <View className="bg-terracotta-200 mb-5.5 size-26 items-center justify-center rounded-full">
        <Icon as={IdCard} className="text-terracotta-800 size-11" />
      </View>

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
        The app's second persona, and the one place it can get stranded.

        Identity verification is blocking **for owners** — AGENTS.md scopes it
        that way deliberately. But someone who signed up only to hold half a key
        for their father has no keyring and no verification, which is exactly
        the evidence `setup-flow` reads as "unfinished owner onboarding", so the
        splash lands them here. Without this link the guardian half of ٨.١ is
        unreachable by the only people who ever need it, and the owner they are
        supposed to rescue stays locked out.

        It renders only for real guardians — `guardianFor` is server-derived
        from accepted invitations, so this is not a bypass anyone can type their
        way into. Accepting the invitation (٦.٢b) arrives by deep link and
        never passes through this gate, which is why the gap only shows up
        later, at the moment recovery is needed.
      */}
      {guardianships !== undefined && guardianships.length > 0 ? (
        <Button
          variant="ghost"
          className="mt-2"
          onPress={() => router.push("/recovery/approve")}
        >
          <Text>{t.guardianHere}</Text>
        </Button>
      ) : null}
    </Screen>
  )
}
