// Who works in the console, and what each of them may do.
//
// This module deliberately reverses an earlier stance. `requireAdmin` used to
// note that the staff role was assigned out of band and that there was no
// mutation to grant it — a console that could promote its own users would put
// every control one step from whoever got in. What replaces that reasoning is
// not trust, it is structure:
//
// - **Permission keys are code** (`model/permissions.ts`). The console decides
//   who holds a key, never what keys exist.
// - **Granting needs `staff.manage`**, which only the Owner role holds, and
//   every grant is audited with its actor.
// - **Nobody can raise themselves.** You cannot edit your own roles, you cannot
//   grant a key you do not hold, the Owner role cannot be edited or deleted,
//   and the last Owner cannot be removed. The way back from a mistake is the
//   CLI (`bootstrapOwner`), not a support ticket.
//
// ⚠️ Every mutation that touches `staffRoles` must recompute its holders in the
// same transaction — see `model/staff.ts`.
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import {
  internalMutation,
  mutation,
  query,
  type QueryCtx,
} from "./_generated/server"
import { writeStaffAudit } from "./audit"
import { sendStaffInvite } from "./email"
import { requirePermission } from "./model/access"
import {
  ALL_PERMISSIONS,
  isPermissionKey,
  OWNER_ROLE_KEY,
  PERMISSIONS,
  SEEDED_ROLES,
  type PermissionKey,
} from "./model/permissions"
import {
  applyRoles,
  bindInvitation,
  holdersOf,
  normaliseEmail,
  pendingInvitationFor,
  recomputeHolders,
  rolesOf,
  staffAccounts,
  unionOf,
} from "./model/staff"
import { settingsFor } from "./model/settings"
import { getCurrentUser } from "./users"

/** Fourteen days. Long enough for a holiday, short enough to be a decision. */
const INVITE_TTL_MS = 14 * 24 * 60 * 60 * 1000

// ── Reads ───────────────────────────────────────────────────────────────────

/**
 * The console's own view of the caller.
 *
 * Separate from `users.me` on purpose: that query is subscribed by every
 * owner's phone, and a staff permission list has no business on it.
 *
 * `null` for a signed-out caller; an empty `permissions` for a signed-in one
 * who is not staff, which is what the console renders as the refusal screen.
 */
export const me = query({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (user === null) return null

    const roles = await rolesOf(ctx, user.staffRoleIds)
    const permissions = user.staffPermissions ?? []
    return {
      userId: user._id,
      name: user.name,
      email: user.email,
      permissions,
      isOwner: permissions.includes(ALL_PERMISSIONS),
      roles: roles.map((role) => ({
        id: role._id,
        key: role.key ?? null,
        name: role.name,
      })),
      /**
       * An invitation is waiting for this signed-in account.
       *
       * The webhook binds an invitation when Clerk tells us about the account,
       * but someone invited *after* they already signed up produces no webhook
       * at all — this is what lets the console finish the job on their next
       * visit, via `claimInvitation`.
       */
      pendingInvitation: await hasPendingInvitation(ctx, user),
    }
  },
})

/** Everyone who can get into the console, with the roles they hold. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "staff.read")
    const accounts = await staffAccounts(ctx)
    const roles = await ctx.db.query("staffRoles").collect()
    const byId = new Map(roles.map((role) => [role._id, role]))

    return accounts.map((user) => ({
      id: user._id,
      name: user.name,
      email: user.email,
      joinedAt: user._creationTime,
      staffSince: user.staffSince ?? null,
      isOwner: (user.staffPermissions ?? []).includes(ALL_PERMISSIONS),
      roles: (user.staffRoleIds ?? []).flatMap((id) => {
        const role = byId.get(id)
        return role === undefined ? [] : [{ id: role._id, name: role.name }]
      }),
      // A staff account holding no role reaches the refusal screen like anyone
      // else. Surfaced so that state is visible here rather than discovered by
      // the person it happened to.
      needsRoles: (user.staffRoleIds ?? []).length === 0,
    }))
  },
})

/** The roles themselves, with how many people hold each. */
export const roles = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "staff.read")
    const rows = await ctx.db.query("staffRoles").collect()
    const accounts = await staffAccounts(ctx)

    return rows.map((role) => ({
      id: role._id,
      key: role.key ?? null,
      name: role.name,
      description: role.description ?? null,
      permissions: role.permissions,
      system: role.system,
      holders: accounts.filter((user) =>
        (user.staffRoleIds ?? []).includes(role._id)
      ).length,
      updatedAt: role.updatedAt,
    }))
  },
})

