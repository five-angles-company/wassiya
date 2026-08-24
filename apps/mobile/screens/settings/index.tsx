/**
 * ٩.١ — الإعدادات.
 *
 * ## The language control is the interesting part
 *
 * `resolveLocale` reads `users.me().locale` and falls back to Arabic, and the
 * app has shipped a complete English string set from the beginning — but
 * **nothing has ever written that field**, so every session has rendered
 * Arabic and the English pass has been live, typechecked and unreachable.
 * `i18n/locale.ts` says as much and names this screen as where it gets fixed.
 * So it is fixed here.
 *
 * What it does *not* do is change direction. `app.json` sets `forcesRTL: true`
 * on the expo-localization plugin, so the tree is mirrored natively before the
 * first view exists; direction cannot follow a runtime setting without a
 * rebuild. The note under the control says that rather than letting someone
 * pick English and wonder why the layout did not flip.
 */
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { useClerk } from "@clerk/expo"
import { router } from "expo-router"
import {
  FileText,
  Fingerprint,
  LogOut,
  ScrollText,
  ShieldCheck,
  Smartphone,
  Wallet,
} from "lucide-react-native"
import { Alert, ScrollView, View } from "react-native"

import { useStrings } from "@/i18n/use-strings"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { usePreferences } from "@/stores/preferences"

export function SettingsScreen() {
  const { t, locale } = useStrings("settings")
  const { t: autoLock } = useStrings("settings/lock")
  const me = useQuery(api.users.me)
  const saveProfile = useMutation(api.users.saveProfile)
  const { signOut } = useClerk()
  const autoLockMinutes = usePreferences((s) => s.autoLockMinutes)

  function confirmSignOut() {
    Alert.alert(t.signOutTitle, t.signOutBody, [
      { text: t.cancel, style: "cancel" },
      {
        text: t.signOut,
        style: "destructive",
        onPress: () => {
          void (async () => {
            await signOut()
            router.replace("/")
          })()
        },
      },
    ])
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerClassName="px-gutter grow pb-10 pt-6"
    >
      <Text variant="screenTitle" className="mb-header">
        {t.title}
      </Text>

      <Group label={t.groupAccount}>
        <View className="rounded-card bg-card gap-3 p-4">
          <View className="flex-row items-center gap-3">
            <Text variant="rowTitle" className="flex-1">
              {t.rowLanguage}
            </Text>
          </View>
          <OptionChips
            options={[
              { value: "ar", label: t.languageArabic },
              { value: "en", label: t.languageEnglish },
            ]}
            value={locale}
            onChange={(value) => {
              // BCP 47, matching what `resolveLocale` parses — it reads only
              // the language subtag, so the region is cosmetic here.
              void saveProfile({ locale: value === "en" ? "en-US" : "ar-SA" })
            }}
          />
          <Text variant="metaSm" className="text-muted-foreground leading-[1.6]">
            {t.languageNote}
          </Text>
        </View>
      </Group>

      <Group label={t.groupSecurity}>
        <SettingsRow
          icon={Fingerprint}
          label={t.rowAutoLock}
          value={minutesLabel(autoLockMinutes, autoLock)}
          chevron
          divider
          onPress={() => router.push("/settings/lock")}
        />
        <SettingsRow
          icon={ShieldCheck}
          label={t.rowGuardian}
          chevron
          divider
          onPress={() => router.push("/protection/guardian")}
        />
        <SettingsRow
          icon={Smartphone}
          label={t.rowDevices}
          chevron
          divider
          onPress={() => router.push("/settings/devices")}
        />
        <SettingsRow
          icon={ScrollText}
          label={t.rowAudit}
          chevron
          onPress={() => router.push("/settings/audit")}
        />
      </Group>

      <Group label={t.groupPlan}>
        <SettingsRow
          icon={Wallet}
          label={t.rowPlan}
          value={me?.subscription?.plan ?? undefined}
          chevron
          onPress={() => router.push("/settings/plan")}
        />
      </Group>

      <Group label={t.groupLegal}>
        <SettingsRow
          icon={FileText}
          label={t.rowLegal}
          chevron
          onPress={() => router.push("/settings/legal")}
        />
      </Group>

      <SettingsRow
        className="mt-6"
        icon={LogOut}
        label={t.signOut}
        onPress={confirmSignOut}
      />
    </ScrollView>
  )
}

function Group({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <View className="mb-header gap-2">
      <Text variant="sectionLabel">{label}</Text>
      <View className="rounded-card bg-card overflow-hidden">{children}</View>
    </View>
  )
}

/** The current window, in the same words ٩.٢ offers. */
function minutesLabel(minutes: number, t: Record<string, string>): string {
  if (minutes === 1) return t.minute1!
  if (minutes === 15) return t.minute15!
  if (minutes === 60) return t.minute60!
  return t.minute5!
}
