/**
 * The escrow lock: a routed item's key sealed to Wassiya's escrow key.
 *
 * Rules this file encodes — see AGENTS.md "Escrowed release":
 *  - The owner's phone seals with the **public** half, which is pinned in the
 *    app and never fetched. A key served by the backend would let a compromised
 *    server substitute its own and receive every routed key.
 *  - Every seal is bound to its owner and its item, so a sealed key copied onto
 *    another row, another owner or another heir's message fails to open rather
 *    than opening the wrong thing.
 *  - Only routed items are ever sealed. Everything else dies with the owner.
 */
import { hexToBytes, utf8ToBytes } from "./bytes"
import { SEAL_KEY_BYTES, openSealedKey, sealKeyTo } from "./seal"

/** What a sealed key belongs to. `|` never occurs in a Convex id. */
export type EscrowSubject =
  | { ownerId: string; assetId: string }
  | { ownerId: string; messageForHeirId: string }

export function escrowAad(subject: EscrowSubject): Uint8Array {
  const item =
    "assetId" in subject
      ? `asset|${subject.assetId}`
      : `message|${subject.messageForHeirId}`
  return utf8ToBytes(`wassiya/escrow/v1|${subject.ownerId}|${item}`)
}

/** Parse a hex-encoded escrow key (public or secret), refusing anything else. */
export function parseEscrowKey(hex: string): Uint8Array {
  const key = hexToBytes(hex.trim())
  if (key.length !== SEAL_KEY_BYTES) {
    throw new Error(`An escrow key is ${SEAL_KEY_BYTES} bytes`)
  }
  return key
}

/** Runs on the owner's device when an item is routed. */
export function sealForEscrow(
  key: Uint8Array,
  escrowPublicKey: Uint8Array,
  subject: EscrowSubject
): Uint8Array {
  return sealKeyTo(key, escrowPublicKey, escrowAad(subject))
}

/** Runs in the one release gate, `convex/escrow.ts`, and nowhere else. */
export function openFromEscrow(
  sealed: Uint8Array,
  escrowSecretKey: Uint8Array,
  subject: EscrowSubject
): Uint8Array {
  return openSealedKey(sealed, escrowSecretKey, escrowAad(subject))
}