/** The permission catalogue, for the role editor's checkboxes. */
export const catalogue = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "staff.read")
    return PERMISSIONS.map((entry) => ({ key: entry.key, group: entry.group }))
  },
})

/** Outstanding invitations. Expiry is computed, never stored. */
export const invitations = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "staff.read")
    const rows = await ctx.db
      .query("staffInvitations")
      .withIndex("by_status_and_invitedAt", (q) => q.eq("status", "pending"))
      .order("desc")
      .take(50)
    const roleRows = await ctx.db.query("staffRoles").collect()
    const byId = new Map(roleRows.map((role) => [role._id, role]))

    return rows.map((row) => ({
      id: row._id,
      email: row.email,
      invitedAt: row.invitedAt,
      expiresAt: row.expiresAt,
      expired: row.expiresAt < Date.now(),
      roles: row.roleIds.flatMap((id) => {
        const role = byId.get(id)
        return role === undefined ? [] : [{ id: role._id, name: role.name }]
      }),
    }))
  },
})

/**
 * Where to send an invited person, for an operator passing it on by hand.
 *
 * The very same `consoleUrl` the invitation email links to, so a copied link
 * and an emailed one are one address. `null` means it is not configured — which
 * is exactly when no email went out either, so the console says that instead of
 * handing over a link guessed from the operator's own tab: a console reachable
 * on localhost, or behind a staff-only origin, would produce one nobody else
 * can open.
 *
 * Read under `staff.read` rather than `settings.read`: whoever manages the team
 * needs this link, and an operator who may invite but may not see integrations
 * would otherwise be handed an invitation they cannot deliver.
 */
export const inviteLink = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "staff.read")
    return (await settingsFor(ctx)).consoleUrl
  },
})

// ── Invitations ─────────────────────────────────────────────────────────────

/**
 * Invite someone to the console by email.
 *
 * Nothing is granted here. The invitation binds when an account with that
 * *Clerk-verified* address appears — see `bindInvitation`. Inviting an address
 * that already has an account is fine: they pick it up on their next visit.
 */
export const invite = mutation({
  args: {
    email: v.string(),
    roleIds: v.array(v.id("staffRoles")),
    /** The invited person's language, as the inviter knows it. */
    english: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "staff.manage")
    const email = normaliseEmail(args.email)
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error("That is not an email address")
    }

    const roles = await assertGrantable(ctx, actor, args.roleIds)
    if (roles.length === 0) {
      throw new Error("An invitation needs at least one role")
    }

    const existing = await pendingInvitationFor(ctx, email)
    if (existing !== null) {
      await ctx.db.patch("staffInvitations", existing._id, {
        roleIds: roles.map((role) => role._id),
        invitedBy: actor._id,
        invitedAt: Date.now(),
        expiresAt: Date.now() + INVITE_TTL_MS,
      })
    } else {
      await ctx.db.insert("staffInvitations", {
        email,
        roleIds: roles.map((role) => role._id),
        invitedBy: actor._id,
        invitedAt: Date.now(),
        expiresAt: Date.now() + INVITE_TTL_MS,
        status: "pending",
      })
    }

    const { consoleUrl } = await settingsFor(ctx)
    const sent =
      consoleUrl === null
        ? false
        : await sendStaffInvite(ctx, {
            to: email,
            english: args.english ?? false,
            invitedByUserId: actor._id,
            link: consoleUrl,
          })
    if (consoleUrl === null) {
      // Not thrown: the invitation is real either way, and an Owner who has not
      // set the console URL yet should be told rather than blocked — the
      // invited person can be sent the address by hand.
      console.error("No console URL is set — staff invitation email not sent")
    }

    // An invitation is about a person who may have no account yet, so the
    // subject is the person who sent it — the only id there is.
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "staff.invited",
      meta: { email, roles: roles.length, emailed: sent },
    })
    return { emailed: sent }
  },
})

export const revokeInvitation = mutation({
  args: { invitationId: v.id("staffInvitations") },
  handler: async (ctx, { invitationId }) => {
    const actor = await requirePermission(ctx, "staff.manage")
    const row = await ctx.db.get("staffInvitations", invitationId)
    if (row === null || row.status !== "pending") {
      throw new Error("Not found")
    }
    await ctx.db.patch("staffInvitations", invitationId, { status: "revoked" })
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "staff.invitation_revoked",
      meta: { email: row.email },
    })
    return null
  },
})

