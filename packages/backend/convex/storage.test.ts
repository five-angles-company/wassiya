/// <reference types="vite/client" />
import rateLimiter from "@convex-dev/rate-limiter/test"
import { convexTest } from "convex-test"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { api, internal } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

type Test = ReturnType<typeof convexTest>

/** convex-test records no content type on a stored blob, so the test sets the one each client sends. */
async function upload(t: Test, contentType: string): Promise<Id<"_storage">> {
  return await t.run(async (ctx) => {
    const storageId = await ctx.storage.store(new Blob([new Uint8Array(8)]))
    const db = ctx.db as unknown as {
      patch: (table: string, id: string, value: object) => Promise<void>
    }
    await db.patch("_storage", storageId, { contentType })
    return storageId
  })
}

const exists = (t: Test, storageId: Id<"_storage">) =>
  t.run(async (ctx) => (await ctx.db.system.get("_storage", storageId)) !== null)

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe("the orphan sweep", () => {
  test("deletes an upload nothing took, two days on, and nothing any row holds", async () => {
    const t = convexTest(schema, modules)
    rateLimiter.register(t)
    const beforeFirstRun = await upload(t, "application/octet-stream")
    vi.advanceTimersByTime(1000)
    await t.mutation(internal.storage.sweep, {})
    vi.advanceTimersByTime(1000)

    const claimId = await t.run(async (ctx) => {
      const owner = await ctx.db.insert("users", {
        externalId: "owner",
        name: "owner",
        email: "owner@example.com",
        role: "owner",
        identityStatus: "verified",
      })
      await ctx.db.insert("keyring", {
        userId: owner,
        mkWrappedByRecovery: new ArrayBuffer(72),
        paperVersion: 1,
        rotatedAt: Date.now(),
      })
      const reporter = await ctx.db.insert("users", {
        externalId: "reporter",
        name: "reporter",
        email: "reporter@example.com",
        role: "owner",
      })
      return await ctx.db.insert("claims", {
        subjectUserId: owner,
        claimantUserId: reporter,
        claimantName: "Reporter",
        claimantContact: "reporter@example.com",
        status: "submitted",
      })
    })
    const vaultFile = await upload(t, "application/octet-stream")
    const certificate = await upload(t, "application/pdf")
    const attachment = await upload(t, "image/png")
    const orphan = await upload(t, "application/octet-stream")

    await t.withIdentity({ subject: "owner" }).mutation(api.assets.create, {
      type: "document",
      labelSealed: new ArrayBuffer(8),
      meta: {},
      dekWrappedByMk: new ArrayBuffer(8),
      files: [{ storageId: vaultFile }],
    })
    await t
      .withIdentity({ subject: "reporter" })
      .mutation(api.claims.attachCertificate, {
        claimId,
        certificateStorageId: certificate,
      })
    await t.withIdentity({ subject: "owner" }).mutation(api.support.threads.start, {
      surface: "mobile",
      topic: "other",
      locale: "ar",
      body: "مرحباً",
      attachments: [{ storageId: attachment, name: "screen.png" }],
    })

    vi.advanceTimersByTime(DAY)
    await t.mutation(internal.storage.sweep, {})
    expect(await exists(t, orphan)).toBe(true)

    vi.advanceTimersByTime(DAY + 60_000)
    await t.mutation(internal.storage.sweep, {})
    expect(await exists(t, orphan)).toBe(false)
    for (const held of [vaultFile, certificate, attachment, beforeFirstRun]) {
      expect(await exists(t, held)).toBe(true)
    }

    const runs = await t.run((ctx) =>
      ctx.db
        .query("jobRuns")
        .withIndex("by_name_and_ranAt", (q) => q.eq("name", "storage.sweep"))
        .collect()
    )
    expect(runs.map((run) => run.changed)).toEqual([0, 0, 1])
  })
})
