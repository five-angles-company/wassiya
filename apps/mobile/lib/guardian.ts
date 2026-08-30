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
 * Distinguished from "no guardian" because it is **not the owner's move**.
 * Accepting happens on the web, at `/guardian/accept`, where the invited person
 * mints their own key — and it has to, because a key minted on the owner's
 * phone would be a key the owner holds, which is the one thing a second party
 * to a 2-of-2 may never be.
 *
 * That used to read "the web app has not shipped". It has; the conclusion is
 * unchanged and now rests on the right reason. A vault in this state is waiting
 * on a person, so the UI says *waiting* rather than accusing the owner of an
 * unfinished step only somebody else can finish. What the owner can do — remind
 * them, or invite someone else — lives on `/protection/guardian`.
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
