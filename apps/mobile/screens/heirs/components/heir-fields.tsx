import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtCode } from "@workspace/ui-native/lib/format"
import { View } from "react-native"

import { Field } from "@/components/field"
import type { useStrings } from "@/i18n/use-strings"
import { dialCode } from "@/lib/phone"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { ModeChoice } from "@/screens/heirs/new/components/mode-choice"
import { RELATIONS } from "@/screens/heirs/relations"
import type { HeirForm } from "@/screens/heirs/use-heir-form"

/**
 * The heir form's fields, shared by ٥.٢ and ٥.٢b.
 *
 * Three decisions the board is firm about, each enforced by the shape of the
 * control rather than merely displayed:
 *
 * 1. **Relationship is a required enum, never free text.** It is recorded on
 *    the will document and suggests routing. The note under the field says what
 *    it is *not* used for, because a "relationship" field on an inheritance app
 *    invites exactly one assumption and the product's whole position is that
 *    shares are the law's business.
 * 2. **The contact is validated hard.** It is the channel the release chain
 *    uses; a wrong digit surfaces when nobody can ask the owner to fix it.
 * 3. **Silent is the default** on a new heir. Notifying someone that they are
 *    in your will is a social act with consequences in a family, and the app
 *    must not perform it on the owner's behalf by pre-selecting it. On an edit
 *    the stored value wins — this component never re-applies the default.
 */
export type HeirFieldsProps = {
  form: HeirForm
  /** The `heirs/new` string table; the edit screen borrows it wholesale. */
  t: ReturnType<typeof useStrings<"heirs/new">>["t"]
  /** Shown under the fields when a save failed. */
  error?: string
}

export function HeirFields({ form, t, error }: HeirFieldsProps) {
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

      <ModeChoice value={form.mode} onChange={form.setMode} labels={t} />

      {error !== undefined ? (
        <Text variant="meta" className="text-terracotta-800">
          {error}
        </Text>
      ) : null}
    </View>
  )
}
