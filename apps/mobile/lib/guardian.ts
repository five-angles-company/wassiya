/**
 * When does a guardian actually protect anything?
 *
 * **Not for recovery — a guardian no longer protects that at all.** `K_rec =
 * S_paper`: the printed sheet alone rebuilds the vault, and an owner with no
 * guardian recovers exactly as well as one with three. What a guardian protects
 * is *delivery*: `K_h = S_server_h ⊕ S_guardian_h`, so without one, a released
 * claim hands an heir a box they cannot open.
 *
 * The bar is still not "they accepted". The half that matters is the X25519
 * public key they publish on acceptance, because that is what an heir bundle
 * gets sealed to. An accepted row with no key is a guardian who can help with
 * nothing — and reporting them as protection describes a delivery path that
 * does not exist, which is the worst kind of wrong: the owner believes they are
 * safe.
 *
 * (Before this change the rule read the owner's *keyring* for a sealed recovery
 * share. That share is gone, so the keyring no longer has an opinion here.)
 *
 * This lives in its own file because the answer must never be computed twice.
 * `use-protection-score.ts` says why: *"If the two computed it separately they
 * would eventually disagree about how safe the vault is, which is the one thing
 * a security summary may never do."* `packages/backend/convex/admin.ts` holds
 * the console's copy of the same rule — the two must move together.
 */

/** `undefined` while the query is still loading. */
export function isGuardianLive(
  guardians:
    | readonly { status: string; hasPublicKey?: boolean }[]
    | undefined
): boolean | undefined {
  if (guardians === undefined) return undefined
  return guardians.some((g) => g.status === "accepted" && g.hasPublicKey === true)
}

/**
 * An invitation is out and nobody has taken it up yet.
 *
 * Distinguished from "no guardian" because the owner cannot currently clear it:
 * accepting happens in the web app, which has not shipped. A vault in this
 * state is waiting on someone else, and the UI must say *waiting* rather than
 * accuse the owner of an unfinished step they have no way to finish.
 */
export function isGuardianPending(
  guardians: readonly { status: string }[] | undefined
): boolean | undefined {
  if (guardians === undefined) return undefined
  return (
    guardians.some((g) => g.status === "invited") &&
    !guardians.some((g) => g.status === "accepted")
  )
}
