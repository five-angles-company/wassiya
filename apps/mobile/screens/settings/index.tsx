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
import { SheetSelect } from "@workspace/ui-native/components/wassiya/sheet-select"
import { useClerk } from "@clerk/expo"
import { router } from "expo-router"
import { FileText, Fingerprint, Languages, LogOut, ScrollText, Smartphone, UserRound, Wallet } from "lucide-react-native"
import { Alert, View } from "react-native"

import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { LOCK_WHILE_OPEN, usePreferences } from "@/stores/preferences"

export function SettingsScreen() {
  const { t, locale } = useStrings("settings")
  // Only for the row's label — the screen it opens owns the rest.
  const { t: p } = useStrings("settings/profile")
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
    <Screen>
      {/* The tab-root header: a quiet line over a 19px name, as on ٣.١, ٤.١
          and ٥.١. The email is the one fact this screen can state that no
          other screen does — and "which account am I signed into?" is the
          question the tab exists to answer. */}
      <View className="mb-header min-w-0">
        {me?.email ? <Text variant="metaSm">{me.email}</Text> : null}
        <Text variant="pageTitle">{t.title}</Text>
      </View>

      <Group label={t.groupAccount}>
        <SettingsRow
          icon={UserRound}
          label={p.title}
          detail={me?.name ?? undefined}
          chevron
          divider
          onPress={() => router.push("/settings/profile")}
        />
        {/* A row like every other row here, opening the same sheet the country
            picker uses. It was a card of chips nested inside the Group's own
            card — two surfaces of the same colour, and the only setting on this
            screen you changed in place rather than by opening something. The
            caveat about direction moved into the sheet, where you read it while
            choosing instead of after. */}
        <SheetSelect
          label={t.rowLanguage}
          value={locale}
          options={[
            { value: "ar", label: t.languageArabic },
            { value: "en", label: t.languageEnglish },
          ]}
          onChange={(value) => {
            // BCP 47, matching what `resolveLocale` parses — it reads only the
            // language subtag, so the region is cosmetic here.
            void saveProfile({ locale: value === "en" ? "en-US" : "ar-SA" })
          }}
          note={t.languageNote}
          trigger={(open, selected) => (
            <SettingsRow
              icon={Languages}
              label={t.rowLanguage}
              value={selected?.label}
              chevron
              onPress={open}
            />
          )}
        />
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
          icon={Smartphone}
          label={t.rowDevices}
          chevron
          divider
          onPress={() => router.push("/settings/devices")}
        />
        {/*
          The app's second persona used to have a row here — the guardian's
          recovery ceremony. Both halves of the reason it existed are gone: a
          guardian is no longer part of recovery, and a guardian is no longer a
          user of *this* app. Mobile is the owner's app; everything a guardian
          does happens on the web. So this is a deletion, not a move.
        */}
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
    </Screen>
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
  if (minutes === LOCK_WHILE_OPEN) return t.whileOpen!
  if (minutes === 1) return t.minute1!
  if (minutes === 15) return t.minute15!
  if (minutes === 60) return t.minute60!
  return t.minute5!
}
