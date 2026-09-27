/** An insurance policy's payload, both directions: `{kind, company, policyNumber, beneficiary, instructions}`. */
import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"
import { maskTail, readSecretObject, readString } from "@/screens/assets/detail/forms/secret-json"

export type InsuranceForm = {
  kind: string
  company: string
  policyNumber: string
  beneficiary: string
  instructions: string
}

export const EMPTY_INSURANCE: InsuranceForm = {
  kind: "",
  company: "",
  policyNumber: "",
  beneficiary: "",
  instructions: "",
}

export function parseInsurance({ secret }: EditSource): InsuranceForm | null {
  const data = readSecretObject(secret, ["company", "policyNumber"])
  if (data === null) return null
  return {
    kind: readString(data, "kind"),
    company: readString(data, "company"),
    policyNumber: readString(data, "policyNumber"),
    beneficiary: readString(data, "beneficiary"),
    instructions: readString(data, "instructions"),
  }
}

export function insuranceKindLabel(kind: string, t: Record<string, string>): string {
  return (
    { life: t.kindLife, health: t.kindHealth, property: t.kindProperty, other: t.kindOther }[
      kind
    ] ?? ""
  )
}

export function toInsurancePayload(form: InsuranceForm, t: Record<string, string>): EditPayload {
  const policy = form.policyNumber.trim()
  return {
    label: {
      title: form.company.trim(),
      subtitle: [insuranceKindLabel(form.kind, t), policy.length > 0 ? maskTail(policy) : ""]
        .filter((part) => part.length > 0)
        .join(" · "),
    },
    secret: JSON.stringify({
      kind: form.kind,
      company: form.company.trim(),
      policyNumber: policy,
      beneficiary: form.beneficiary.trim(),
      instructions: form.instructions.trim(),
    }),
    meta: {},
  }
}

export function isInsuranceValid(form: InsuranceForm): boolean {
  return form.kind.length > 0 && form.company.trim().length > 0
}
