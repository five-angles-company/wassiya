/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { ConvexError } from "convex/values"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

process.env.IDENTITY_HASH_SECRET = "test-identity-hash-secret-0123456789abcdef"

type T = ReturnType<typeof convexTest>

async function addUser(t: T, externalId: string) {
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

/** A vault with one of everything the purge must remove. */
async function fillVault(t: T, owner: Id<"users">) {
  return await t.run(async (ctx) => {
    const file = await ctx.storage.store(new Blob(["cipher"]))
    const attachment = await ctx.storage.store(new Blob(["png"]))
    const bytes = new ArrayBuffer(8)
    await ctx.db.insert("assets", {
      userId: owner,
      type: "note",
      labelSealed: bytes,
      meta: {},
      dekWrappedByMk: bytes,
      files: [{ storageId: file }],
    })
    await ctx.db.insert("executors", {
      userId: owner,
      name: "Executor",
      phone: "+966500000000",
      idNumberHash: "hash",
    })
    await ctx.db.insert("keyring", {
      userId: owner,
      mkWrappedByRecovery: bytes,
      paperVersion: 1,
      rotatedAt: Date.now(),
    })
    await ctx.db.insert("devices", {
      userId: owner,
      installId: "install",
      name: "iPhone",
      platform: "ios",
      revoked: false,
    })
    await ctx.db.insert("checkinConfig", {
      userId: owner,
      cadenceMonths: 6,
      graceDays: 14,
      lastConfirmedAt: Date.now(),
      escalationState: "idle",
      nextDueAt: Date.now() + 180 * DAY,
    })
    await ctx.db.insert("identityLookup", { hash: "id-hash", userId: owner })
    const threadId = await ctx.db.insert("supportThreads", {
      requesterUserId: owner,
      surface: "mobile",
      topic: "other",
      locale: "ar",
      status: "open",
      lastMessageAt: Date.now(),
      lastAuthor: "requester",
      preview: "hi",
      requesterUnread: false,
      staffUnread: true,
      searchText: "hi",
    })
    await ctx.db.insert("supportMessages", {
      threadId,
      author: "requester",
      body: "hi",
      attachments: [
        {
          storageId: attachment,
          name: "a.png",
          contentType: "image/png",
          size: 3,
        },
      ],
      at: Date.now(),
    })
    await ctx.db.insert("supportNotes", {
      threadId,
      authorUserId: owner,
      body: "note",
      at: Date.now(),
    })
    return { file, attachment }
  })
}

async function remaining(t: T, owner: Id<"users">) {
  return await t.run(async (ctx) => {
    const byUser = async (
      table:
        | "assets"
        | "executors"
        | "keyring"
        | "devices"
        | "checkinConfig"
        | "identityLookup"
    ) =>
      (await ctx.db.query(table).collect()).filter(
        (row) => row.userId === owner
      ).length
    return {
      user: (await ctx.db.get("users", owner)) !== null,
      assets: await byUser("assets"),
      executors: await byUser("executors"),
      keyring: await byUser("keyring"),
      devices: await byUser("devices"),
      checkin: await byUser("checkinConfig"),
      lookup: await byUser("identityLookup"),
      threads: (await ctx.db.query("supportThreads").collect()).length,
      messages: (await ctx.db.query("supportMessages").collect()).length,
      notes: (await ctx.db.query("supportNotes").collect()).length,
    }
  })
}

function deletionReason(error: unknown): string | null {
  if (!(error instanceof ConvexError)) return null
  const data = error.data as { code?: string; reason?: string }
  return data.code === "deletion" ? (data.reason ?? null) : null
}

const fetchMock = vi.fn(async () => new Response(null, { status: 200 }))

beforeEach(() => {
  vi.useFakeTimers()
  vi.stubGlobal("fetch", fetchMock)
  process.env.CLERK_SECRET_KEY = "sk_test_account"
  fetchMock.mockClear()
})
afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

describe("requesting deletion", () => {
  test("schedules it a week out, tells the owner, and can be cancelled", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const as = t.withIdentity({ subject: "owner" })

    const { dueAt } = await as.mutation(api.account.requestDeletion, {})
    expect(dueAt).toBeGreaterThanOrEqual(Date.now() + 7 * DAY - 1000)
    expect((await as.query(api.users.me, {}))?.deletionDueAt).toBe(dueAt)
    const kinds = await t.run(async (ctx) =>
      (
        await ctx.db
          .query("notifications")
          .withIndex("by_userId", (q) => q.eq("userId", owner))
          .collect()
      ).map((row) => row.kind)
    )
    expect(kinds).toContain("account.deletion_scheduled")

    await as.mutation(api.account.cancelDeletion, {})
    expect((await as.query(api.users.me, {}))?.deletionDueAt).toBeNull()
  })

  test("is refused while a death report is open", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    await t.run((ctx) =>
      ctx.db.insert("claims", {
        subjectUserId: owner,
        claimantUserId: reporter,
        claimantName: "Reporter",
        claimantContact: "reporter@example.com",
        status: "submitted",
      })
    )
    const error = await t
      .withIdentity({ subject: "owner" })
      .mutation(api.account.requestDeletion, {})
      .catch((cause: unknown) => cause)
    expect(deletionReason(error)).toBe("report_open")
  })

  test("is refused once the vault was released", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    await t.run((ctx) =>
      ctx.db.patch("users", owner, { vaultClosedAt: Date.now() })
    )
    const error = await t
      .withIdentity({ subject: "owner" })
      .mutation(api.account.requestDeletion, {})
      .catch((cause: unknown) => cause)
    expect(deletionReason(error)).toBe("vault_closed")
  })
})

