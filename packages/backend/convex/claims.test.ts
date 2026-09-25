/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

async function addUser(t: ReturnType<typeof convexTest>, externalId: string) {
  return await t.run((ctx) =>
    ctx.db.insert("users", {
      externalId,
      name: externalId,
      email: `${externalId}@example.com`,
      role: "owner",
      identityStatus: "verified",
    })
  )
}

async function addClaim(
  t: ReturnType<typeof convexTest>,
  subjectUserId: Id<"users">,
  claimantUserId: Id<"users">,
  fields: { status: "submitted" | "awaiting_veto" | "released"; vetoDeadline?: number }
) {
  return await t.run((ctx) =>
    ctx.db.insert("claims", {
      subjectUserId,
      claimantUserId,
      claimantName: "Reporter",
      claimantContact: "reporter@example.com",
      nameMatch: fields.status === "submitted" ? undefined : true,
      ...fields,
    })
  )
}

describe("the check-in is the veto", () => {
  test("confirming alive stops every open report and bars its reporter", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    const submitted = await addClaim(t, owner, reporter, { status: "submitted" })
    const waiting = await addClaim(t, owner, reporter, {
      status: "awaiting_veto",
      vetoDeadline: Date.now() + 10 * DAY,
    })

    // No check-in is configured: saying "I am alive" must not need a setting.
    const result = await t
      .withIdentity({ subject: "owner" })
      .mutation(api.checkin.confirm, {})
    expect(result.claimsStopped).toBe(2)

    for (const id of [submitted, waiting]) {
      const claim = await t.run((ctx) => ctx.db.get("claims", id))
      expect(claim?.status).toBe("vetoed")
      expect(claim?.lockedUntil).toBeGreaterThan(Date.now())
    }
  })

  test("a released report is past stopping", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    const released = await addClaim(t, owner, reporter, { status: "released" })

    const result = await t
      .withIdentity({ subject: "owner" })
      .mutation(api.checkin.confirm, {})
    expect(result.claimsStopped).toBe(0)
    const claim = await t.run((ctx) => ctx.db.get("claims", released))
    expect(claim?.status).toBe("released")
  })
})

describe("a released vault is closed", () => {
  async function releasedOwner() {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    await t.run(async (ctx) => {
      await ctx.db.insert("keyring", {
        userId: owner,
        mkWrappedByRecovery: new ArrayBuffer(72),
        paperVersion: 1,
        wrapperVersion: 2,
        rotatedAt: Date.now(),
      })
      await ctx.db.insert("devices", {
        userId: owner,
        installId: "old-phone",
        name: "Old phone",
        platform: "ios",
        revoked: false,
      })
    })
    await addClaim(t, owner, reporter, {
      status: "awaiting_veto",
      vetoDeadline: Date.now() - 1,
    })
    await t.mutation(internal.claims.advance, {})
    return { t, owner }
  }

  test("release closes the vault: no wrapper, no new device", async () => {
    const { t, owner } = await releasedOwner()
    const user = await t.run((ctx) => ctx.db.get("users", owner))
    expect(user?.vaultClosedAt).toBeDefined()

    const keyring = await t.withIdentity({ subject: "owner" }).query(api.keyring.get, {})
    expect(keyring?.closed).toBe(true)
    expect(keyring?.mkWrappedByRecovery).toBeNull()

    await expect(
      t.withIdentity({ subject: "owner" }).mutation(api.devices.register, {
        installId: "new-phone",
        name: "New phone",
        platform: "android",
      })
    ).rejects.toThrow(/closed/)

    // A device enrolled before release is not re-enrolled, just recognised.
    const existing = await t
      .withIdentity({ subject: "owner" })
      .mutation(api.devices.register, {
        installId: "old-phone",
        name: "Old phone",
        platform: "ios",
      })
    expect(existing.created).toBe(false)
  })

  test("reopening, for an owner proven alive, stops every open delivery", async () => {
    const { t, owner } = await releasedOwner()
    const heir = await t.run((ctx) =>
      ctx.db.insert("heirs", {
        userId: owner,
        name: "Heir",
        relation: "son",
        phone: "+966500000000",
        mode: "silent",
        inviteStatus: "none",
      })
    )
    const claim = await t.run(async (ctx) =>
      (await ctx.db.query("claims").collect())[0]!._id
    )
    const delivery = await t.run((ctx) =>
      ctx.db.insert("deliveries", {
        claimId: claim,
        subjectUserId: owner,
        heirId: heir,
        status: "awaiting_heir",
        contactToken: "token",
        expiresAt: Date.now() + 365 * DAY,
      })
    )

    const result = await t.mutation(internal.claims.reopenVault, { userId: owner })
    expect(result.deliveriesStopped).toBe(1)
    const after = await t.run(async (ctx) => ({
      user: await ctx.db.get("users", owner),
      delivery: await ctx.db.get("deliveries", delivery),
    }))
    expect(after.user?.vaultClosedAt).toBeUndefined()
    expect(after.delivery?.status).toBe("rejected")
  })

  test("after the year, the whole vault is deleted", async () => {
    const { t, owner } = await releasedOwner()
    await t.run(async (ctx) => {
      const assetId = await ctx.db.insert("assets", {
        userId: owner,
        type: "note",
        labelSealed: new ArrayBuffer(40),
        meta: {},
        dekWrappedByMk: new ArrayBuffer(72),
        files: [],
        recipientRule: "explicit",
      })
      await ctx.db.insert("assetRecipients", {
        assetId,
        userId: owner,
        recipient: { kind: "allHeirs" },
        recipientKind: "allHeirs",
      })
    })

    await t.mutation(internal.vault.purge, { ownerId: owner })

    const left = await t.run(async (ctx) => ({
      assets: await ctx.db
        .query("assets")
        .withIndex("by_userId", (q) => q.eq("userId", owner))
        .collect(),
      routes: await ctx.db.query("assetRecipients").collect(),
      keyring: await ctx.db
        .query("keyring")
        .withIndex("by_userId", (q) => q.eq("userId", owner))
        .unique(),
    }))
    expect(left.assets).toEqual([])
    expect(left.routes).toEqual([])
    expect(left.keyring).toBeNull()
  })
})