/**
 * Bind an invitation to the signed-in account, from the console.
 *
 * The second of the two doors. The webhook one (`bindInvitation` from
 * `upsertFromClerk`) only fires when Clerk has something to say about the
 * account; somebody invited after they had already signed up would otherwise
 * wait forever for a sync that never comes.
 *
 * No permission: the caller is claiming something addressed to their own
 * verified email, and holding nothing yet is the whole point.
 */
export const claimInvitation = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await getCurrentUser(ctx)
    if (user === null) throw new Error("Not authenticated")
    return await bindInvitation(ctx, user)
  },
})

/**
 * Give an existing account staff roles directly.
 *
 * Two jobs: promoting the second Owner before mail is configured, and the fix
 * for someone who signed up with a different address than they were invited
 * at — the invitation stays pending and visibly unbound, and this is how an
 * Owner resolves it without guessing at Clerk's records.
 */
export const grantExisting = mutation({
  args: { userId: v.id("users"), roleIds: v.array(v.id("staffRoles")) },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "staff.manage")
    if (args.userId === actor._id) {
      throw new Error("You cannot change your own access")
    }
    const user = await ctx.db.get("users", args.userId)
    if (user === null) throw new Error("Not found")

    const roles = await assertGrantable(ctx, actor, args.roleIds)
    if (roles.length === 0) {
      throw new Error("Pick at least one role")
    }
    await warnIfVaultOwner(ctx, user)

    await applyRoles(
      ctx,
      user,
      roles.map((role) => role._id)
    )
    await writeStaffAudit(ctx, {
      actor,
      subject: user._id,
      event: "staff.roles_set",
      meta: { roles: roles.length, granted: true },
    })
    return null
  },
})

// ── Staff and roles ─────────────────────────────────────────────────────────

/**
 * Replace one staff member's roles.
 *
 * An empty set takes them off staff — see `applyRoles`, which is why there is
 * no separate "suspend".
 */
export const setUserRoles = mutation({
  args: { userId: v.id("users"), roleIds: v.array(v.id("staffRoles")) },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "staff.manage")
    if (args.userId === actor._id) {
      throw new Error("You cannot change your own access")
    }
    const user = await ctx.db.get("users", args.userId)
    if (user === null) throw new Error("Not found")

    const roles = await assertGrantable(ctx, actor, args.roleIds)
    await assertNotLastOwner(ctx, user, unionOf(roles))

    await applyRoles(
      ctx,
      user,
      roles.map((role) => role._id)
    )
    await writeStaffAudit(ctx, {
      actor,
      subject: user._id,
      event: "staff.roles_set",
      meta: { roles: roles.length, granted: false },
    })
    return null
  },
})

/** Take someone off staff entirely. Their account and audit history remain. */
export const removeStaff = mutation({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    const actor = await requirePermission(ctx, "staff.manage")
    if (userId === actor._id) {
      throw new Error("You cannot change your own access")
    }
    const user = await ctx.db.get("users", userId)
    if (user === null) throw new Error("Not found")
    await assertNotLastOwner(ctx, user, [])

    await applyRoles(ctx, user, [])
    await writeStaffAudit(ctx, {
      actor,
      subject: user._id,
      event: "staff.removed",
      meta: {},
    })
    return null
  },
})

export const createRole = mutation({
  args: {
    name: v.object({ ar: v.string(), en: v.string() }),
    description: v.optional(v.object({ ar: v.string(), en: v.string() })),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "staff.manage")
    const permissions = assertKeysGrantable(actor, args.permissions)

    const roleId = await ctx.db.insert("staffRoles", {
      name: args.name,
      description: args.description,
      permissions,
      system: false,
      createdBy: actor._id,
      updatedAt: Date.now(),
    })
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "staff.role_created",
      meta: { role: args.name.en, permissions: permissions.length },
    })
    return roleId
  },
})

/**
 * Edit a role.
 *
 * ⚠️ `recomputeHolders` is not optional here. Everyone holding this role is
 * gated on a denormalised copy of its keys, and an edit that does not fan out
 * leaves their open console running on the permissions it had a minute ago.
 */
export const saveRole = mutation({
  args: {
    roleId: v.id("staffRoles"),
    name: v.object({ ar: v.string(), en: v.string() }),
    description: v.optional(v.object({ ar: v.string(), en: v.string() })),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "staff.manage")
    const role = await ctx.db.get("staffRoles", args.roleId)
    if (role === null) throw new Error("Not found")
    if (role.system) {
      throw new Error("The Owner role cannot be edited")
    }
    const permissions = assertKeysGrantable(actor, args.permissions)

    await ctx.db.patch("staffRoles", args.roleId, {
      name: args.name,
      description: args.description,
      permissions,
      updatedAt: Date.now(),
    })
    const touched = await recomputeHolders(ctx, args.roleId)

    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "staff.role_saved",
      meta: {
        role: args.name.en,
        permissions: permissions.length,
        holders: touched,
      },
    })
    return null
  },
})

