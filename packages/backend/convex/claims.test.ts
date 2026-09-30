/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test, vi } from "vitest"

import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { identityNumberHash } from "./model/identityHash"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

process.env.IDENTITY_HASH_SECRET = "test-identity-hash-secret-0123456789abcdef"

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
        releaseKeyWrappedByMk: new ArrayBuffer(72),
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
    expect(keyring?.releaseKeyWrappedByMk).toBeNull()

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
    const executor = await t.run((ctx) =>
      ctx.db.insert("executors", {
        userId: owner,
        name: "Executor",
        phone: "+966500000000",
        idNumberHash: "0".repeat(64),
      })
    )
    const claim = await t.run(async (ctx) =>
      (await ctx.db.query("claims").collect())[0]!._id
    )
    const delivery = await t.run((ctx) =>
      ctx.db.insert("deliveries", {
        claimId: claim,
        subjectUserId: owner,
        executorId: executor,
        status: "awaiting_executor",
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
      await ctx.db.insert("assets", {
        userId: owner,
        type: "note",
        labelSealed: new ArrayBuffer(40),
        meta: {},
        dekWrappedByMk: new ArrayBuffer(72),
        dekWrappedByRelease: new ArrayBuffer(72),
        files: [],
      })
      await ctx.db.insert("executors", {
        userId: owner,
        name: "Executor",
        phone: "+966500000000",
        idNumberHash: "0".repeat(64),
        sheet: {
          releaseKeyWrapped: new ArrayBuffer(72),
          version: 1,
          printedAt: Date.now(),
        },
      })
    })

    await t.mutation(internal.vault.purge, { ownerId: owner })

    const left = await t.run(async (ctx) => ({
      assets: await ctx.db
        .query("assets")
        .withIndex("by_userId", (q) => q.eq("userId", owner))
        .collect(),
      executors: await ctx.db
        .query("executors")
        .withIndex("by_userId", (q) => q.eq("userId", owner))
        .collect(),
      keyring: await ctx.db
        .query("keyring")
        .withIndex("by_userId", (q) => q.eq("userId", owner))
        .unique(),
    }))
    expect(left.assets).toEqual([])
    expect(left.executors).toEqual([])
    expect(left.keyring).toBeNull()
  })
})

describe("a report names nobody before review", () => {
  test("a matched filing reads the same as a miss until staff match it", async () => {
    const t = convexTest(schema, modules)
    await addUser(t, "owner")
    await addUser(t, "reporter")
    const reporter = t.withIdentity({ subject: "reporter" })

    const matched = await reporter.mutation(api.claims.submit, {
      subjectEmail: "owner@example.com",
      claimantName: "Reporter",
      claimantContact: "0500000000",
    })
    const missed = await reporter.mutation(api.claims.submit, {
      subjectEmail: "nobody@example.com",
      claimantName: "Reporter",
      claimantContact: "0500000000",
    })

    for (const { claimId } of [matched, missed]) {
      expect((await t.query(api.claims.publicStatus, { claimId }))?.subjectName).toBeNull()
      expect((await reporter.query(api.claims.forClaimant, { claimId }))?.subjectName).toBeNull()
    }
    const rows = await reporter.query(api.claims.mine, {})
    expect(rows.map((row) => row.subjectName)).toEqual([null, null])

    await t.run((ctx) =>
      ctx.db.patch("claims", matched.claimId, { status: "awaiting_veto", nameMatch: true })
    )
    expect((await t.query(api.claims.publicStatus, { claimId: matched.claimId }))?.subjectName).toBe("owner")
  })

  test("a refused filing says why, in a form production does not redact", async () => {
    const t = convexTest(schema, modules)
    await addUser(t, "owner")
    const own = t.withIdentity({ subject: "owner" }).mutation(api.claims.submit, {
      subjectEmail: "owner@example.com",
      claimantName: "Owner",
      claimantContact: "0500000000",
    })
    await expect(own).rejects.toMatchObject({ data: { code: "claim", reason: "own_vault" } })
  })
})

