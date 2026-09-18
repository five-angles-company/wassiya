/**
 * The human-readable name of an asset — sealed, because the server must not be
 * able to read it.
 *
 * Section ١ promises "حتى نحن لا نستطيع قراءة بياناتك" ("not even
 * we can read your data"), and an asset list of `محفظة Ledger الرئيسية` /
 * `iCloud · fatima@icloud.com` sitting in plaintext columns would make that
 * claim false. Titles and subtitles are the most descriptive thing a vault
 * holds after the content itself: a masked IBAN, an exchange name, the phrase
 * "تعليمات: سلّمه لسارة". They belong on the encrypted side of the line.
 *
 * ## Sealed under the DEK, deliberately not under MK
 *
 * The obvious choice is MK — one key, already in memory, no extra unwrap. It is
 * the wrong one. Heirs never receive MK; a release bundle carries
 * `Enc(K_h, routed DEKs + message keys)`, so a label wrapped by MK would reach
 * an heir as content they hold the key to and cannot name. Under the DEK the
 * label travels with the asset to whoever legitimately holds it — the owner
 * today, the heir after release — and costs one extra `unwrap` per row, which
 * is noise next to the network round trip that fetched it.
 *
 * ## Domain separation instead of a version header
 *
 * {@link LABEL_AAD} is authenticated but not encrypted, and encodes the format
 * version. A label ciphertext therefore cannot be opened as an asset content
 * chunk (whose AAD is its stream header) or as anything else this package
 * seals, and a future v2 label fails its tag rather than parsing as v1 — loud,
 * which is the only failure mode `open` offers and the one worth having.
 */
import { bytesToUtf8, utf8ToBytes } from "./bytes"
import { open, seal } from "./wrap"

/** Domain tag and format version, authenticated with every sealed label. */
export const LABEL_AAD = utf8ToBytes("wassiya/asset-label/v1")

/**
 * What a row on 4.1 renders. Both halves are sealed, including the ones that
 * *could* be derived from the plaintext `meta` column — "PDF · ٢٫٤ م.ب" is
 * harmless, "SA44 •••• •••• 8901 2345" is not, and a single rule that always
 * encrypts is the one a future screen cannot get wrong by picking the other
 * branch.
 */
export type AssetLabel = {
  /** The name the owner typed — "محفظة Ledger الرئيسية". */
  title: string
  /** The at-a-glance line under it, when the type has one. */
  subtitle?: string
}

/** Guards against a caller sealing a whole document body as a "label". */
const MAX_LABEL_BYTES = 4096

export function sealLabel(label: AssetLabel, dek: Uint8Array): Uint8Array {
  if (label.title.length === 0) {
    throw new Error("An asset label needs a title")
  }
  // `subtitle: undefined` is dropped by JSON.stringify, so an absent subtitle
  // and an omitted one serialise identically and round-trip to `undefined`.
  const plaintext = utf8ToBytes(
    JSON.stringify({ title: label.title, subtitle: label.subtitle })
  )
  if (plaintext.length > MAX_LABEL_BYTES) {
    throw new Error(
      `An asset label may not exceed ${MAX_LABEL_BYTES} bytes; ` +
        "content belongs in the asset body, not its name"
    )
  }
  return seal(dek, plaintext, LABEL_AAD)
}

/**
 * Reverse of {@link sealLabel}. Throws on a wrong DEK or a tampered envelope —
 * `open` cannot distinguish the two, and neither should a caller.
 */
export function openLabel(sealed: Uint8Array, dek: Uint8Array): AssetLabel {
  const parsed: unknown = JSON.parse(bytesToUtf8(open(sealed, dek, LABEL_AAD)))
  // The tag has already verified, so anything malformed here was written by
  // this app under the right key — a bug in a past version, not an attack.
  // Still checked, because a screen rendering `undefined` as a title is worse
  // than one showing an error.
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as AssetLabel).title !== "string"
  ) {
    throw new Error("Decrypted label is not a well-formed AssetLabel")
  }
  const { title, subtitle } = parsed as AssetLabel
  return typeof subtitle === "string" ? { title, subtitle } : { title }
}
