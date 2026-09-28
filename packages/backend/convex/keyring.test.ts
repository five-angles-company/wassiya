/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")

async function setup() {
  const t = convexTest(schema, modules)
  const owner = await t.run((ctx) =>
    ctx.db.insert("users", {
      externalId: "owner",
      name: "owner",
      email: "owner@example.com",
      role: "owner",
      identityStatus: "verified",
    })
  )
  return { t, owner, as: t.withIdentity({ subject: "owner" }) }
}

describe("the recovery sheet", () => {
  test("a sheet is saved only once it is in hand, and lands printed", async () => {
    const { as } = await setup()
    await as.mutation(api.keyring.save, {
      mkWrappedByRecovery: new ArrayBuffer(8),
      paperVersion: 1,
      rotatingPaper: true,
      printed: true,
    })
    const first = await as.query(api.keyring.get, {})
    expect(first?.paperPrintedAt).not.toBeNull()

    await as.mutation(api.keyring.save, {
      mkWrappedByRecovery: new ArrayBuffer(8),
      paperVersion: 2,
      rotatingPaper: true,
      printed: true,
    })
    const second = await as.query(api.keyring.get, {})
    expect(second?.paperVersion).toBe(2)
    expect(second?.paperPrintedAt).not.toBeNull()
    expect(second?.paperUsedAt).toBeNull()
  })

  test("using it lists the phone in devices in the same act as the alarm", async () => {
    const { t, owner, as } = await setup()
    await as.mutation(api.keyring.save, {
      mkWrappedByRecovery: new ArrayBuffer(8),
      paperVersion: 1,
      rotatingPaper: true,
      printed: true,
    })

    const { deviceId } = await as.mutation(api.keyring.markPaperUsed, {
      device: { installId: "recovered-phone", name: "iPhone", platform: "ios" },
    })

    const devices = await as.query(api.devices.list, {})
    expect(devices.map((row) => row.id)).toEqual([deviceId])
    const kinds = await t.run(async (ctx) =>
      (
        await ctx.db
          .query("notifications")
          .withIndex("by_userId", (q) => q.eq("userId", owner))
          .collect()
      ).map((row) => row.kind)
    )
    expect(kinds).toEqual(["recovery.attempted"])
    expect((await as.query(api.keyring.get, {}))?.paperUsedAt).not.toBeNull()
  })
})
