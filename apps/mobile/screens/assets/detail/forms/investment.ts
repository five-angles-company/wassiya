/** An investment's payload, both directions: `{kind, provider, accountNumber, username, password, instructions}`. */
import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"
import { maskTail, readSecretObject, readString } from "@/screens/assets/detail/forms/secret-json"

export const INVESTMENT_KINDS = ["stocks", "fund", "other"] as const

export type InvestmentForm = {
  kind: string
  provider: string
  accountNumber: string
  username: string
  password: string
  instructions: string
}

export const EMPTY_INVESTMENT: InvestmentForm = {
  kind: "",
  provider: "",
  accountNumber: "",
  username: "",
  password: "",
  instructions: "",
}

export function parseInvestment({ secret }: EditSource): InvestmentForm | null {
  const data = readSecretObject(secret, ["provider", "accountNumber"])
  if (data === null) return null
  return {
    kind: readString(data, "kind"),
    provider: readString(data, "provider"),
    accountNumber: readString(data, "accountNumber"),
    username: readString(data, "username"),
    password: readString(data, "password"),
    instructions: readString(data, "instructions"),
  }
}

export function investmentKindLabel(kind: string, t: Record<string, string>): string {
  return { stocks: t.kindStocks, fund: t.kindFund, other: t.kindOther }[kind] ?? ""
}

export function toInvestmentPayload(
  form: InvestmentForm,
  t: Record<string, string>
): EditPayload {
  const account = form.accountNumber.trim()
  return {
    label: {
      title: form.provider.trim(),
      subtitle: [investmentKindLabel(form.kind, t), account.length > 0 ? maskTail(account) : ""]
        .filter((part) => part.length > 0)
        .join(" · "),
    },
    secret: JSON.stringify({
      kind: form.kind,
      provider: form.provider.trim(),
      accountNumber: account,
      username: form.username.trim(),
      password: form.password,
      instructions: form.instructions.trim(),
    }),
    meta: {},
  }
}

export function isInvestmentValid(form: InvestmentForm): boolean {
  return form.kind.length > 0 && form.provider.trim().length > 0
}
