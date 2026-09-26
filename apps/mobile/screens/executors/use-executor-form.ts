import { useMemo, useState } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"

import { checkPhone } from "@/lib/phone"

/**
 * The fields an executor is, and the rules that decide whether they can be
 * saved. Shared by ٥.٢ (add) and ٥.٢b (edit), because an edit form *is* the add
 * form with values already in it.
 */
export type ExecutorFormValues = {
  name: string
  phone: string
  /** "" means none. */
  email: string
  /** Typed this session; "" means none given. Never read back from the server. */
  idNumber: string
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export type ExecutorForm = ReturnType<typeof useExecutorForm>

export function useExecutorForm(
  initial: ExecutorFormValues,
  options: {
    /**
     * The executor being edited, excluded from the duplicate check — without it
     * their own number would flag them as a duplicate of themselves.
     */
    selfId?: Id<"executors">
    /**
     * An ID number is required to add an executor. On an edit one is already
     * registered, so an empty field keeps it.
     */
    idNumberRequired: boolean
  }
) {
  const me = useQuery(api.users.me)
  const existing = useQuery(api.executors.list)

  const [name, setName] = useState(initial.name)
  const [phone, setPhone] = useState(initial.phone)
  const [email, setEmail] = useState(initial.email)
  const [idNumber, setIdNumber] = useState(initial.idNumber)

  const emailValue = email.trim().toLowerCase()
  const emailInvalid = emailValue.length > 0 && !EMAIL.test(emailValue)
  const idDigits = idNumber.replace(/[^0-9A-Za-z]/g, "")
  const idInvalid = idDigits.length > 0 && idDigits.length < 4
  const idMissing = options.idNumberRequired && idDigits.length === 0

  // The owner's own country decides the number format — an executor is almost
  // always in the same country, and ٥.٢ shows one dial code, not a picker.
  const country = me?.country ?? "SA"
  const check = checkPhone(phone, country)

  const duplicate = useMemo(() => {
    if (check.status !== "valid" || existing === undefined) return false
    return existing.some(
      (executor) =>
        executor.phone === check.e164 && executor.id !== options.selfId
    )
  }, [check, existing, options.selfId])

  const usable = check.status === "valid" || check.status === "unknownCountry"
  const e164 = usable ? check.e164 : ""

  const values: ExecutorFormValues = {
    name: name.trim(),
    phone: e164,
    email: emailValue,
    idNumber: idDigits,
  }

  const dirty =
    values.name !== initial.name.trim() ||
    values.phone !== initial.phone ||
    values.email !== initial.email ||
    values.idNumber !== ""

  return {
    name,
    setName,
    phone,
    setPhone,
    email,
    setEmail,
    emailInvalid,
    idNumber,
    setIdNumber,
    idInvalid,
    country,
    check,
    duplicate,
    values,
    dirty,
    canSubmit:
      values.name.length > 0 &&
      usable &&
      !duplicate &&
      !emailInvalid &&
      !idInvalid &&
      !idMissing,
  }
}
