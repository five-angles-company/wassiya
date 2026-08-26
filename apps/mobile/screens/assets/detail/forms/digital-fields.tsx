import { ChoiceRow } from "@workspace/ui-native/components/wassiya/choice-row"
import { EditableRow } from "@workspace/ui-native/components/wassiya/editable-row"
import { fmtNum } from "@workspace/ui-native/lib/format"
import type { Locale } from "@workspace/ui-native/lib/labels"

import {
  recoveryCount,
  type DigitalForm,
  type Disposition,
} from "@/screens/assets/detail/forms/digital"

/**
 * ٤.٧'s fields, as rows.
 *
 * The same six values the wizard collects, in the same order, so an owner who
 * created the account recognises the screen they are editing it on. What
 * changes is the shape: the wizard stacks labelled boxes because it is asking
 * six questions in a row, and this is a list of facts about one thing.
 *
 * ## What is masked, and what is not
 *
 * The service and the username are not secrets — they are how the owner finds
 * the row — so they render plainly. Password, two-factor and recovery codes are
 * masked, each with its own eye, so revealing one does not put the other two on
 * screen. That is the difference between this and the old reveal-the-whole-blob
 * gate: the owner asks for exactly the value they need.
 *
 * The two long fields expand rather than sitting inline. A free-text 2FA note
 * ("Authy on the iPad, codes in the safe") and eight recovery codes do not fit
 * a value slot, and truncating either would hide the part that gets an heir in.
 */
export type DigitalFieldsProps = {
  value: DigitalForm
  onChange: (patch: Partial<DigitalForm>) => void
  /** The `assets/detail` dictionary — field labels. */
  labels: Record<string, string>
  /** The `assets/new/account` dictionary — the disposition options. */
  account: Record<string, string>
  locale: Locale
  /** Called the first time any secret here is unmasked — writes the audit line. */
  onReveal: () => void
}

/** What a masked value shows when its editor is closed. */
const MASK = "••••••"

export function DigitalFields({
  value,
  onChange,
  labels,
  account,
  locale,
  onReveal,
}: DigitalFieldsProps) {
  const codes = recoveryCount(value.recovery)

  return (
    <>
      <EditableRow
        label={labels.fieldService!}
        value={value.service}
        onChangeText={(service) => onChange({ service })}
        placeholder={account.servicePlaceholder}
        divider
      />
      <EditableRow
        label={labels.fieldUsername!}
        value={value.username}
        onChangeText={(username) => onChange({ username })}
        placeholder={account.usernamePlaceholder}
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
      <EditableRow
        label={labels.fieldTwoFactor!}
        value={value.twoFactor}
        onChangeText={(twoFactor) => onChange({ twoFactor })}
        placeholder={account.twoFactorPlaceholder}
        secret
        expand
        summary={value.twoFactor.length > 0 ? MASK : "—"}
        onReveal={onReveal}
        divider
      />
      <EditableRow
        label={labels.fieldRecoveryCodes!}
        value={value.recovery}
        onChangeText={(recovery) => onChange({ recovery })}
        placeholder={account.recoveryPlaceholder}
        secret
        expand
        mono
        onReveal={onReveal}
        summary={
          codes > 0
            ? labels.codesCount!.replace("{n}", fmtNum(codes, locale))
            : "—"
        }
        divider
      />

      {/* Last, and the only row that is a decision rather than a value. ٤.٧
          ships no default for it on purpose, so an unset one reads as unset
          rather than as "hand over". */}
      <ChoiceRow
        label={labels.fieldDisposition!}
        value={value.disposition}
        onChange={(next) => onChange({ disposition: next as Disposition })}
        placeholder={labels.choosePlaceholder!}
        tone={value.disposition === null ? "action" : "default"}
        options={[
          { value: "handOver", label: account.dispositionHandOver! },
          { value: "delete", label: account.dispositionDelete! },
          { value: "memorialise", label: account.dispositionMemorialise! },
        ]}
      />
    </>
  )
}