describe("a live report is never hidden behind history", () => {
  test("Home sees it and the check-in stops it, past twenty older reports", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    for (let i = 0; i < 25; i++) {
      await t.run((ctx) =>
        ctx.db.insert("claims", {
          subjectUserId: owner,
          claimantUserId: reporter,
          claimantName: "Reporter",
          claimantContact: "reporter@example.com",
          status: "closed",
        })
      )
    }
    const live = await addClaim(t, owner, reporter, { status: "submitted" })

    const asOwner = t.withIdentity({ subject: "owner" })
    const seen = await asOwner.query(api.claims.againstMe, {})
    expect(seen.find((row) => row.open)?.id).toBe(live)

    const result = await asOwner.mutation(api.checkin.confirm, {})
    expect(result.claimsStopped).toBe(1)
    expect((await t.run((ctx) => ctx.db.get("claims", live)))?.status).toBe("vetoed")
  })
})

describe("a rejection says why, to staff only", () => {
  async function submittedClaim() {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    await t.run((ctx) =>
      ctx.db.insert("users", {
        externalId: "staff",
        name: "Reviewer",
        email: "staff@example.com",
        role: "admin",
        identityStatus: "verified",
        staffPermissions: ["*"],
      })
    )
    const claimId = await addClaim(t, owner, reporter, { status: "submitted" })
    return { t, claimId, staff: t.withIdentity({ subject: "staff" }) }
  }

  test("a rejection without a reason is refused", async () => {
    const { t, claimId, staff } = await submittedClaim()
    await expect(
      staff.mutation(api.claims.adminSetNameMatch, { claimId, nameMatch: false })
    ).rejects.toThrow("A rejection needs a reason")
    expect((await t.run((ctx) => ctx.db.get("claims", claimId)))?.status).toBe(
      "submitted"
    )
  })

  test("an approval cannot carry a reason", async () => {
    const { claimId, staff } = await submittedClaim()
    await expect(
      staff.mutation(api.claims.adminSetNameMatch, {
        claimId,
        nameMatch: true,
        rejectReason: "unreadable",
      })
    ).rejects.toThrow("Only a rejection takes a reason")
  })

  test("staff read the reason and the reviewer; the reporter reads neither", async () => {
    const { t, claimId, staff } = await submittedClaim()
    await staff.mutation(api.claims.adminSetNameMatch, {
      claimId,
      nameMatch: false,
      rejectReason: "not_certificate",
    })

    const detail = await staff.query(api.admin.claimDetail, { claimId })
    expect(detail?.claim.status).toBe("locked")
    expect(detail?.claim.rejectReason).toBe("not_certificate")
    expect(detail?.claim.reviewedBy).toBe("Reviewer")

    const mine = await t
      .withIdentity({ subject: "reporter" })
      .query(api.claims.forClaimant, { claimId })
    expect(mine?.status).toBe("locked")
    expect(mine).not.toHaveProperty("rejectReason")
    expect(mine).not.toHaveProperty("nameMatch")
  })
})

