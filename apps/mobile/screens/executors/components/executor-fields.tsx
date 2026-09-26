import { Text } from "@workspace/ui-native/components/ui/text"
import { AlertBanner } from "@workspace/ui-native/components/wassiya/alert-banner"
import { fmtCode } from "@workspace/ui-native/lib/format"
import { View } from "react-native"

import { Field } from "@/components/field"
import type { useStrings } from "@/i18n/use-strings"
import { dialCode } from "@/lib/phone"
import type { ExecutorForm } from "@/screens/executors/use-executor-form"

/**
 * The executor form's fields, shared by ٥.٢ and ٥.٢b.
 *
 * The contact is validated hard: it is the channel the release chain uses, and
 * a wrong digit surfaces when nobody can ask the owner to fix it. The ID number
 * is required because the executor's verified document is matched against it
 * before anything opens.
 */
export type ExecutorFieldsProps = {
  form: ExecutorForm
  /** The `executors/new` string table; the edit screen borrows it wholesale. */
  t: ReturnType<typeof useStrings<"executors/new">>["t"]
  /** Shown under the fields when a save failed. */
  error?: string
  /** An ID number is already registered — the number itself is never shown. */
  hasIdNumber?: boolean
}

export function ExecutorFields({ form, t, error, hasIdNumber = false }: ExecutorFieldsProps) {
  const { check, duplicate } = form

  return (
    <View className="gap-4">
      <Field
        label={t.nameLabel}
        placeholder={t.namePlaceholder}
        value={form.name}
        onChangeText={form.setName}
      />

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
        className="text-left"
        hint={t.idNumberHint}
        error={form.idInvalid ? t.idNumberInvalid : undefined}
      />

      <AlertBanner variant="info" description={t.silentNotice!} />

      {error !== undefined ? (
        <Text variant="meta" className="text-terracotta-800">
          {error}
        </Text>
      ) : null}
    </View>
  )
}