export const deleteRole = mutation({
  args: { roleId: v.id("staffRoles") },
  handler: async (ctx, { roleId }) => {
    const actor = await requirePermission(ctx, "staff.manage")
    const role = await ctx.db.get("staffRoles", roleId)
    if (role === null) throw new Error("Not found")
    if (role.system) {
      throw new Error("The Owner role cannot be deleted")
    }
    // Refused rather than cascaded: deleting a role out from under its holders
    // is a mass revocation that looks like housekeeping.
    const holders = await holdersOf(ctx, roleId)
    if (holders.length > 0) {
      throw new Error(
        `${holders.length} people still hold this role — move them off it first`
      )
    }

    await ctx.db.delete("staffRoles", roleId)
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "staff.role_deleted",
      meta: { role: role.name.en },
    })
    return null
  },
})

// ── Seeding and recovery (CLI) ──────────────────────────────────────────────

/**
 * Create the four roles a deployment starts with.
 *
 * Idempotent on `key`, and **not part of `seed.ts`** — that module has a `wipe`
 * counterpart, and a demo reset that deleted the Owner role would lock every
 * human out of the console with no way back except this function.
 *
 * An edited seeded role is left alone; the system Owner row is the exception
 * and is forced back to `["*"]`, because it is documented as immutable and
 * drift there means something wrote it that should not have.
 */
export const seedRoles = internalMutation({
  args: {},
  handler: async (ctx) => {
    const created: string[] = []
    for (const seeded of SEEDED_ROLES) {
      const existing = await ctx.db
        .query("staffRoles")
        .withIndex("by_key", (q) => q.eq("key", seeded.key))
        .unique()

      if (existing === null) {
        await ctx.db.insert("staffRoles", {
          key: seeded.key,
          name: seeded.name,
          description: seeded.description,
          permissions: [...seeded.permissions],
          system: seeded.system,
          updatedAt: Date.now(),
        })
        created.push(seeded.key)
      } else if (
        seeded.system &&
        !arraysEqual(existing.permissions, [ALL_PERMISSIONS])
      ) {
        await ctx.db.patch("staffRoles", existing._id, {
          permissions: [ALL_PERMISSIONS],
          system: true,
          updatedAt: Date.now(),
        })
        // Repairing the Owner role is still a role edit: whoever holds it is
        // gated on their own copy of its keys.
        await recomputeHolders(ctx, existing._id)
      }
    }
    return { created }
  },
})

/**
 * Make one account the Owner, from the CLI.
 *
 * `npx convex run staff:bootstrapOwner '{"email":"me@example.com"}'`
 *
 * The first Owner cannot come from the console — there is nobody to grant it —
 * and this is also the documented recovery when the last Owner is lost (Clerk
 * deleting the account, say, which cascades nothing). It refuses on a
 * deployment that already has an Owner unless forced, so it cannot be used as
 * a quiet escalation path on a healthy one.
 */
export const bootstrapOwner = internalMutation({
  args: { email: v.string(), force: v.optional(v.boolean()) },
  handler: async (ctx, { email, force }) => {
    const ownerRole = await ctx.db
      .query("staffRoles")
      .withIndex("by_key", (q) => q.eq("key", OWNER_ROLE_KEY))
      .unique()
    if (ownerRole === null) {
      throw new Error("Run staff:seedRoles first")
    }

    const owners = await ownerAccounts(ctx)
    if (owners.length > 0 && force !== true) {
      throw new Error(
        `This deployment already has ${owners.length} Owner(s). Pass {"force": true} to add another.`
      )
    }

    const normalised = normaliseEmail(email)
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", normalised))
      .unique()
    if (user === null) {
      throw new Error(`No account with the email ${normalised}`)
    }

    await applyRoles(ctx, user, [ownerRole._id])
    // The subject is also the actor: the CLI has no signed-in staff member, and
    // an audit line that invented one would be worse than a true one that says
    // where it came from.
    await writeStaffAudit(ctx, {
      actor: user,
      subject: user._id,
      event: "staff.roles_set",
      meta: { roles: 1, via: "cli" },
    })
    return { userId: user._id }
  },
})

/**
 * Give every pre-RBAC admin the Owner role.
 *
 * One-shot, for the cutover, and it has to run **before** the deployment that
 * gates anything: authority is `staffPermissions` alone, so an account left at
 * `role: "admin"` with no roles is simply refused. `bootstrapOwner` is the way
 * back if that happens.
 */
