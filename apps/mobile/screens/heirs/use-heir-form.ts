import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"

import { checkPhone } from "@/lib/phone"

/**
 * The four fields an heir is, and the rules that decide whether they can be
 * saved. Shared by ٥.٢ (add) and ٥.٢b (edit), because an edit form *is* the add
 * form with values already in it — and a second copy of the phone rules is a
 * second place for them to drift.
 */
export type HeirFormValues = {
  name: string
  relation: string
  phone: string
  mode: "silent" | "notified"
}

export type HeirForm = ReturnType<typeof useHeirForm>

export function useHeirForm(
  initial: HeirFormValues,
  /**
   * The heir being edited, excluded from the duplicate check.
   *
   * Without it, opening an existing heir and saving *anything* fails: their own
   * number is already in the list, so the form would flag them as a duplicate
   * of themselves and never enable the button.
   */
  selfId?: Id<"heirs">
) {
  const me = useQuery(api.users.me)
  const existing = useQuery(api.heirs.list)

  const [name, setName] = useState(initial.name)
  const [relation, setRelation] = useState(initial.relation)
  const [phone, setPhone] = useState(initial.phone)
  const [mode, setMode] = useState(initial.mode)

  // The owner's own country decides the number format — an heir is almost
  // always in the same country, and 5.2 shows one dial code, not a picker.
  const country = me?.country ?? "SA"
  const check = checkPhone(phone, country)

  const duplicate = useMemo(() => {
    if (check.status !== "valid" || existing === undefined) return false
    return existing.some(
      (heir) => heir.phone === check.e164 && heir.id !== selfId
    )
  }, [check, existing, selfId])

  const usable = check.status === "valid" || check.status === "unknownCountry"

  /**
   * Only two of the four states carry a number. Empty and invalid get `""`
   * rather than a cast — `canSubmit` is false in both, so nothing can send it,
   * and an honest empty string beats pretending a malformed number parsed.
   */
  const e164 = usable ? check.e164 : ""

  const values: HeirFormValues = {
    name: name.trim(),
    relation,
    phone: e164,
    mode,
  }

  const dirty =
    values.name !== initial.name.trim() ||
    values.relation !== initial.relation ||
    values.phone !== initial.phone ||
    values.mode !== initial.mode

  return {
    name,
    setName,
    relation,
    setRelation,
    phone,
    setPhone,
    mode,
    setMode,
    country,
    check,
    duplicate,
    values,
    dirty,
    canSubmit:
      values.name.length > 0 && relation.length > 0 && usable && !duplicate,
  }
}