describe("carrying it out", () => {
  test("nothing happens before the due date; after it, everything goes", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const { file, attachment } = await fillVault(t, owner)
    await t
      .withIdentity({ subject: "owner" })
      .mutation(api.account.requestDeletion, {})

    await t.mutation(internal.account.sweep, {})
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect((await remaining(t, owner)).assets).toBe(1)

    vi.advanceTimersByTime(7 * DAY + 1000)
    await t.mutation(internal.account.sweep, {})
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    expect(await remaining(t, owner)).toEqual({
      user: false,
      assets: 0,
      executors: 0,
      keyring: 0,
      devices: 0,
      checkin: 0,
      lookup: 0,
      threads: 0,
      messages: 0,
      notes: 0,
    })
    expect(await t.run((ctx) => ctx.storage.getUrl(file))).toBeNull()
    expect(await t.run((ctx) => ctx.storage.getUrl(attachment))).toBeNull()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  test("a report filed during the grace period cancels it", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    const reporter = await addUser(t, "reporter")
    await fillVault(t, owner)
    await t
      .withIdentity({ subject: "owner" })
      .mutation(api.account.requestDeletion, {})
    await t.run((ctx) =>
      ctx.db.insert("claims", {
        subjectUserId: owner,
        claimantUserId: reporter,
        claimantName: "Reporter",
        claimantContact: "reporter@example.com",
        status: "submitted",
      })
    )

    vi.advanceTimersByTime(7 * DAY + 1000)
    await t.mutation(internal.account.sweep, {})
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const left = await remaining(t, owner)
    expect(left.user).toBe(true)
    expect(left.assets).toBe(1)
    const user = await t.run((ctx) => ctx.db.get("users", owner))
    expect(user?.deletionDueAt).toBeUndefined()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("a Clerk failure keeps the row and retries a bounded number of times", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    fetchMock.mockImplementation(
      async () => new Response(null, { status: 500 })
    )
    await t
      .withIdentity({ subject: "owner" })
      .mutation(api.account.requestDeletion, {})

    vi.advanceTimersByTime(7 * DAY + 1000)
    await t.mutation(internal.account.sweep, {})
    await t.finishAllScheduledFunctions(vi.runAllTimers)

    expect((await remaining(t, owner)).user).toBe(true)
    expect(fetchMock).toHaveBeenCalledTimes(24)
    fetchMock.mockImplementation(
      async () => new Response(null, { status: 200 })
    )
  })
})

describe("a Clerk-side deletion", () => {
  test("purges an ordinary account", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    await fillVault(t, owner)
    await t.mutation(internal.account.onClerkDeleted, { clerkUserId: "owner" })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    expect((await remaining(t, owner)).user).toBe(false)
    expect((await remaining(t, owner)).assets).toBe(0)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  test("keeps a released vault for its executors", async () => {
    const t = convexTest(schema, modules)
    const owner = await addUser(t, "owner")
    await fillVault(t, owner)
    await t.run((ctx) =>
      ctx.db.patch("users", owner, { vaultClosedAt: Date.now() })
    )
    await t.mutation(internal.account.onClerkDeleted, { clerkUserId: "owner" })
    await t.finishAllScheduledFunctions(vi.runAllTimers)
    const left = await remaining(t, owner)
    expect(left.user).toBe(true)
    expect(left.assets).toBe(1)
  })
})
