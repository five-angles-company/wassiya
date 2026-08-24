import { Text } from "@workspace/ui-native/components/ui/text"
import { View } from "react-native"

import { Field } from "@/components/field"
import { SECRET_INPUT_PROPS } from "@/lib/secret-input-props"

export type ExchangeCredentials = {
  account: string
  password: string
  twoFactor: string
}

export type ExchangeFieldsProps = {
  value: ExchangeCredentials
  onChange: (patch: Partial<ExchangeCredentials>) => void
  labels: Record<string, string>
}

/**
 * ٤.٣'s exchange variant.
 *
 * A wallet held on an exchange has **no seed phrase** — the account is the
 * custody. Asking for twelve words there is not merely wrong, it is a prompt
 * the user cannot satisfy, and the BIP-39 checksum gate would then refuse to
 * let them save anything at all. So the whole payload changes shape: what an
 * heir needs is a way back into the account.
 *
 * Every field here is as guarded as the phrase it replaces — same
 * `SECRET_INPUT_PROPS`, and the screen's screenshot block and clipboard wipe
 * cover it identically. The 2FA field is free text on purpose: where the second
 * factor lives ("Authy on my iPad", "the recovery codes are in the safe") is
 * more useful to an heir than a code that will have rotated.
 */
export function ExchangeFields({
  value,
  onChange,
  labels,
}: ExchangeFieldsProps) {
  return (
    <View className="gap-4">
      <Field
        label={labels.exchangeAccount}
        placeholder={labels.exchangeAccountPlaceholder}
        value={value.account}
        onChangeText={(account) => onChange({ account })}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <Field
        {...SECRET_INPUT_PROPS}
        label={labels.exchangePassword}
        value={value.password}
        onChangeText={(password) => onChange({ password })}
        secureTextEntry
      />
      <Field
        {...SECRET_INPUT_PROPS}
        label={labels.exchangeTwoFactor}
        placeholder={labels.exchangeTwoFactorPlaceholder}
        value={value.twoFactor}
        onChangeText={(twoFactor) => onChange({ twoFactor })}
        multiline
        className="h-auto min-h-20 py-3"
      />
      <Text variant="metaSm" className="text-muted-foreground leading-[1.7]">
        {labels.exchangeNote}
      </Text>
    </View>
  )
}
