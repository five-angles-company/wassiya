/**
 * When does a guardian actually protect anything?
 *
 * Not when they accept. `K_rec = S_paper ⊕ S_guardian` can only be rebuilt once
 * the owner's device has sealed a share to the guardian's published public key,
 * so an accepted invitation with no sealed share is a guardian who cannot help
 * recover anything. Counting the printed sheet as recovery while that share is
 * missing reports a recovery path that does not exist — the worst kind of wrong,
 * because the owner believes they are safe.
 *
 * This lives in its own file because two screens need the answer and
 * `use-protection-score.ts` says why that matters: *"If the two computed it
 * separately they would eventually disagree about how safe the vault is, which
 * is the one thing a security summary may never do."* A shared predicate is how
 * that stays true once the plan tab needs it as well.
 */

/** `undefined` while either query is still loading. */
export function isGuardianLive(
  guardians: readonly { status: string }[] | undefined,
  keyring: { hasGuardianShare?: boolean } | null | undefined
): boolean | undefined {
  if (guardians === undefined || keyring === undefined) return undefined
  return (
    guardians.some((g) => g.status === "accepted") &&
    keyring?.hasGuardianShare === true
  )
}
