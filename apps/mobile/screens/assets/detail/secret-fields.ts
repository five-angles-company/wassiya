/**
 * A revealed secret, as labelled fields rather than the JSON it is stored as.
 *
 * ## The bug this fixes
 *
 * Every wizard except the seed-phrase path stores a structured payload —
 * `JSON.stringify({ service, username, password, … })` — and the detail screen
 * printed `state.text` straight into a `<Text>`. Unlocking an account showed
 * the owner a raw object, braces and quotes and all. The block even carried a
 * comment reasoning about "a bank account's JSON", so the shape was known and
 * rendered anyway.
 *
 * ## Why parsing lives here and not in the component
 *
 * The payload shapes are the wizards' contract, and a wizard changing one is a
 * migration question. Keeping the mapping in one plain module means the fields
 * are readable next to the writers, and testable without mounting anything.
 *
 * ## What is deliberately *not* here
 *
 * No masking. This whole surface sits behind a fresh biometric and a
 * screenshot guard, and hides itself after ten seconds. Re-masking a value the
 * owner has just proven their identity to see would be theatre — and would
 * make the one screen where they need to *read* a password the one place it is
 * hardest to.
 */
import type { AssetType } from "@/lib/asset-types"

export type SecretField = {
  label: string
  value: string
  /**
   * Latin, fixed-width, and isolated: IBANs, addresses, passwords and 2FA
   * secrets are transcribed character by character, and Arabic-Indic digit
   * shaping or a bidi reorder in the middle of one is how a family locks
   * itself out of an account.
   */
  mono?: boolean
}

/** Copy for every field label, supplied by the screen's dictionary. */
export type SecretLabels = Record<string, string>

/**
 * A phrase is stored as the phrase, not as JSON — the one payload that is
 * already what it looks like. Callers render it as word pills instead.
 */
export function isPhrasePayload(type: AssetType, raw: string): boolean {
  return type === "crypto" && !raw.trimStart().startsWith("{")
}

/**
 * Parse a stored payload into ordered, labelled fields.
 *
 * Returns `null` when the payload is not the JSON this type is supposed to
 * write — a rotated format, a hand-edited row, a future version. The caller
 * falls back to showing the raw text, which is ugly but honest: refusing to
 * display a secret the owner has just authenticated for would be worse than
 * displaying it plainly.
 */
export function parseSecret(
  type: AssetType,
  raw: string,
  t: SecretLabels
): SecretField[] | null {
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(raw)
    if (typeof parsed !== "object" || parsed === null) return null
    data = parsed as Record<string, unknown>
  } catch {
    return null
  }

  const str = (key: string): string =>
    typeof data[key] === "string" ? (data[key] as string) : ""
  const list = (key: string): string[] =>
    Array.isArray(data[key])
      ? (data[key] as unknown[]).filter(
          (v): v is string => typeof v === "string"
        )
      : []

  // Every row is dropped when empty, so an optional field the owner skipped
  // does not leave a labelled blank behind.
  const rows: SecretField[] = []
  const push = (label: string, value: string, mono = false) => {
    if (value.trim().length > 0) rows.push({ label, value, mono })
  }

  switch (type) {
    case "digital":
      push(t.fieldService!, str("service"))
      push(t.fieldUsername!, str("username"), true)
      push(t.fieldPassword!, str("password"), true)
      push(t.fieldTwoFactor!, str("twoFactor"), true)
      push(t.fieldRecoveryCodes!, list("recoveryCodes").join("\n"), true)
      push(t.fieldDisposition!, str("disposition"))
      break

    case "bank":
      push(t.fieldBank!, str("bank"))
      push(t.fieldIban!, str("iban"), true)
      push(t.fieldAccountType!, str("accountType"))
      push(t.fieldBranch!, str("branch"))
      push(t.fieldCurrency!, str("currency"), true)
      push(t.fieldInstructions!, str("instructions"))
      break

    // The exchange variant. A wallet held on an exchange has no phrase — the
    // account *is* the custody — so it stores credentials like an account does.
    case "crypto":
      push(t.fieldNetwork!, str("network"))
      push(t.fieldAccount!, str("account"), true)
      push(t.fieldPassword!, str("password"), true)
      push(t.fieldTwoFactor!, str("twoFactor"), true)
      break

    case "note":
      push(t.fieldBody!, str("body"))
      break

    default:
      return null
  }

  return rows.length > 0 ? rows : null
}
