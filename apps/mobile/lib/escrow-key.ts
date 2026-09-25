/**
 * The escrow public key a routed item's key is sealed to — AGENTS.md
 * "Escrowed release".
 *
 * ⚠️ Pinned here, never fetched. A key served by the backend would let a
 * compromised server substitute its own and receive every routed key.
 *
 * `id` must equal `ESCROW_KEY_ID` on the matching Convex deployment, which the
 * backend enforces on every write. Production stays `null` until its key is
 * generated: with no pinned key, routing refuses to save rather than seal to
 * the development key.
 */
import type { EscrowSubject } from "@workspace/crypto/escrow"
import { parseEscrowKey, sealForEscrow } from "@workspace/crypto/escrow"
import { unwrap } from "@workspace/crypto/wrap"

import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { useVault } from "@/stores/vault"

export type PinnedEscrowKey = { id: string; publicKey: string }

const DEVELOPMENT: PinnedEscrowKey = {
  id: "dev-2",
  publicKey: "ba23dd0cfe52b1ba088ac19926e39cc6edbbe8c495ec215142a6f749eb31320d",
}

const PRODUCTION: PinnedEscrowKey | null = null

export function pinnedEscrowKey(): PinnedEscrowKey | null {
  return process.env.EXPO_PUBLIC_WASSIYA_ENV === "production"
    ? PRODUCTION
    : DEVELOPMENT
}

/**
 * Seal a key the vault holds wrapped by MK — an asset's DEK or a message key —
 * to the pinned escrow key, bound to what it belongs to. The unwrapped key is
 * zeroed before this returns.
 */
export function sealForRelease(
  keyWrappedByMk: ArrayBuffer,
  subject: EscrowSubject
): { sealed: ArrayBuffer; escrowKeyId: string } {
  const mk = useVault.getState().mk
  if (mk === null) throw new Error("The vault is locked")
  const pinned = pinnedEscrowKey()
  if (pinned === null) throw new Error("No escrow key is pinned for this build")

  ensureWebCrypto()
  const key = unwrap(new Uint8Array(keyWrappedByMk), mk)
  try {
    const sealed = sealForEscrow(key, parseEscrowKey(pinned.publicKey), subject)
    return { sealed: new Uint8Array(sealed).buffer, escrowKeyId: pinned.id }
  } finally {
    key.fill(0)
  }
}
