import { useState } from "react"
import { checkMnemonic, type MnemonicCheck } from "@workspace/crypto/mnemonic"
import { Icon } from "@workspace/ui-native/components/ui/icon"
import { Text } from "@workspace/ui-native/components/ui/text"
import { ChoiceField } from "@workspace/ui-native/components/wassiya/choice-field"
import { FieldRow } from "@workspace/ui-native/components/wassiya/field-row"
import { FieldValue } from "@workspace/ui-native/components/wassiya/field-value"
import { RevealPill } from "@workspace/ui-native/components/wassiya/reveal-pill"
import { SecretValue } from "@workspace/ui-native/components/wassiya/secret-value"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"
import { Eye, EyeOff } from "lucide-react-native"
import { Pressable } from "react-native"

import {
  isExchange,
  NETWORKS,
  type CryptoForm,
} from "@/screens/assets/detail/forms/crypto"

/**
 * ٤.٣'s fields.
 *
 * ## Three levels of protection, three sizes of control
 *
 * The seed phrase gets a **filled Reveal button behind a fingerprint**. The
 * device password gets a **plain eye**. Where the device is gets **nothing**.
 * No copy explains the difference, because the controls already do — and the
 * ladder is honest: a phrase that leaks is the wallet, a PIN that leaks needs
 * the device too, and a drawer is not a secret.
 *
 * With the vault set to stay open for as long as the app is, that fingerprint
 * is the last thing between a found phone and a drained wallet.
 *
 * ## An unrecorded network shows as unrecorded
 *
 * A wallet saved by ٤.٣ carries no network and no kind — see `crypto.ts`. Those
 * rows load **empty** rather than defaulted, so the screen says "not recorded"
 * instead of quietly asserting Bitcoin and then saving that assertion.
 */
export type CryptoFieldsProps = {
  value: CryptoForm
  onChange: (patch: Partial<CryptoForm>) => void
  /** The `assets/detail` dictionary. */
  labels: Record<string, string>
  /** The `assets/new/crypto` dictionary. */
  crypto: Record<string, string>
  locale: Locale
  onReveal: () => void
  /** Raises the fingerprint before the phrase is shown. */
  onRequestReveal: () => Promise<boolean>
}

type Key =
  | "name"
  | "phrase"
  | "devicePassword"
  | "deviceLocation"
  | "account"
  | "password"
  | "twoFactor"