describe("a report finds the vault by the ID number on the certificate", () => {
  const filing = { claimantName: "Reporter", claimantContact: "0500000000" }

  test("the number finds the vault, and only its hash is kept", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    await addUser(t, "reporter")
    await verifyIdentity(t, owner, "1023456789")

    const { claimId } = await t
      .withIdentity({ subject: "reporter" })
      .mutation(api.claims.submit, { ...filing, subjectIdNumber: "1 023-456 789" })
    const claim = await t.run((ctx) => ctx.db.get("claims", claimId))
    expect(claim?.subjectUserId).toBe(owner)
    expect(claim?.matchedBy).toBe("id_number")
    expect(claim?.subjectIdHash).toBeDefined()
    expect(JSON.stringify(claim)).not.toContain("1023456789")
  })

  test("the number wins over an email that names another vault", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    await addUser(t, "other")
    await addUser(t, "reporter")
    await verifyIdentity(t, owner, "1023456789")

    const { claimId } = await t.withIdentity({ subject: "reporter" }).mutation(api.claims.submit, {
      ...filing,
      subjectIdNumber: "1023456789",
      subjectEmail: "other@example.com",
    })
    expect((await t.run((ctx) => ctx.db.get("claims", claimId)))?.subjectUserId).toBe(owner)
  })

  test("the email still finds the vault when the number matches nothing", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    await addUser(t, "reporter")

    const { claimId } = await t.withIdentity({ subject: "reporter" }).mutation(api.claims.submit, {
      ...filing,
      subjectIdNumber: "2099999999",
      subjectEmail: "owner@example.com",
    })
    const claim = await t.run((ctx) => ctx.db.get("claims", claimId))
    expect(claim?.subjectUserId).toBe(owner)
    expect(claim?.matchedBy).toBe("email")
  })

  test("a number on two accounts decides nothing unless the email picks one", async () => {
    const t = convexTest(schema, modules)
    const first = await addUser(t, "first")
    const second = await addUser(t, "second")
    await addUser(t, "reporter")
    await verifyIdentity(t, first, "1023456789")
    await verifyIdentity(t, second, "1023456789")
    const reporter = t.withIdentity({ subject: "reporter" })

    const alone = await reporter.mutation(api.claims.submit, { ...filing, subjectIdNumber: "1023456789" })
    expect((await t.run((ctx) => ctx.db.get("claims", alone.claimId)))?.subjectUserId).toBeUndefined()

    const picked = await reporter.mutation(api.claims.submit, {
      ...filing,
      subjectIdNumber: "1023456789",
      subjectEmail: "second@example.com",
    })
    expect((await t.run((ctx) => ctx.db.get("claims", picked.claimId)))?.subjectUserId).toBe(second)
  })

  test("a report needs a number or an email, and a number long enough to be one", async () => {
    const t = convexTest(schema, modules)
    await addUser(t, "reporter")
    const reporter = t.withIdentity({ subject: "reporter" })
    await expect(reporter.mutation(api.claims.submit, filing)).rejects.toMatchObject({
      data: { code: "claim", reason: "no_subject" },
    })
    await expect(
      reporter.mutation(api.claims.submit, { ...filing, subjectIdNumber: "12" })
    ).rejects.toMatchObject({ data: { code: "claim", reason: "bad_id_number" } })
  })

  test("a veto earned by email bars a report filed by number", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    await verifyIdentity(t, owner, "1023456789")
    await t.run((ctx) =>
      ctx.db.insert("claims", {
        subjectUserId: owner,
        subjectEmail: "owner@example.com",
        claimantUserId: reporter,
        claimantName: "Reporter",
        claimantContact: "0500000000",
        status: "vetoed",
        lockedUntil: Date.now() + 30 * DAY,
      })
    )

    const { claimId } = await t
      .withIdentity({ subject: "reporter" })
      .mutation(api.claims.submit, { ...filing, subjectIdNumber: "1023456789" })
    expect((await t.run((ctx) => ctx.db.get("claims", claimId)))?.status).toBe("locked")
  })

  test("the lookup follows the verified document, and leaves with the account", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    await verifyIdentity(t, owner, "1023456789")
    await verifyIdentity(t, owner, "2034567890")
    const rows = await t.run((ctx) =>
      ctx.db.query("identityLookup").withIndex("by_userId", (q) => q.eq("userId", owner)).collect()
    )
    expect(rows.map((row) => row.hash)).toEqual([await identityNumberHash("2034567890")])

    await t.mutation(internal.account.onClerkDeleted, { clerkUserId: "owner" })
    expect(await t.run((ctx) => ctx.db.query("identityLookup").collect())).toEqual([])
  })
})

