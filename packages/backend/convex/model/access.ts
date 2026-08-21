// Authorisation helpers. Every one of them derives the caller from the Clerk
// JWT — nothing here accepts a user id as an argument, because a client-passed
// id is not evidence of anything.
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { getCurrentUserOrThrow } from "../users"

/** The signed-in owner. The starting point of almost every function here. */
export async function requireUser(ctx: QueryCtx): Promise<Doc<"users">> {
  return await getCurrentUserOrThrow(ctx)
}

/**
 * The claims-review role used by apps/admin. `role` is assigned out of band —
 * there is deliberately no mutation that grants it.
 */
export async function requireAdmin(ctx: QueryCtx): Promise<Doc<"users">> {
  const user = await getCurrentUserOrThrow(ctx)
  if (user.role !== "admin") {
    throw new Error("Not authorised")
  }
  return user
}

/**
 * The caller in their capacity as someone else's guardian. Returns the
 * `guardians` row that links them to `subjectUserId`.
 */
export async function requireAcceptedGuardian(
  ctx: QueryCtx,
  subjectUserId: Id<"users">
): Promise<Doc<"guardians">> {
  const guardian = await getCurrentUserOrThrow(ctx)
  const link = await ctx.db
    .query("guardians")
    .withIndex("by_guardianUserId_and_status", (q) =>
      q.eq("guardianUserId", guardian._id).eq("status", "accepted")
    )
    .take(50)
  const match = link.find((row) => row.userId === subjectUserId)
  if (match === undefined) {
    throw new Error("Not authorised")
  }
  return match
}

/**
 * The subscription-lapse rule, in the one place it is allowed to apply: adding
 * assets. Reading the vault and releasing to heirs must never call this — a
 * lapsed subscription is a billing problem, not a reason to lose an
 * inheritance.
 *
 * A user with no subscription row is a new or free-tier owner and may add;
 * only an explicitly expired `renewsAt` blocks.
 */
export function assertCanAddAssets(user: Doc<"users">, now: number): void {
  const renewsAt = user.subscription?.renewsAt
  if (renewsAt !== undefined && renewsAt < now) {
    throw new Error(
      "Subscription lapsed: adding assets is paused. Existing assets and heir delivery are unaffected."
    )
  }
}

/**
 * The owner-side half of "identity verification is mandatory and blocking".
 *
 * Called from `keyring.save` on the *first* write only. That is the real
 * chokepoint: no keyring means no MK wrapper, which means no assets, no heirs
 * worth routing to, and nothing to release — so gating vault creation gates
 * onboarding as a whole. Rotation is deliberately not gated: an owner whose
 * Didit record later lapses must still be able to replace a lost paper sheet.
 */
export function assertIdentityVerified(user: Doc<"users">): void {
  if (user.identityStatus !== "verified") {
    throw new Error("Identity verification required")
  }
}

export type { MutationCtx, QueryCtx }
