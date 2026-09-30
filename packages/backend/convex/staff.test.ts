/// <reference types="vite/client" />
import type { UserJSON } from "@clerk/backend"
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api, internal } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

/** The slice of Clerk's `UserJSON` that `upsertFromClerk` reads. */
function clerkUser(verified: boolean): UserJSON {
  const slice = {
    id: "invitee",
    first_name: "New",
    last_name: "Operator",
    primary_email_address_id: "email_1",
    email_addresses: [
      {
        id: "email_1",
        email_address: "invitee@example.com",
        verification: { status: verified ? "verified" : "unverified" },
      },
    ],
  }
  return slice as unknown as UserJSON
}

async function invite(t: ReturnType<typeof convexTest>) {
  await t.run(async (ctx) => {
    const inviter = await ctx.db.insert("users", {
      externalId: "owner-staff",
      name: "Owner",
      email: "owner@example.com",
      role: "admin",
      staffPermissions: ["*"],
    })
    const roleId = await ctx.db.insert("staffRoles", {
      name: { ar: "مدقق", en: "Reviewer" },
      permissions: ["claims.read"],
      system: false,
      updatedAt: Date.now(),
    })
    await ctx.db.insert("staffInvitations", {
      email: "invitee@example.com",
      roleIds: [roleId],
      invitedBy: inviter,
      invitedAt: Date.now(),
      expiresAt: Date.now() + 7 * DAY,
      status: "pending",
    })
  })
}

describe("a staff invitation binds only to a verified address", () => {
  test("an unverified sign-up gets nothing, from either door", async () => {
    const t = convexTest(schema, modules)
    await invite(t)

    await t.mutation(internal.users.upsertFromClerk, { data: clerkUser(false) })
    const as = t.withIdentity({ subject: "invitee" })
    expect(await as.mutation(api.staff.claimInvitation, {})).toEqual({
      bound: false,
    })
    const me = await as.query(api.staff.me, {})
    expect(me?.permissions).toEqual([])
    expect(me?.pendingInvitation).toBe(false)
  })

  test("once Clerk verifies the address, the invitation binds", async () => {
    const t = convexTest(schema, modules)
    await invite(t)

    await t.mutation(internal.users.upsertFromClerk, { data: clerkUser(false) })
    await t.mutation(internal.users.upsertFromClerk, { data: clerkUser(true) })
    const me = await t
      .withIdentity({ subject: "invitee" })
      .query(api.staff.me, {})
    expect(me?.permissions).toContain("claims.read")
  })
})
