/**
 * ٩.١b — الملف الشخصي. Name and country are edited here; the email is Clerk's
 * sign-in identity and pushes to ٩.١c instead.
 *
 * The display name is cosmetic — the app never sends it anywhere, and Didit
 * reads the name off the document. `claims.ts` matches a death certificate
 * against `identityVerifiedName`, never against this field, which is what makes
 * editing it safe; both are shown here so the difference is visible in one
 * place.
 *
 * Changing the country re-validates every heir's phone against it, so a number
 * stored under the old one starts failing `checkPhone`. The affected count is
 * shown before the change, not discovered afterwards.
 */
import { useState } from "react"
import { useUser } from "@clerk/expo"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { FieldLink } from "@workspace/ui-native/components/wassiya/field-link"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { PrimaryCta } from "@workspace/ui-native/components/wassiya/primary-cta"
import { fmtNum } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { View } from "react-native"

import { BackButton } from "@/components/back-button"
import { CountryPicker } from "@/components/country-picker"
import { Field } from "@/components/field"
import { Screen } from "@/components/screen"
import { useStrings } from "@/i18n/use-strings"
import { checkPhone } from "@/lib/phone"
import { splitFullName } from "@/stores/onboarding"

export function ProfileScreen() {
  const { t, locale } = useStrings("settings/profile")
  const { t: common } = useStrings("common")

  const me = useQuery(api.users.me)
  const heirs = useQuery(api.heirs.list)
  const saveProfile = useMutation(api.users.saveProfile)
  const { user } = useUser()

  const [draft, setDraft] = useState<{ name: string; country: string } | null>(
    null
  )
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  // Seeded from the query the first render it answers, rather than in an
  // effect: `me` is undefined on mount and a `useState(me.name)` would latch
  // onto that and never recover.
  const initial = { name: me?.name ?? "", country: me?.country ?? "" }
  const value = draft ?? initial
  const edit = (patch: Partial<typeof initial>) =>
    setDraft({ ...value, ...patch })

  const dirty =
    value.name.trim() !== initial.name.trim() ||
    value.country !== initial.country

  /**
   * Heirs whose stored number would stop validating under the chosen country.
   *
   * Counted against the *draft* country, so the warning appears the moment the
   * picker changes and disappears if it is changed back — it is a preview of
   * the consequence, not a report on what already happened.
   */
  const strandedHeirs =
    value.country === initial.country
      ? 0
      : (heirs ?? []).filter(
          (heir) => checkPhone(heir.phone, value.country).status !== "valid"
        ).length

  async function save() {
    if (!dirty || value.name.trim().length === 0) return
    setSaving(true)
    setFailed(false)
    try {
      // Two writes, and the order matters: the name lives on Clerk and reaches
      // Convex through the user webhook, so it is sent first and the country —
      // which this deployment owns outright — second. A failure on the first
      // leaves both unchanged.
      if (value.name.trim() !== initial.name.trim()) {
        await user?.update(splitFullName(value.name))
      }
      if (value.country !== initial.country) {
        await saveProfile({ country: value.country })
      }
      router.back()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  const verified = me?.identityStatus === "verified"

  return (
    <Screen keyboard contentClassName="gap-header">
      <BackButton label={common.back} />
      <Text variant="screenTitle">{t.title}</Text>

      <View className="gap-4">
        <Field
          label={t.nameLabel}
          value={value.name}
          onChangeText={(name) => edit({ name })}
          autoComplete="name"
          hint={t.nameNotice}
          error={
            value.name.trim().length === 0 && draft !== null
              ? t.nameRequired
              : undefined
          }
        />

        <CountryPicker
          label={t.countryLabel}
          value={value.country}
          onChange={(country) => edit({ country })}
          hint={t.countryNotice}
          locale={locale}
        />

        {strandedHeirs > 0 ? (
          <AlertBanner
            variant="notice"
            description={t.countryHeirsWarning!.replace(
              "{n}",
              fmtNum(strandedHeirs, locale)
            )}
          />
        ) : null}

        {/* Boxed like the two above it, because it is the third thing on this
            screen you can change. It was a hairline `field-row` — the vault's
            grammar — which made the one editable thing that leaves for another
            screen look like the one thing that is read-only. */}
        <FieldLink
          label={t.emailLabel!}
          value={me?.email ?? ""}
          onPress={() => router.push("/settings/email")}
        />
      </View>

      {failed ? (
        <Text variant="meta" className="text-terracotta-800">
          {t.saveFailed}
        </Text>
      ) : null}

      {dirty ? (
        <PrimaryCta
          label={t.save!}
          onPress={() => void save()}
          disabled={value.name.trim().length === 0}
          busy={saving}
        />
      ) : null}

      {/* Below the fields and apart from them: this is the one block on the
          screen nobody can change, and hairline rows say that where a box would
          imply otherwise. */}
      <View className="mb-auto gap-2">
        <Text variant="sectionLabel">{t.identityLabel}</Text>
        <FieldRow
          label={t.identityStatusLabel!}
          divider={me?.identityVerifiedName != null}
        >
          <Text
            variant="rowTitle"
            className={verified ? "text-olive-700" : "text-terracotta-800"}
          >
            {verified ? t.identityVerified : t.identityUnverified}
          </Text>
        </FieldRow>
        {me?.identityVerifiedName != null ? (
          <FieldRow label={t.identityNameLabel!}>
            <Text variant="rowTitle">{me.identityVerifiedName}</Text>
          </FieldRow>
        ) : null}
      </View>
    </Screen>
  )
}
