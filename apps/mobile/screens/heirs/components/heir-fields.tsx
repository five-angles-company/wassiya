import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { fmtCode } from "@workspace/ui-native/lib/format"
import { View } from "react-native"

import { Field } from "@/components/field"
import type { useStrings } from "@/i18n/use-strings"
import { dialCode } from "@/lib/phone"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { RELATIONS } from "@/screens/heirs/relations"
import type { HeirForm } from "@/screens/heirs/use-heir-form"

/**
 * The heir form's fields, shared by ٥.٢ and ٥.٢b.
 *
 * Three firm decisions, each enforced by the shape of the
 * control rather than merely displayed:
 *
 * 1. **Relationship is a required enum, never free text.** It is recorded on
 *    the will document and suggests routing. The note under the field says what
 *    it is *not* used for, because a "relationship" field on an inheritance app
 *    invites exactly one assumption and the product's whole position is that
 *    shares are the law's business.
 * 2. **The contact is validated hard.** It is the channel the release chain
 *    uses; a wrong digit surfaces when nobody can ask the owner to fix it.
 * 3. **Every heir is silent**, and that is a statement now rather than a
 *    choice. Notifying someone that they are in your will is a social act with
 *    consequences in a family; the product no longer offers to perform it, so
 *    the note says what will happen instead of asking.
 */
export type HeirFieldsProps = {
  form: HeirForm
  /** The `heirs/new` string table; the edit screen borrows it wholesale. */
  t: ReturnType<typeof useStrings<"heirs/new">>["t"]
  /** Shown under the fields when a save failed. */
  error?: string
  /** An ID number is already registered — the number itself is never shown. */
  hasIdNumber?: boolean
}

export function HeirFields({ form, t, error, hasIdNumber = false }: HeirFieldsProps) {
  const { check, duplicate } = form

  return (
    <View className="gap-4">
      <Field
        label={t.nameLabel}
        placeholder={t.namePlaceholder}
        value={form.name}
        onChangeText={form.setName}
      />

      <View className="gap-2">
        <OptionChips
          label={t.relationLabel}
          options={RELATIONS.map(([value, key]) => ({
            value,
            label: t[key]!,
          }))}
          // No default. A pre-picked relationship is the app deciding
          // something about a family it knows nothing about.
          value={form.relation}
          onChange={form.setRelation}
        />
        <Text variant="metaSm" className="text-muted-foreground">
          {t.relationNote}
        </Text>
      </View>

      <Field
        label={t.phoneLabel}
        placeholder={t.phonePlaceholder}
        value={form.phone}
        onChangeText={form.setPhone}
        keyboardType="phone-pad"
        // Latin digits, LTR — a phone number is dialled, not read as prose.
        className="text-left"
        hint={
          check.status === "valid"
            ? fmtCode(check.e164)
            : `+${dialCode(form.country) ?? ""}`
        }
        error={
          duplicate
            ? t.phoneDuplicate
            : check.status === "invalid"
              ? t.phoneInvalid
              : undefined
        }
      />

      <Field
        label={t.emailLabel}
        placeholder={t.emailPlaceholder}
        value={form.email}
        onChangeText={form.setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        className="text-left"
        hint={t.emailHint}
        error={form.emailInvalid ? t.emailInvalid : undefined}
      />

      <Field
        label={t.idNumberLabel}
        placeholder={hasIdNumber ? t.idNumberRegistered : t.idNumberPlaceholder}
        value={form.idNumber}
        onChangeText={form.setIdNumber}
        keyboardType="number-pad"
        // Latin digits, LTR — an ID number is copied from a card, not read.
        className="text-left"
        hint={t.idNumberHint}
        error={form.idInvalid ? t.idNumberInvalid : undefined}
      />
      {/* The consequence of leaving it empty, stated once, in the one colour
          this screen reserves for something the owner can still fix. */}
      {!hasIdNumber && form.idNumber.length === 0 ? (
        <Text variant="metaSm" className="text-terracotta-700 leading-[1.6]">
          {t.noIdNotice}
        </Text>
      ) : null}

      <Field
        label={t.birthDateLabel}
        placeholder={t.birthDatePlaceholder}
        value={form.birthDate}
        onChangeText={form.setBirthDate}
        keyboardType="numbers-and-punctuation"
        className="text-left"
        error={form.birthDateInvalid ? t.birthDateInvalid : undefined}
      />

      {/* Not a choice any more. Every heir is silent, so the screen states the
          promise where the picker used to ask for it — at the moment someone is
          deciding to name a person. */}
      <AlertBanner variant="info" description={t.silentNotice!} />

      {error !== undefined ? (
        <Text variant="meta" className="text-terracotta-800">
          {error}
        </Text>
      ) : null}
    </View>
  )
}