describe("the reviewer's blind ID-number check", () => {
  async function setup() {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    await t.run((ctx) =>
      ctx.db.insert("users", {
        externalId: "staff",
        name: "Reviewer",
        email: "staff@example.com",
        role: "admin",
        identityStatus: "verified",
        staffPermissions: ["*"],
      })
    )
    await verifyIdentity(t, owner, "1023456789")
    const claimId = await addClaim(t, owner, reporter, { status: "submitted" })
    return { t, owner, claimId, staff: t.withIdentity({ subject: "staff" }) }
  }

  test("a match answers yes once, and is recorded without the number", async () => {
    const { t, owner, claimId, staff } = await setup()
    const result = await staff.mutation(api.claims.adminCheckIdNumber, {
      claimId,
      idNumber: "1023 456 789",
    })
    expect(result).toEqual({ matched: true, attemptsLeft: 2 })
    await expect(
      staff.mutation(api.claims.adminCheckIdNumber, { claimId, idNumber: "1023456789" })
    ).rejects.toThrow("The number already matched")

    const audit = await t.run((ctx) =>
      ctx.db.query("auditLog").withIndex("by_userId_and_at", (q) => q.eq("userId", owner)).collect()
    )
    const checks = audit.filter((row) => row.event === "claim.id_checked")
    expect(checks).toHaveLength(1)
    expect(JSON.stringify(checks)).not.toContain("1023456789")
  })

  test("three wrong numbers close the check; a short one costs nothing", async () => {
    const { claimId, staff } = await setup()
    await expect(
      staff.mutation(api.claims.adminCheckIdNumber, { claimId, idNumber: "12" })
    ).rejects.toThrow("too short")
    for (const left of [2, 1, 0]) {
      const result = await staff.mutation(api.claims.adminCheckIdNumber, {
        claimId,
        idNumber: "2099999999",
      })
      expect(result).toEqual({ matched: false, attemptsLeft: left })
    }
    await expect(
      staff.mutation(api.claims.adminCheckIdNumber, { claimId, idNumber: "1023456789" })
    ).rejects.toThrow("No attempts left")
  })

  test("the owner's identity reaches the reviewer, never the numbers", async () => {
    const { claimId, staff } = await setup()
    const detail = await staff.query(api.admin.claimDetail, { claimId })
    expect(detail?.subject.birthDate).toBe("1961-03-14")
    expect(detail?.subject.hasIdNumbers).toBe(true)
    expect(detail?.claim.idCheck).toEqual({ attempts: 0, max: 3, matched: null })
    expect(JSON.stringify(detail)).not.toContain(await identityNumberHash("1023456789"))
  })
})

async function verifyIdentity(
  t: ReturnType<typeof convexTest>,
  userId: Id<"users">,
  idNumber: string
) {
  await t.mutation(internal.identity.applyWebhookResult, {
    sessionId: `session-${userId}`,
    vendorData: userId,
    status: "verified",
    verifiedName: "Owner Name",
    docHashes: [await identityNumberHash(idNumber)],
    birthDate: "1961-03-14",
  })
}

describe("death certificate retention", () => {
  test("a stopped report's certificate goes after the retention window", async () => {
    vi.useFakeTimers()
    try {
      const t = convexTest(schema, modules)
      const owner = await addUser(t, "owner")
      const reporter = await addUser(t, "reporter")
      const certificate = await t.run((ctx) =>
        ctx.storage.store(new Blob(["certificate"]))
      )
      const claimId = await t.run((ctx) =>
        ctx.db.insert("claims", {
          subjectUserId: owner,
          claimantUserId: reporter,
          claimantName: "Reporter",
          claimantContact: "reporter@example.com",
          status: "submitted",
          certificateStorageId: certificate,
        })
      )

      await t.withIdentity({ subject: "owner" }).mutation(api.checkin.confirm, {})
      await t.mutation(internal.claims.purgeCertificates, {})
      expect(await t.run((ctx) => ctx.storage.getUrl(certificate))).not.toBeNull()

      vi.advanceTimersByTime(31 * DAY)
      await t.mutation(internal.claims.purgeCertificates, {})
      expect(await t.run((ctx) => ctx.storage.getUrl(certificate))).toBeNull()

      const claim = await t.run((ctx) => ctx.db.get("claims", claimId))
      expect(claim?.status).toBe("vetoed")
      expect(claim?.certificateStorageId).toBeUndefined()
      expect(claim?.certificateAttachedAt).toBeDefined()
    } finally {
      vi.useRealTimers()
    }
  })
})

