// Authorisation helpers. Every one of them derives the caller from the Clerk
// JWT — nothing here accepts a user id as an argument, because a client-passed
// id is not evidence of anything.
import type { Expression, FilterBuilder } from "convex/server"

import type { DataModel, Doc } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { getCurrentUserOrThrow } from "../users"
import { ALL_PERMISSIONS, type PermissionKey } from "./permissions"

/** The signed-in owner. The starting point of almost every function here. */
export async function requireUser(ctx: QueryCtx): Promise<Doc<"users">> {
  return await getCurrentUserOrThrow(ctx)
}

/**
 * The console's gate. Every staff-facing function calls this with the one key
 * it needs, and nothing here takes a blanket "is staff" shortcut — a generic
 * check is how a single all-powerful role grows back.
 *
 * Authority is `user.staffPermissions`, denormalised from the person's roles by
 * `model/staff.ts`, so this costs no read beyond the user document the caller
 * already needed. `"*"` is the system Owner role.
 *
 * The refusal names the missing key for a staff member, because it is not a
 * secret from a colleague and it turns a support ticket into a screenshot. A
 * caller who is not staff at all gets the bare message: no oracle about which
 * permissions exist.
 */
export async function requirePermission(
  ctx: QueryCtx,
  key: PermissionKey
): Promise<Doc<"users">> {
  const user = await getCurrentUserOrThrow(ctx)
  if (hasPermission(user, key)) return user
  if (isStaffAccount(user)) {
    throw new Error(`Not authorised (needs ${key})`)
  }
  throw new Error("Not authorised")
}

/**
 * The same question without the throw, for a function that is already gated
 * and wants to redact part of what it returns.
 */
export function hasPermission(user: Doc<"users">, key: PermissionKey): boolean {
  const held = user.staffPermissions ?? []
  return held.includes(ALL_PERMISSIONS) || held.includes(key)
}

/**
 * Whether this row is a staff account rather than a vault-owning customer.
 *
 * ⚠️ The **only** place `role` is compared, together with `excludeStaff` below.
 * The console's owner metrics exclude staff, and if that literal spreads, the
 * next reader cannot tell a metric filter from an authority check — which is
 * exactly the confusion RBAC is here to end. `verify-invariants.mjs` fails the
 * build on a comparison anywhere else.
 */
export function isStaffAccount(user: Doc<"users">): boolean {
  return user.role === "admin"
}

/**
 * The owner-metric filter: every count, funnel and list of *customers* drops
 * staff accounts, so dogfooding does not show up as signups.
 */
export function excludeStaff(
  q: FilterBuilder<DataModel["users"]>
): Expression<boolean> {
  return q.neq(q.field("role"), "admin")
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
