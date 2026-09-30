/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { ConvexError } from "convex/values"
import { describe, expect, test } from "vitest"

import { api } from "./_generated/api"
import { MAX_EXECUTORS } from "./model/entitlements"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

process.env.IDENTITY_HASH_SECRET = "test-identity-hash-secret-0123456789abcdef"

describe("an unlimited plan's executors", () => {
  test("every one is listed, up to the ceiling that no plan lifts", async () => {
    const t = convexTest(schema, modules)
    await t.run(async (ctx) => {
      const owner = await ctx.db.insert("users", {
        externalId: "owner",
        name: "owner",
        email: "owner@example.com",
        role: "owner",
        identityStatus: "verified",
        subscription: { plan: "annual", renewsAt: Date.now() + 300 * DAY },
      })
      for (let i = 0; i < MAX_EXECUTORS; i++) {
        await ctx.db.insert("executors", {
          userId: owner,
          name: `Executor ${i}`,
          phone: `+9665000000${String(i).padStart(2, "0")}`,
          idNumberHash: `hash-${i}`,
        })
      }
    })
    const as = t.withIdentity({ subject: "owner" })

    expect(await as.query(api.executors.list, {})).toHaveLength(MAX_EXECUTORS)

    const error = await as
      .mutation(api.executors.add, {
        name: "One more",
        phone: "+966511111111",
        idNumber: "1023456789",
      })
      .catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ConvexError)
    expect((error as ConvexError<{ code: string }>).data.code).toBe(
      "executor_cap"
    )
  })
})
