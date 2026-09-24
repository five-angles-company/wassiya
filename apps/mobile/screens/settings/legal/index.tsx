/**
 * ٩.٥ — قانوني.
 *
 * The disclaimer here is the same sentence the claim funnel's footer carries,
 * and it is the product's single most important legal statement: Wassiya
 * delivers access, and shares are set by law. It is repeated rather than
 * cross-linked because the two audiences never meet — an owner inside the app,
 * and a grieving relative on the public web — and each has to read it where
 * they already are.
 */
import { Text } from "@workspace/ui-native/components/ui/text"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import Constants from "expo-constants"
import { FileText, Lock, ShieldCheck } from "lucide-react-native"
import { Linking, View } from "react-native"

import { BackButton } from "@/components/back-button"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"

const SITE = "https://wassiya.app"

/** The site serves Arabic unprefixed and English under `/en/`. */
function legalUrl(locale: "ar" | "en", page: string): string {
  return `${SITE}${locale === "en" ? "/en" : ""}/legal/${page}`
}

export function LegalScreen() {
  const { t, locale } = useStrings("settings/legal")
  const { t: common } = useStrings("common")

  return (
    <Screen>
      <BackButton label={common.back} />
      <Text variant="screenTitle" className="mb-header mt-4">
        {t.title}
      </Text>

      <View className="rounded-card bg-card overflow-hidden">
        <SettingsRow
          icon={FileText}
          label={t.terms}
          chevron
          divider
          onPress={() => void Linking.openURL(legalUrl(locale, "terms"))}
        />
        <SettingsRow
          icon={Lock}
          label={t.privacy}
          chevron
          divider
          onPress={() => void Linking.openURL(legalUrl(locale, "privacy"))}
        />
        <SettingsRow
          icon={ShieldCheck}
          label={t.encryption}
          chevron
          onPress={() => void Linking.openURL(legalUrl(locale, "encryption"))}
        />
      </View>

      <Text
        variant="metaSm"
        className="text-muted-foreground mt-header leading-[1.75]"
      >
        {t.notLegal}
      </Text>
      <Text variant="metaSm" className="text-muted-foreground mt-3">
        {t.version.replace("{v}", Constants.expoConfig?.version ?? "—")}
      </Text>
    </Screen>
  )
}
