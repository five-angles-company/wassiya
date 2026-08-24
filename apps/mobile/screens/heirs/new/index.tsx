/**
 * ٥.٢ — adding an heir.
 *
 * Three decisions the board is firm about, and each is enforced here rather
 * than merely displayed:
 *
 * 1. **Relationship is a required enum, never free text.** It is recorded on
 *    the will document and suggests routing. The note under the field says what
 *    it is *not* used for, because a "relationship" field on an inheritance app
 *    invites exactly one assumption and the product's whole position is that
 *    shares are the law's business.
 * 2. **The contact is validated hard.** It is the channel the release chain
 *    uses; a wrong digit surfaces when nobody can ask the owner to fix it.
 * 3. **Silent is the default.** Notifying someone that they are in your will is
 *    a social act with consequences in a family, and the app must not perform
 *    it on the owner's behalf by pre-selecting it.
 */
import { useMemo, useState } from "react"
import { useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Text } from "@workspace/ui-native/components/ui/text"
import { fmtCode } from "@workspace/ui-native/lib/format"
import { router } from "expo-router"
import { View } from "react-native"

import { Field } from "@/components/field"
import { useStrings } from "@/i18n/use-strings"
import { checkPhone, dialCode } from "@/lib/phone"
import { OptionChips } from "@/screens/assets/new/components/option-chips"
import { WizardFrame } from "@/screens/assets/new/components/wizard-frame"
import { ModeChoice } from "@/screens/heirs/new/components/mode-choice"

export function NewHeirScreen() {
  const { t } = useStrings("heirs/new")
  const me = useQuery(api.users.me)
  const existing = useQuery(api.heirs.list)
  const add = useMutation(api.heirs.add)

  const [name, setName] = useState("")
  const [relation, setRelation] = useState("")
  const [phone, setPhone] = useState("")
  const [mode, setMode] = useState<"silent" | "notified">("silent")
  const [saving, setSaving] = useState(false)
  const [failed, setFailed] = useState(false)

  // The owner's own country decides the number format — an heir is almost
  // always in the same country, and 5.2 shows one dial code, not a picker.
  const country = me?.country ?? "SA"
  const check = checkPhone(phone, country)

  const duplicate = useMemo(() => {
    if (check.status !== "valid" || existing === undefined) return false
    return existing.some((heir) => heir.phone === check.e164)
  }, [check, existing])

  const usable = check.status === "valid" || check.status === "unknownCountry"

  async function save() {
    if (!usable || duplicate || relation.length === 0) return
    setSaving(true)
    setFailed(false)
    try {
      await add({
        name: name.trim(),
        relation,
        phone: check.status === "valid" ? check.e164 : check.e164,
        mode,
      })
      router.back()
    } catch {
      setFailed(true)
    } finally {
      setSaving(false)
    }
  }

  return (
    <WizardFrame
      title={t.title}
      step={1}
      stepCount={1}
      canSubmit={
        name.trim().length > 0 && relation.length > 0 && usable && !duplicate
      }
      submitting={saving}
      onSubmit={() => void save()}
    >
      <View className="gap-4">
        <Field
          label={t.nameLabel}
          placeholder={t.namePlaceholder}
          value={name}
          onChangeText={setName}
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
            value={relation}
            onChange={setRelation}
          />
          <Text variant="metaSm" className="text-muted-foreground">
            {t.relationNote}
          </Text>
        </View>

        <Field
          label={t.phoneLabel}
          placeholder={t.phonePlaceholder}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          // Latin digits, LTR — a phone number is dialled, not read as prose.
          className="text-left"
          hint={
            check.status === "valid"
              ? fmtCode(check.e164)
              : `+${dialCode(country) ?? ""}`
          }
          error={
            duplicate
              ? t.phoneDuplicate
              : check.status === "invalid"
                ? t.phoneInvalid
                : undefined
          }
        />

        <ModeChoice value={mode} onChange={setMode} labels={t} />

        {failed ? (
          <Text variant="meta" className="text-terracotta-800">
            {t.failed}
          </Text>
        ) : null}
      </View>
    </WizardFrame>
  )
}

/**
 * The board's own eight, in its order. Stored as the English key so the record
 * does not change meaning with the reader's locale — the will document renders
 * it from this same table.
 */
const RELATIONS = [
  ["daughter", "relDaughter"],
  ["son", "relSon"],
  ["husband", "relHusband"],
  ["wife", "relWife"],
  ["father", "relFather"],
  ["mother", "relMother"],
  ["sibling", "relSibling"],
  ["other", "relOther"],
] as const
