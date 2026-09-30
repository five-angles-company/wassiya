/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { ConvexError } from "convex/values"
import { describe, expect, test } from "vitest"

import { api } from "./_generated/api"
import { MAX_ASSETS } from "./model/entitlements"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

describe("an unlimited plan's assets", () => {
  test("the owner's list holds every one, up to the ceiling that no plan lifts", async () => {
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
      const bytes = new ArrayBuffer(8)
      for (let i = 0; i < MAX_ASSETS; i++) {
        await ctx.db.insert("assets", {
          userId: owner,
          type: "note",
          labelSealed: bytes,
          meta: {},
          dekWrappedByMk: bytes,
          files: [],
        })
      }
    })
    const as = t.withIdentity({ subject: "owner" })

    expect(await as.query(api.assets.list, {})).toHaveLength(MAX_ASSETS)

    const error = await as
      .mutation(api.assets.create, {
        type: "note",
        labelSealed: new ArrayBuffer(8),
        secretSealed: new ArrayBuffer(8),
        meta: {},
        dekWrappedByMk: new ArrayBuffer(8),
        files: [],
      })
      .catch((cause: unknown) => cause)
    expect(error).toBeInstanceOf(ConvexError)
    expect((error as ConvexError<{ code: string }>).data.code).toBe("asset_cap")
  })
})
