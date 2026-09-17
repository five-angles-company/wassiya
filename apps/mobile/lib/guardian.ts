/**
 * When a guardian actually protects something — and it is never recovery.
 * `K_rec = S_paper`, so the sheet alone rebuilds the vault. A guardian protects
 * *delivery*: `K_h = S_server_h ⊕ S_guardian_h`, so without one a released claim
 * hands an heir a box they cannot open.
 *
 * The bar is not "they accepted" but the X25519 public key published on
 * acceptance, because that is what an heir bundle is sealed to. An accepted row
 * with no key describes a delivery path that does not exist, and the owner
 * believes they are safe.
 *
 * This lives in its own file because the answer must never be computed twice —
 * see `use-protection-score.ts`. `packages/backend/convex/admin.ts` holds the
 * console's copy of the same rule; the two must move together.
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