export const grantOwnerToLegacyAdmins = internalMutation({
  args: {},
  handler: async (ctx) => {
    const ownerRole = await ctx.db
      .query("staffRoles")
      .withIndex("by_key", (q) => q.eq("key", OWNER_ROLE_KEY))
      .unique()
    if (ownerRole === null) throw new Error("Run staff:seedRoles first")

    const accounts = await staffAccounts(ctx)
    const legacy = accounts.filter(
      (user) => (user.staffRoleIds ?? []).length === 0
    )
    for (const user of legacy) {
      await applyRoles(ctx, user, [ownerRole._id])
    }
    return { granted: legacy.map((user) => user.email) }
  },
})

// ── Helpers ─────────────────────────────────────────────────────────────────

async function hasPendingInvitation(
  ctx: QueryCtx,
  user: Doc<"users">
): Promise<boolean> {
  if (user.email === null) return false
  return (await pendingInvitationFor(ctx, normaliseEmail(user.email))) !== null
}

/** Everyone holding the wildcard, whatever role carries it. */
async function ownerAccounts(ctx: QueryCtx): Promise<Doc<"users">[]> {
  const accounts = await staffAccounts(ctx)
  return accounts.filter((user) =>
    (user.staffPermissions ?? []).includes(ALL_PERMISSIONS)
  )
}

/**
 * The roles an actor may hand out: they exist, and every key in them is one
 * the actor holds.
 *
 * ⚠️ This is what stands in for a two-person rule. Without it, a custom role
 * carrying `staff.manage` could mint itself `billing.manage` and then use it —
 * one person, two steps, no second signature anywhere.
 */
async function assertGrantable(
  ctx: QueryCtx,
  actor: Doc<"users">,
  roleIds: Id<"staffRoles">[]
): Promise<Doc<"staffRoles">[]> {
  const roles = await rolesOf(ctx, roleIds)
  if (roles.length !== roleIds.length) {
    throw new Error("One of those roles no longer exists")
  }
  assertKeysGrantable(
    actor,
    roles.flatMap((role) => role.permissions)
  )
  return roles
}

/** The same rule for a set of keys, and the place unknown ones are refused. */
function assertKeysGrantable(
  actor: Doc<"users">,
  keys: readonly string[]
): PermissionKey[] {
  const held = actor.staffPermissions ?? []
  const all = held.includes(ALL_PERMISSIONS)

  const clean: PermissionKey[] = []
  for (const key of keys) {
    if (key === ALL_PERMISSIONS) {
      throw new Error("Only the Owner role may hold every permission")
    }
    if (!isPermissionKey(key)) {
      throw new Error(`Unknown permission: ${key}`)
    }
    if (!all && !held.includes(key)) {
      throw new Error(`You cannot grant a permission you do not hold: ${key}`)
    }
    if (!clean.includes(key)) clean.push(key)
  }
  return clean
}

/**
 * The deployment must keep at least one Owner.
 *
 * Checked against what the target *would* hold after the change, not what they
 * hold now — dropping the Owner role while keeping two others still ends
 * Owner-hood, and the point is that somebody can always get back in.
 */
async function assertNotLastOwner(
  ctx: QueryCtx,
  target: Doc<"users">,
  nextPermissions: string[]
): Promise<void> {
  const wasOwner = (target.staffPermissions ?? []).includes(ALL_PERMISSIONS)
  const stillOwner = nextPermissions.includes(ALL_PERMISSIONS)
  if (!wasOwner || stillOwner) return

  const owners = await ownerAccounts(ctx)
  if (owners.filter((user) => user._id !== target._id).length === 0) {
    throw new Error(
      "This is the last Owner — grant someone else the Owner role first"
    )
  }
}

/**
 * Staff accounts are excluded from every owner metric, so a staff member who
 * also keeps a vault quietly disappears from the funnel, the risk table and the
 * owners list while their own vault carries on working. Loud rather than
 * refused: dogfooding is worth doing, and being surprised by it is not.
 */
async function warnIfVaultOwner(
  ctx: QueryCtx,
  user: Doc<"users">
): Promise<void> {
  const keyring = await ctx.db
    .query("keyring")
    .withIndex("by_userId", (q) => q.eq("userId", user._id))
    .first()
  if (keyring !== null) {
    console.warn(
      `staff: ${user.email ?? user._id} has a vault; they will no longer appear in owner metrics`
    )
  }
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, i) => value === b[i])
}
