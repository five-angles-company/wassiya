/**
 * The crypto-wallet secret in both directions. Two shapes, one form:
 * - `{kind: "exchange", network, account, password, twoFactor}` — no phrase;
 *   the account *is* the custody.
 * - `{kind, network, phrase, devicePassword?, deviceLocation?}` — a wallet.
 */
import { checkMnemonic } from "@workspace/crypto/mnemonic"

import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"

export const NETWORKS = ["Bitcoin", "Ethereum", "Solana", "Tron", "BNB", "Other"]

export type CryptoForm = {
  /** Lives in the sealed label, not the secret. */
  name: string
  network: string
  /** `hardware` · `software` · `exchange`. */
  kind: string
  /** The phrase branch. */
  phrase: string
  /**
   * A hardware wallet's PIN, and where the device physically is.
   *
   * The asset screen carries both, and it is right to: a seed phrase
   * recovers a wallet, but an heir who finds the Ledger in a drawer and knows
   * its PIN never has to type twelve words at all. ٤.٣ does not collect them,
   * so absent and empty are the same thing here.
   */
  devicePassword: string
  deviceLocation: string
  /** The exchange branch. */
  account: string
  password: string
  twoFactor: string
}

export function parseCrypto({ secret, title }: EditSource): CryptoForm | null {
  let data: Record<string, unknown>
  try {
    const parsed: unknown = JSON.parse(secret)
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return null
    }
    data = parsed as Record<string, unknown>
  } catch {
    return null
  }

  const str = (key: string): string =>
    typeof data[key] === "string" ? (data[key] as string) : ""

  return {
    name: title,
    network: str("network"),
    kind: str("kind"),
    phrase: str("phrase"),
    devicePassword: str("devicePassword"),
    deviceLocation: str("deviceLocation"),
    account: str("account"),
    password: str("password"),
    twoFactor: str("twoFactor"),
  }
}

export function isExchange(form: CryptoForm): boolean {
  return form.kind === "exchange"
}

/**
 * @param labels the `assets/new/crypto` dictionary, so an edited wallet reads
 *   exactly like a created one
 */
export function toCryptoPayload(
  form: CryptoForm,
  labels: Record<string, string>,
  formatCount: (n: number) => string,
  wordUnit: string
): EditPayload {
  const title = form.name.trim()

  if (isExchange(form)) {
    return {
      label: {
        title,
        subtitle: `${labels.kindExchange} · ${form.network}`,
      },
      secret: JSON.stringify({
        kind: form.kind,
        network: form.network,
        account: form.account.trim(),
        password: form.password,
        twoFactor: form.twoFactor.trim(),
      }),
      meta: {},
    }
  }

  // The canonical single-spaced phrase, not what was typed — the checksum was
  // verified against exactly these words.
  const words = checkMnemonic(form.phrase).words
  return {
    label: {
      title,
      subtitle: `${labels.secretLabel} · ${form.network} · ${formatCount(words.length)} ${wordUnit}`,
    },
    secret: JSON.stringify({
      kind: form.kind,
      network: form.network,
      phrase: words.join(" "),
      devicePassword: form.devicePassword,
      deviceLocation: form.deviceLocation.trim(),
    }),
    meta: { itemCount: words.length },
  }
}

/**
 * The wizard's own gate, repeated where the write happens.
 *
 * An invalid phrase reaching storage is unrecoverable, and here it would also
 * be overwriting a valid one — so this is stricter than a create, not laxer.
 */
export function isCryptoValid(form: CryptoForm): boolean {
  if (form.name.trim().length === 0) return false
  if (isExchange(form)) {
    return form.account.trim().length > 0 && form.password.length > 0
  }
  return checkMnemonic(form.phrase).status === "valid"
}
