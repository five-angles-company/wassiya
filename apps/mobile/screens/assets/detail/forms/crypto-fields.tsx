import { checkMnemonic, type MnemonicCheck } from "@workspace/crypto/mnemonic"
import { ChoiceRow } from "@workspace/ui-native/components/wassiya/choice-row"
import { EditableRow } from "@workspace/ui-native/components/wassiya/editable-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"

import {
  isExchange,
  NETWORKS,
  type CryptoForm,
} from "@/screens/assets/detail/forms/crypto"

/**
 * ٤.٣'s fields, as rows — both of its shapes.
 *
 * ## The phrase keeps a real gate
 *
 * Everything else on these screens is masked with a plain eye. The seed phrase
 * is not: `onRequestReveal` puts a fingerprint in front of it, because it is
 * the one value whose disclosure cannot be undone — a rotated password is an
 * afternoon, a leaked phrase is the wallet. With the vault set to stay open
 * while the app is, this is the one thing standing between a found phone and a
 * drained wallet.
 *
 * ## An unrecorded network shows as unrecorded
 *
 * A wallet saved by ٤.٣ has no network and no kind in its payload — see
 * `crypto.ts`. Those rows load **empty** rather than defaulted, so the screen
 * says "not recorded" instead of quietly asserting Bitcoin. Setting them
 * upgrades the payload on the next save.
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

export function CryptoFields({
  value,
  onChange,
  labels,
  crypto,
  locale,
  onReveal,
  onRequestReveal,
}: CryptoFieldsProps) {
  const exchange = isExchange(value)
  const check = checkMnemonic(value.phrase)

  return (
    <>
      <EditableRow
        label={crypto.nameLabel!}
        value={value.name}
        onChangeText={(name) => onChange({ name })}
        placeholder={crypto.namePlaceholder}
        divider
      />
      <ChoiceRow
        label={labels.fieldNetwork!}
        value={value.network.length > 0 ? value.network : null}
        onChange={(network) => onChange({ network })}
        options={NETWORKS.map((n) => ({ value: n, label: n }))}
        placeholder={labels.notRecorded!}
        divider
      />
      <ChoiceRow
        label={crypto.kindLabel!}
        value={value.kind.length > 0 ? value.kind : null}
        onChange={(kind) => onChange({ kind })}
        options={[
          { value: "hardware", label: crypto.kindHardware! },
          { value: "software", label: crypto.kindSoftware! },
          { value: "exchange", label: crypto.kindExchange! },
        ]}
        placeholder={labels.notRecorded!}
        divider
      />

      {exchange ? (
        <>
          <EditableRow
            label={labels.fieldAccount!}
            value={value.account}
            onChangeText={(account) => onChange({ account })}
            autoCapitalize="none"
            keyboardType="email-address"
            mono
            divider
          />
          <EditableRow
            label={labels.fieldPassword!}
            value={value.password}
            onChangeText={(password) => onChange({ password })}
            secret
            mono
            onReveal={onReveal}
            divider
          />
          {/* Free text on purpose: where the second factor lives outlives any
              code it would generate, and an heir locked out by 2FA is locked
              out for good. */}
          <EditableRow
            label={labels.fieldTwoFactor!}
            value={value.twoFactor}
            onChangeText={(twoFactor) => onChange({ twoFactor })}
            placeholder={crypto.exchangeTwoFactorPlaceholder}
            secret
            expand
            summary={value.twoFactor.length > 0 ? "••••••" : "—"}
            onReveal={onReveal}
          />
        </>
      ) : (
        <EditableRow
          label={crypto.secretLabel!}
          value={value.phrase}
          onChangeText={(phrase) => onChange({ phrase })}
          secret
          expand
          mono
          summary={
            check.words.length > 0
              ? `${fmtNum(check.words.length, locale)} ${locale === "ar" ? "كلمة" : "words"}`
              : "—"
          }
          onReveal={onReveal}
          onRequestReveal={onRequestReveal}
          error={checksumError(check, crypto, locale)}
        />
      )}
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
): string | undefined {
  switch (check.status) {
    case "valid":
      return undefined
    case "unknownWords":
      return t.checksumUnknownWords!.replace(
        "{words}",
        check.unknown.slice(0, 3).join("، ")
      )
    case "badLength":
      // An empty field is not yet a mistake — say nothing until they start.
      return check.count === 0
        ? undefined
        : t.checksumLength!.replace("{n}", fmtNum(check.count, locale))
    case "badChecksum":
      return t.checksumBad
  }
}


