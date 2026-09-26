import { useState } from "react"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { ChoiceField } from "@workspace/ui-native/components/wassiya/choice-field"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { SecretValue } from "@workspace/ui-native/components/wassiya/secret-value"
import { Eye, EyeOff } from "lucide-react-native"
import { Pressable } from "react-native"

import type {
  DigitalForm,
  Disposition,
} from "@/screens/assets/detail/forms/digital"

/**
 * ٤.٧'s fields, as label-over-value rows.
 *
 * ## What is masked, and what deliberately is not
 *
 * The password and the recovery codes hide behind a plain eye. The **two-factor
 * field does not** — it is free text and unmasked by design,
 * because a rotating six-digit code is worthless to an executor and *where the
 * second factor lives* is everything. Masking "Authy on the iPad" would protect
 * nothing and hide the only part that gets someone in.
 *
 * The service and the username are not secrets either: they are how the owner
 * recognises the row.
 *
 * ## Focus dims the rest
 *
 * One row at a time carries the terracotta label and the 2px rule; the others
 * drop to 45%. That is the focus model — the screen narrows without
 * dimming into a modal, and nothing moves.
 */
export type DigitalFieldsProps = {
  value: DigitalForm
  onChange: (patch: Partial<DigitalForm>) => void
  /** The `assets/detail` dictionary — field labels. */
  labels: Record<string, string>
  /** The `assets/new/account` dictionary — placeholders. */
  account: Record<string, string>
  /** Called the first time a secret here is unmasked — writes the audit line. */
  onReveal: () => void
}

type Key = "service" | "username" | "password" | "twoFactor" | "recovery"

export function DigitalFields({
  value,
  onChange,
  labels,
  account,
  onReveal,
}: DigitalFieldsProps) {
  const [focused, setFocused] = useState<Key | null>(null)
  const [shown, setShown] = useState<Record<string, boolean>>({})

  const state = (key: Key) => ({
    active: focused === key,
    dimmed: focused !== null && focused !== key,
    onPress: () => setFocused(key),
  })

  const bind = (key: Key) => ({
    onFocus: () => setFocused(key),
    onBlur: () => setFocused((current) => (current === key ? null : current)),
  })

  function toggle(key: Key) {
    if (shown[key] !== true) onReveal()
    setShown((current) => ({ ...current, [key]: current[key] !== true }))
  }

  const eye = (key: Key) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={labels[EYE_LABEL[key]] ?? ""}
      onPress={() => toggle(key)}
      hitSlop={10}
      className="shrink-0"
    >
      <Icon
        as={shown[key] === true ? EyeOff : Eye}
        size={19}
        strokeWidth={2.75}
        className="text-foreground opacity-50"
      />
    </Pressable>
  )

  return (
    <>
      <FieldRow label={labels.fieldService!} divider {...state("service")}>
        <FieldValue
          value={value.service}
          onChangeText={(service) => onChange({ service })}
          placeholder={account.servicePlaceholder}
          {...bind("service")}
        />
      </FieldRow>

      <FieldRow label={labels.fieldUsername!} divider {...state("username")}>
        <FieldValue
          value={value.username}
          onChangeText={(username) => onChange({ username })}
          placeholder={account.usernamePlaceholder}
          autoCapitalize="none"
          keyboardType="email-address"
          ltr
          {...bind("username")}
        />
      </FieldRow>

      <FieldRow
        label={labels.fieldPassword!}
        divider
        trailing={eye("password")}
        {...state("password")}
      >
        <SecretValue
          value={value.password}
          onChangeText={(password) => onChange({ password })}
          masked={shown.password !== true}
          {...bind("password")}
        />
      </FieldRow>

      {/* Unmasked on purpose — see the note above. */}
      <FieldRow label={labels.fieldTwoFactor!} divider {...state("twoFactor")}>
        <FieldValue
          prose
          value={value.twoFactor}
          onChangeText={(twoFactor) => onChange({ twoFactor })}
          placeholder={account.twoFactorPlaceholder}
          {...bind("twoFactor")}
        />
      </FieldRow>

      <FieldRow
        label={labels.fieldRecoveryCodes!}
        divider
        trailing={eye("recovery")}
        {...state("recovery")}
      >
        <SecretValue
          value={value.recovery}
          onChangeText={(recovery) => onChange({ recovery })}
          masked={shown.recovery !== true}
          mask="•••• •••• ••••"
          multiline
          {...bind("recovery")}
        />
      </FieldRow>

      {/* The only row that is a decision rather than a value. ٤.٧ ships no
          default for it, so an unset one reads as unset — never as "hand
          over", which is the answer most people would not have chosen. */}
      <FieldRow label={labels.fieldDisposition!}>
        <ChoiceField
          label={labels.fieldDisposition!}
          value={value.disposition}
          onChange={(next) => onChange({ disposition: next as Disposition })}
          placeholder={labels.choosePlaceholder!}
          options={[
            { value: "handOver", label: account.dispositionHandOver! },
            { value: "delete", label: account.dispositionDelete! },
            { value: "memorialise", label: account.dispositionMemorialise! },
          ]}
        />
      </FieldRow>
    </>
  )
}

const EYE_LABEL: Record<Key, string> = {
  service: "fieldService",
  username: "fieldUsername",
  password: "fieldPassword",
  twoFactor: "fieldTwoFactor",
  recovery: "fieldRecoveryCodes",
}
