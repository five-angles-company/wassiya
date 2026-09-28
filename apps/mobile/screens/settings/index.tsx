/**
 * ٩.١ — الإعدادات.
 *
 * The language control writes `users.me().locale`, which nothing had ever
 * written before: `resolveLocale` falls back to Arabic, so the complete English
 * string set shipped live, typechecked and unreachable.
 *
 * It does **not** change direction. `app.json` sets `forcesRTL: true` on the
 * expo-localization plugin, so the tree is mirrored natively before the first
 * view exists and direction cannot follow a runtime setting without a rebuild.
 * The note under the control says so, rather than letting someone pick English
 * and wonder why the layout did not flip.
 */
import { useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ConfirmSheet } from "@workspace/ui-native/components/wassiya/confirm-sheet"
import { SettingsRow } from "@workspace/ui-native/components/wassiya/settings-row"
import { SheetSelect } from "@workspace/ui-native/components/wassiya/sheet-select"
import { useClerk } from "@clerk/expo"
import { router } from "expo-router"
import {
  FileKey,
  FileText,
  Fingerprint,
  Languages,
  LifeBuoy,
  LogOut,
  ScrollText,
  Smartphone,
  UserRound,
  Wallet,
} from "lucide-react-native"
import { View } from "react-native"

import { Screen } from "@/components/screen"
import { ScreenHeader } from "@/components/screen-header"
import { useStrings } from "@/i18n/use-strings"
import { DeleteAccount } from "@/screens/settings/components/delete-account"
import {
  AUTO_LOCK_CHOICES,
  LOCK_WHILE_OPEN,
  usePreferences,
} from "@/stores/preferences"

export function SettingsScreen() {
  const { t, locale } = useStrings("settings")
  const keyring = useQuery(api.keyring.get)
  const sheetStatus =
    keyring === undefined || keyring === null
      ? undefined
      : keyring.paperUsedAt != null
        ? t.sheetUsed
        : keyring.paperPrintedAt == null
          ? t.sheetNeverPrinted
          : t.sheetVersion.replace("{v}", String(keyring.paperVersion))
  // Only for the row's label — the screen it opens owns the rest.
  const { t: p } = useStrings("settings/profile")
  const { t: autoLock } = useStrings("settings/lock")
  const me = useQuery(api.users.me)
  const plan = useQuery(api.plans.current)
  // Borrowed from the plan screen rather than restated here: two dictionaries
  // naming the same two plans is two places for them to disagree.
  const { t: planNames } = useStrings("settings/plan")
  const saveProfile = useMutation(api.users.saveProfile)
  const { signOut } = useClerk()
  const autoLockMinutes = usePreferences((s) => s.autoLockMinutes)
  const setAutoLockMinutes = usePreferences((s) => s.setAutoLockMinutes)
  const supportUnread = useQuery(api.support.threads.unreadCount)

  const [signingOut, setSigningOut] = useState(false)
  const [leaving, setLeaving] = useState(false)

  async function leave(dismiss: () => Promise<void>) {
    setLeaving(true)
    await dismiss()
    await signOut()
    router.replace("/")
  }

  return (
    <Screen>
      {/* The email answers the question this tab exists for: which account am
          I signed into? */}
      <ScreenHeader eyebrow={me?.email ?? undefined} title={t.title!} />

      <Group label={t.groupAccount}>
        <SettingsRow
          icon={UserRound}
          label={p.title}
          detail={me?.name ?? undefined}
          chevron
          divider
          onPress={() => router.push("/settings/profile")}
        />
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
        {/* A single choice, applied on tap like the language. The note under the
            options carries the "while open" trade, read while choosing. */}
        <SheetSelect
          label={t.rowAutoLock}
          value={String(autoLockMinutes)}
          options={AUTO_LOCK_CHOICES.map((choice) => ({
            value: String(choice),
            label: autoLockLabel(choice, autoLock),
          }))}
          onChange={(value) => setAutoLockMinutes(Number(value))}
          note={autoLock.note}
          trigger={(open, selected) => (
            <SettingsRow
              icon={Fingerprint}
              label={t.rowAutoLock}
              value={selected?.label}
              chevron
              divider
              onPress={open}
            />
          )}
        />
        <SettingsRow
          icon={Smartphone}
          label={t.rowDevices}
          chevron
          divider
          onPress={() => router.push("/settings/devices")}
        />
        {/* Named for what it does. The row deliberately does not say "view" or
            "download": `S_paper` is never persisted, so the code on the current
            sheet cannot be shown again — the screen behind this offers status
            and a reissue, which is the only honest pair. */}
        <SettingsRow
          icon={FileKey}
          label={t.rowRecoverySheet}
          value={sheetStatus}
          chevron
          divider
          onPress={() => router.push("/settings/recovery-sheet")}
        />
        <SettingsRow
          icon={ScrollText}
          label={t.rowAudit}
          chevron
          onPress={() => router.push("/settings/audit")}
        />
      </Group>

      <Group label={t.groupGeneral}>
        <SettingsRow
          icon={Wallet}
          label={t.rowPlan}
          value={
            plan === undefined
              ? undefined
              : plan.plan === "annual"
                ? planNames.annualPlan
                : planNames.freePlan
          }
          chevron
          divider
          onPress={() => router.push("/settings/plan")}
        />
        <SettingsRow
          icon={LifeBuoy}
          label={t.rowHelp}
          value={supportUnread ? t.helpNewReply : undefined}
          valueTone="action"
          chevron
          divider
          onPress={() => router.push("/settings/help")}
        />
        <SettingsRow
          icon={FileText}
          label={t.rowLegal}
          chevron
          onPress={() => router.push("/settings/legal")}
        />
      </Group>

      <Group>
        <SettingsRow
          icon={LogOut}
          label={t.signOut}
          divider
          onPress={() => setSigningOut(true)}
        />
        <DeleteAccount dueAt={me?.deletionDueAt ?? null} />
      </Group>

      <ConfirmSheet
        open={signingOut}
        onClose={() => setSigningOut(false)}
        title={t.signOutTitle!}
        body={[t.signOutBody!]}
        confirmLabel={t.signOut!}
        cancelLabel={t.cancel!}
        onConfirm={(dismiss) => void leave(dismiss)}
        busy={leaving}
      />
    </Screen>
  )
}

function Group({
  label,
  children,
}: {
  label?: string
  children: React.ReactNode
}) {
  return (
    <View className="mb-6 gap-2">
      {label !== undefined ? <Text variant="sectionLabel">{label}</Text> : null}
      <View className="overflow-hidden rounded-card bg-card">{children}</View>
    </View>
  )
}

/** A lock window, in the words the sheet offers. */
function autoLockLabel(minutes: number, t: Record<string, string>): string {
  if (minutes === LOCK_WHILE_OPEN) return t.whileOpen!
  if (minutes === 1) return t.minute1!
  if (minutes === 15) return t.minute15!
  if (minutes === 60) return t.minute60!
  return t.minute5!
}
