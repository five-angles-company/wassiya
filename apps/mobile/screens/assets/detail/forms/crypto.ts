/**
 * The crypto-wallet payload, in both directions — and the one format in this
 * app that cannot be round-tripped cleanly, because of how it was first
 * written.
 *
 * ## The legacy phrase, and why nothing here guesses
 *
 * ٤.٣'s phrase path stores `words.join(" ")` — the bare phrase, no JSON. The
 * **network** survives only inside the *localised* sealed subtitle, and the
 * **kind** (hardware vs software) is stored nowhere at all.
 *
 * The tempting fix is to show chips defaulted to Bitcoin/hardware. That is the
 * one thing this file must never do: an owner editing an unrelated field would
 * then save a subtitle claiming an Ethereum wallet is a Bitcoin one, and no
 * heir could catch it. So a legacy row loads with both **empty** — an honest
 * "not recorded" — and the owner may set them, which upgrades the payload to
 * JSON on the next save.
 *
 * The subtitle follows the same rule, in {@link toCryptoPayload}: it is carried
 * forward byte-for-byte while there is nothing better to say, and only rebuilt
 * from values that are actually known.
 *
 * ## Three shapes, one form
 *
 * - `{kind: "exchange", network, account, password, twoFactor}` — an exchange
 *   wallet has no phrase; the account *is* the custody.
 * - `{kind, network, phrase}` — what this file writes for a phrase wallet.
 * - a bare phrase — everything ٤.٣ has written so far.
 */
import { checkMnemonic } from "@workspace/crypto/mnemonic"

import type { EditPayload, EditSource } from "@/screens/assets/detail/forms/source"

export const NETWORKS = ["Bitcoin", "Ethereum", "Solana", "Tron", "BNB", "Other"]

/** `""` means "not recorded" — only reachable from a legacy bare phrase. */
export type CryptoForm = {
  /** Lives in the sealed label, not the payload. */
  name: string
  network: string
  /** `hardware` · `software` · `exchange`, or `""` when unknown. */
  kind: string
  /** The phrase branch. */
  phrase: string
  /**
   * A hardware wallet's PIN, and where the device physically is.
   *
   * The board's asset screen carries both, and it is right to: a seed phrase
   * recovers a wallet, but an heir who finds the Ledger in a drawer and knows
   * its PIN never has to type twelve words at all. ٤.٣ does not collect them
   * yet, so they are absent on everything saved so far — which the parser
   * handles, because absent and empty are the same thing here.
   */
  devicePassword: string
  deviceLocation: string
  /** The exchange branch. */
  account: string
  password: string
  twoFactor: string
}

export function parseCrypto({ secret, title }: EditSource): CryptoForm | null {
  const base = {
    name: title,
    network: "",
    kind: "",
    phrase: "",
    devicePassword: "",
    deviceLocation: "",
    account: "",
    password: "",
    twoFactor: "",
  }

  // A bare phrase — everything the wizard has written so far. `{` is the same
  // discriminator `isPhrasePayload` uses, so old and new rows agree on it.
  if (!secret.trimStart().startsWith("{")) {
    return { ...base, phrase: secret }
  }

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
    ...base,
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
 * @param source the opened asset, for the subtitle this may have to preserve
 * @param labels the `assets/new/crypto` dictionary, so an edited wallet reads
 *   exactly like a created one
 */
export function toCryptoPayload(
  form: CryptoForm,
  source: EditSource,
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
  const check = checkMnemonic(form.phrase)
  const words = check.words
  const phrase = words.join(" ")

  // Anything worth recording beyond the words themselves forces the JSON
  // shape. A bare phrase can only ever be a phrase, so a device PIN or a
  // location has nowhere to live until the payload upgrades.
  const extras =
    form.devicePassword.length > 0 || form.deviceLocation.length > 0
  const named = form.network.length > 0 && form.kind.length > 0
  const known = named || extras
  const unchanged = phrase === checkMnemonic(sourcePhrase(source)).words.join(" ")

  return {
    label: {
      title,
      // Only a *named* network may appear in the subtitle. Upgrading the
      // payload because someone recorded a PIN must not invent a network.
      subtitle: named
        ? `${labels.secretLabel} · ${form.network} · ${formatCount(words.length)} ${wordUnit}`
        : unchanged
          ? // Nothing better to say than what was already there. Rebuilding it
            // would drop the network token this row can no longer produce.
            source.subtitle
          : // The phrase changed, so the old word count is now a lie — but the
            // network is still unknown, and inventing one is worse than losing
            // it. State only what is true.
            `${labels.secretLabel} · ${formatCount(words.length)} ${wordUnit}`,
    },
    // Upgraded to JSON only once there is something to record. Writing
    // `{"phrase": …}` with both fields blank would change the stored format
    // while carrying no more information than the bare phrase it replaced.
    secret: known
      ? JSON.stringify({
          kind: form.kind,
          network: form.network,
          phrase,
          devicePassword: form.devicePassword,
          deviceLocation: form.deviceLocation.trim(),
        })
      : phrase,
    meta: { itemCount: words.length },
  }
}

/** The phrase as it was loaded, whichever of the two shapes it arrived in. */
function sourcePhrase(source: EditSource): string {
  if (!source.secret.trimStart().startsWith("{")) return source.secret
  try {
    const parsed: unknown = JSON.parse(source.secret)
    if (typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)) {
      const phrase = (parsed as Record<string, unknown>).phrase
      return typeof phrase === "string" ? phrase : ""
    }
  } catch {
    /* falls through */
  }
  return ""
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
