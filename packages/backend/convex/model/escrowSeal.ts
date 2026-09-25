// The check every escrowed key passes on its way in. This deployment cannot
// open what it is handed here — only `escrow.openDelivery` reads the secret —
// so it refuses what cannot be a seal to the current key, and nothing more.

/** ephPub(32) ‖ nonce(24) ‖ key(32) ‖ tag(16) — `SEALED_KEY_BYTES` in `@workspace/crypto/seal`. */
const SEALED_KEY_BYTES = 104

/**
 * The escrow key this deployment opens with. A development key id is refused on
 * production, so a development shortcut can never silently ship.
 */
export function currentEscrowKeyId(): string {
  const id = process.env.ESCROW_KEY_ID
  if (id === undefined) {
    throw new Error("ESCROW_KEY_ID is not set on this deployment")
  }
  if (process.env.WASSIYA_ENV === "production" && id.startsWith("dev")) {
    throw new Error("A development escrow key is refused in production")
  }
  return id
}

/**
 * `escrowKeyId` must be the current key: a client still pinned to a retired
 * key would otherwise escrow keys nobody can open.
 */
export function assertEscrowSeal(sealed: ArrayBuffer, escrowKeyId: string): void {
  if (escrowKeyId !== currentEscrowKeyId()) {
    throw new Error("Sealed with an escrow key this deployment does not use")
  }
  if (sealed.byteLength !== SEALED_KEY_BYTES) {
    throw new Error("Malformed escrowed key")
  }
}
