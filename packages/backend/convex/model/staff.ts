// Resolving and maintaining staff authority.
//
// `users.staffPermissions` is the denormalised union of the permission keys of
// the roles in `users.staffRoleIds`. Every gate in the backend reads that one
// field, which is what makes a gated query depend on a single document and
// therefore re-run the instant that person's access changes.
//
// ⚠️ **The two writers must stay in step.** Anything that changes a role's
// permissions must call `recomputeHolders` in the same mutation, and anything
// that changes a person's roles must call `applyRoles`. A missed fan-out is
// invisible: the console keeps working with rights that were taken away, until
// some unrelated write happens to touch that user row. `verify-invariants.mjs`
// fails the build on a `staffRoles` writer that does not recompute.
import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { writeStaffAudit } from "../audit"
import { ALL_PERMISSIONS, isPermissionKey } from "./permissions"

/**
 * How many holders one role may have before the fan-out is a problem.
 *
 * Staff are tens of people, not thousands. The cap exists so a mistake cannot
 * turn a role edit into an unbounded transaction; crossing it is a bug worth
 * shouting about rather than a limit worth paging through.
 */
const MAX_ROLE_HOLDERS = 200

/** The union of a role set's keys. Unknown keys are dropped, never stored. */
export function unionOf(roles: Doc<"staffRoles">[]): string[] {
  if (roles.some((role) => role.permissions.includes(ALL_PERMISSIONS))) {
    return [ALL_PERMISSIONS]
  }
  const keys = new Set<string>()
  for (const role of roles) {
    for (const key of role.permissions) {
      if (isPermissionKey(key)) keys.add(key)
    }
  }
  return [...keys].sort()
}

/** Reads a role set, skipping ids whose role has since been deleted. */
export async function rolesOf(
  ctx: QueryCtx,
  roleIds: Id<"staffRoles">[] | undefined
): Promise<Doc<"staffRoles">[]> {
  if (roleIds === undefined || roleIds.length === 0) return []
  const rows = await Promise.all(
    roleIds.map((id) => ctx.db.get("staffRoles", id))
  )
  return rows.filter((row): row is Doc<"staffRoles"> => row !== null)
}

/**
 * Give a user exactly this role set, and recompute what it lets them do.
 *
 * An empty set is not "no change" — it is a staff member with no authority,
 * which the console renders as the refusal screen. Removing the last role is
 * how someone is taken off staff without deleting their account, so
 * `role: "admin"` is cleared with it: the column says *what kind of account
 * this is*, and an account with no staff authority is a customer row again.
 */
export async function applyRoles(
  ctx: MutationCtx,
  user: Doc<"users">,
  roleIds: Id<"staffRoles">[]
): Promise<string[]> {
  const roles = await rolesOf(ctx, roleIds)
  const permissions = unionOf(roles)
  const isStaff = roles.length > 0

  await ctx.db.patch("users", user._id, {
    role: isStaff ? "admin" : "owner",
    staffRoleIds: roles.map((role) => role._id),
    staffPermissions: permissions,
    staffSince: isStaff ? (user.staffSince ?? Date.now()) : undefined,
  })
  return permissions
}

/**
 * Recompute every holder of a role, after its permissions changed.
 *
 * Driven off `by_role` rather than a scan: staff are a handful of rows in a
 * table of customers, and this runs inside the mutation that edited the role.
 */
export async function recomputeHolders(
  ctx: MutationCtx,
  roleId: Id<"staffRoles">
): Promise<number> {
  const staff = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .take(MAX_ROLE_HOLDERS + 1)

  if (staff.length > MAX_ROLE_HOLDERS) {
    // Not thrown: refusing the edit would leave the role and its holders
    // disagreeing, which is the state this whole module exists to prevent.
    console.error(
      `staff: more than ${MAX_ROLE_HOLDERS} staff accounts; role fan-out is truncated and permissions may be stale`
    )
  }

  let touched = 0
  for (const user of staff) {
    if (!(user.staffRoleIds ?? []).includes(roleId)) continue
    const roles = await rolesOf(ctx, user.staffRoleIds)
    await ctx.db.patch("users", user._id, {
      staffPermissions: unionOf(roles),
      staffRoleIds: roles.map((role) => role._id),
    })
    touched += 1
  }
  return touched
}

/** Everyone who currently holds a given role. Used by the delete guard. */
export async function holdersOf(
  ctx: QueryCtx,
  roleId: Id<"staffRoles">
): Promise<Doc<"users">[]> {
  const staff = await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .take(MAX_ROLE_HOLDERS)
  return staff.filter((user) => (user.staffRoleIds ?? []).includes(roleId))
}

/** Every staff account, newest first is not useful here — insertion order is. */
export async function staffAccounts(ctx: QueryCtx): Promise<Doc<"users">[]> {
  return await ctx.db
    .query("users")
    .withIndex("by_role", (q) => q.eq("role", "admin"))
    .take(MAX_ROLE_HOLDERS)
}

/** The address an invitation is matched on. Both sides normalise identically. */
export function normaliseEmail(email: string): string {
  return email.trim().toLowerCase()
}

/** The live invitation for an address, if there is one that has not lapsed. */
export async function pendingInvitationFor(
  ctx: QueryCtx,
  email: string
): Promise<Doc<"staffInvitations"> | null> {
  const rows = await ctx.db
    .query("staffInvitations")
    .withIndex("by_email_and_status", (q) =>
      q.eq("email", email).eq("status", "pending")
    )
    .collect()
  return rows.find((row) => row.expiresAt > Date.now()) ?? null
}

/**
 * Bind a pending invitation to an account, making them staff.
 *
 * ⚠️ **Only ever called with an address Clerk has verified.** The webhook path
 * checks `verification.status` before calling this, and `staff.claimInvitation`
 * trusts `users.email` only because the webhook is what wrote it. Without that
 * check, signing up as `owner@wassiya.sa` without ever proving it would inherit
 * whatever that address was invited to — an account-takeover primitive with a
 * friendly name.
 *
 * It lives here rather than in `staff.ts` so `users.upsertFromClerk` can reach
 * it without importing the module that also imports `users`.
 */
export async function bindInvitation(
  ctx: MutationCtx,
  user: Doc<"users">
): Promise<{ bound: boolean }> {
  if (user.email === null) return { bound: false }
  const invitation = await pendingInvitationFor(ctx, normaliseEmail(user.email))
  if (invitation === null) return { bound: false }

  const roles = await rolesOf(ctx, invitation.roleIds)
  if (roles.length === 0) return { bound: false }

  await applyRoles(
    ctx,
    user,
    roles.map((role) => role._id)
  )
  await ctx.db.patch("staffInvitations", invitation._id, {
    status: "accepted",
    acceptedUserId: user._id,
    acceptedAt: Date.now(),
  })
  // The actor is the person accepting: nobody else is in the room, and the
  // invitation row records who sent it.
  await writeStaffAudit(ctx, {
    actor: user,
    subject: user._id,
    event: "staff.invitation_accepted",
    meta: { roles: roles.length },
  })
  return { bound: true }
}