describe("the ruling", () => {
  async function setup(certificate: boolean) {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    await t.run((ctx) =>
      ctx.db.insert("users", {
        externalId: "staff",
        name: "Reviewer",
        email: "staff@example.com",
        role: "admin",
        staffPermissions: ["claims.rule"],
      })
    )
    const certificateStorageId = certificate
      ? await t.run((ctx) => ctx.storage.store(new Blob(["certificate"])))
      : undefined
    const claimId = await t.run((ctx) =>
      ctx.db.insert("claims", {
        subjectUserId: owner,
        claimantUserId: reporter,
        claimantName: "Reporter",
        claimantContact: "reporter@example.com",
        status: "submitted",
        certificateStorageId,
      })
    )
    return { t, claimId, staff: t.withIdentity({ subject: "staff" }) }
  }

  test("no report is approved without its death certificate", async () => {
    const { t, claimId, staff } = await setup(false)
    await expect(
      staff.mutation(api.claims.adminSetNameMatch, { claimId, nameMatch: true })
    ).rejects.toThrow(/death certificate/)
    expect((await t.run((ctx) => ctx.db.get("claims", claimId)))?.status).toBe(
      "submitted"
    )

    await staff.mutation(api.claims.adminSetNameMatch, {
      claimId,
      nameMatch: false,
      rejectReason: "not_certificate",
    })
    expect((await t.run((ctx) => ctx.db.get("claims", claimId)))?.status).toBe(
      "locked"
    )
  })

  test("with the certificate on file, approval starts the waiting period", async () => {
    const { t, claimId, staff } = await setup(true)
    await staff.mutation(api.claims.adminSetNameMatch, {
      claimId,
      nameMatch: true,
    })
    expect((await t.run((ctx) => ctx.db.get("claims", claimId)))?.status).toBe(
      "awaiting_veto"
    )
  })
})

describe("the end of a released vault", () => {
  async function releaseWithoutExecutors() {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    await t.run(async (ctx) => {
      const bytes = new ArrayBuffer(8)
      await ctx.db.insert("assets", {
        userId: owner,
        type: "note",
        labelSealed: bytes,
        meta: {},
        dekWrappedByMk: bytes,
        files: [],
      })
    })
    await addClaim(t, owner, reporter, {
      status: "awaiting_veto",
      vetoDeadline: Date.now() - 1000,
    })
    await t.mutation(internal.claims.advance, {})
    return { t, owner }
  }

  const assetsOf = (
    t: Awaited<ReturnType<typeof releaseWithoutExecutors>>["t"],
    owner: Id<"users">
  ) =>
    t.run(async (ctx) =>
      (
        await ctx.db
          .query("assets")
          .withIndex("by_userId", (q) => q.eq("userId", owner))
          .collect()
      ).length
    )

  test("a vault with no executors is still deleted after the delivery year", async () => {
    vi.useFakeTimers()
    try {
      const { t, owner } = await releaseWithoutExecutors()
      const released = await t.run((ctx) => ctx.db.get("users", owner))
      expect(released?.vaultClosedAt).toBeDefined()
      expect(released?.vaultPurgeAt).toBeGreaterThan(Date.now() + 364 * DAY)

      await t.mutation(internal.deliveries.expire, {})
      await t.finishAllScheduledFunctions(vi.runAllTimers)
      expect(await assetsOf(t, owner)).toBe(1)

      vi.advanceTimersByTime(366 * DAY)
      await t.mutation(internal.deliveries.expire, {})
      await t.finishAllScheduledFunctions(vi.runAllTimers)
      expect(await assetsOf(t, owner)).toBe(0)
    } finally {
      vi.useRealTimers()
    }
  })

  test("a reopened vault is not deleted", async () => {
    vi.useFakeTimers()
    try {
      const { t, owner } = await releaseWithoutExecutors()
      await t.mutation(internal.claims.reopenVault, { userId: owner })

      vi.advanceTimersByTime(366 * DAY)
      await t.mutation(internal.deliveries.expire, {})
      await t.finishAllScheduledFunctions(vi.runAllTimers)
      expect(await assetsOf(t, owner)).toBe(1)
    } finally {
      vi.useRealTimers()
    }
  })
})