export function CryptoFields({
  value,
  onChange,
  labels,
  crypto,
  locale,
  onReveal,
  onRequestReveal,
}: CryptoFieldsProps) {
  const [focused, setFocused] = useState<Key | null>(null)
  const [shown, setShown] = useState<Record<string, boolean>>({})
  const [asking, setAsking] = useState(false)

  const exchange = isExchange(value)
  const check = checkMnemonic(value.phrase)

  const state = (key: Key) => ({
    active: focused === key,
    dimmed: focused !== null && focused !== key,
  })
  const bind = (key: Key) => ({
    onFocus: () => setFocused(key),
    onBlur: () => setFocused((current) => (current === key ? null : current)),
  })

  function toggle(key: Key) {
    if (shown[key] !== true) onReveal()
    setShown((current) => ({ ...current, [key]: current[key] !== true }))
  }

  async function togglePhrase() {
    if (shown.phrase === true) {
      setShown((current) => ({ ...current, phrase: false }))
      return
    }
    setAsking(true)
    try {
      if (await onRequestReveal()) {
        onReveal()
        setShown((current) => ({ ...current, phrase: true }))
      }
    } finally {
      setAsking(false)
    }
  }

  const eye = (key: Key) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={labels.fieldPassword!}
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
      <FieldRow label={crypto.nameLabel!} divider {...state("name")}>
        <FieldValue
          value={value.name}
          onChangeText={(name) => onChange({ name })}
          placeholder={crypto.namePlaceholder}
          {...bind("name")}
        />
      </FieldRow>

      {exchange ? (
        <>
          <FieldRow label={labels.fieldAccount!} divider {...state("account")}>
            <FieldValue
              value={value.account}
              onChangeText={(account) => onChange({ account })}
              autoCapitalize="none"
              keyboardType="email-address"
              ltr
              {...bind("account")}
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
          {/* Free text, unmasked: where the second factor lives outlives any
              code it would generate, and an executor locked out by 2FA is locked
              out for good. */}
          <FieldRow label={labels.fieldTwoFactor!} divider {...state("twoFactor")}>
            <FieldValue
              prose
              value={value.twoFactor}
              onChangeText={(twoFactor) => onChange({ twoFactor })}
              placeholder={crypto.exchangeTwoFactorPlaceholder}
              {...bind("twoFactor")}
            />
          </FieldRow>
        </>
      ) : (
        <>
          <FieldRow
            label={`${crypto.secretLabel} · ${fmtNum(check.words.length, locale)} ${locale === "ar" ? "كلمة" : "words"}`}
            divider
            trailing={
              <RevealPill
                label={shown.phrase === true ? labels.hide! : labels.revealShort!}
                onPress={() => void togglePhrase()}
                busy={asking}
                disabled={focused !== null && focused !== "phrase"}
              />
            }
            {...state("phrase")}
          >
            <SecretValue
              value={value.phrase}
              onChangeText={(phrase) => onChange({ phrase })}
              masked={shown.phrase !== true}
              mask="•••• •••• ••••"
              multiline={shown.phrase === true}
              {...bind("phrase")}
            />
          </FieldRow>

          {check.status !== "valid" && value.phrase.trim().length > 0 ? (
            <Text className="text-terracotta-800 mb-1 text-[11.5px] leading-[1.6]">
              {checksumError(check, crypto, locale)}
            </Text>
          ) : null}

          <FieldRow
            label={labels.fieldDevicePassword!}
            divider
            trailing={eye("devicePassword")}
            {...state("devicePassword")}
          >
            <SecretValue
              value={value.devicePassword}
              onChangeText={(devicePassword) => onChange({ devicePassword })}
              masked={shown.devicePassword !== true}
              {...bind("devicePassword")}
            />
          </FieldRow>

          {/* No control at all — a drawer is not a secret, and the whole point
              is that an executor can read it. */}
          <FieldRow
            label={labels.fieldDeviceLocation!}
            divider
            {...state("deviceLocation")}
          >
            <FieldValue
              prose
              value={value.deviceLocation}
              onChangeText={(deviceLocation) => onChange({ deviceLocation })}
              placeholder={labels.deviceLocationPlaceholder}
              {...bind("deviceLocation")}
            />
          </FieldRow>
        </>
      )}

      <FieldRow label={labels.fieldNetwork!} divider>
        <ChoiceField
          label={labels.fieldNetwork!}
          value={value.network.length > 0 ? value.network : null}
          onChange={(network) => onChange({ network })}
          placeholder={labels.notRecorded!}
          options={NETWORKS.map((n) => ({ value: n, label: n }))}
        />
      </FieldRow>

      <FieldRow label={crypto.kindLabel!}>
        <ChoiceField
          label={crypto.kindLabel!}
          value={value.kind.length > 0 ? value.kind : null}
          onChange={(kind) => onChange({ kind })}
          placeholder={labels.notRecorded!}
          options={[
            { value: "hardware", label: crypto.kindHardware! },
            { value: "software", label: crypto.kindSoftware! },
            { value: "exchange", label: crypto.kindExchange! },
          ]}
        />
      </FieldRow>
    </>
  )
}

/**
 * The wizard's own formatter, kept identical. Order matters: naming the three
 * misspelled words beats reporting a word count, and both beat "checksum
 * invalid", which tells someone nothing they can fix.
 */
function checksumError(
  check: MnemonicCheck,
  t: Record<string, string>,
  locale: Locale
): string {
  switch (check.status) {
    case "valid":
      return ""
    case "unknownWords":
      return t.checksumUnknownWords!.replace(
        "{words}",
        check.unknown.slice(0, 3).join("، ")
      )
    case "badLength":
      return t.checksumLength!.replace("{n}", fmtNum(check.count, locale))
    case "badChecksum":
      return t.checksumBad!
  }
}
