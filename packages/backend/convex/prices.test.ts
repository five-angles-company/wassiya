/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api, internal } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")

async function setup() {
  const t = convexTest(schema, modules)
  await t.run(async (ctx) => {
    await ctx.db.insert("users", {
      externalId: "billing-staff",
      name: "Billing",
      email: "billing@example.com",
      role: "admin",
      staffPermissions: ["billing.read", "billing.manage"],
    })
    await ctx.db.insert("users", {
      externalId: "reader-staff",
      name: "Reader",
      email: "reader@example.com",
      role: "admin",
      staffPermissions: ["billing.read"],
    })
    await ctx.db.insert("users", {
      externalId: "owner",
      name: "Owner",
      email: "owner@example.com",
    })
  })
  return t
}

const saudi = {
  plan: "annual" as const,
  market: "sa",
  currency: "sar",
  amountMinor: 37999,
  taxInclusive: true,
}

describe("plan prices", () => {
  test("billing.manage sets a price, and the website reads it", async () => {
    const t = await setup()
    await t.withIdentity({ subject: "billing-staff" }).mutation(api.prices.adminSet, saudi)

    const published = await t.query(api.plans.published, {})
    expect(published.prices).toEqual([
      { market: "SA", currency: "SAR", amountMinor: 37999, taxInclusive: true },
    ])

    const audit = await t.run((ctx) => ctx.db.query("auditLog").collect())
    expect(audit.map((row) => row.event)).toEqual(["billing.price_set"])
  })

  test("setting a country twice replaces its row", async () => {
    const t = await setup()
    const staff = t.withIdentity({ subject: "billing-staff" })
    await staff.mutation(api.prices.adminSet, saudi)
    await staff.mutation(api.prices.adminSet, { ...saudi, amountMinor: 39999 })

    const rows = await staff.query(api.prices.catalogue, { plan: "annual" })
    expect(rows).toHaveLength(1)
    expect(rows[0]!.amountMinor).toBe(39999)
  })

  test("only billing.manage writes, and no owner can", async () => {
    const t = await setup()
    await expect(
      t.withIdentity({ subject: "reader-staff" }).mutation(api.prices.adminSet, saudi)
    ).rejects.toThrow("billing.manage")
    await expect(
      t.withIdentity({ subject: "owner" }).mutation(api.prices.adminSet, saudi)
    ).rejects.toThrow("Not authorised")
    await expect(
      t.withIdentity({ subject: "owner" }).query(api.prices.catalogue, { plan: "annual" })
    ).rejects.toThrow("Not authorised")
  })

  test("a price is refused for the free plan and for malformed input", async () => {
    const t = await setup()
    const staff = t.withIdentity({ subject: "billing-staff" })
    await expect(staff.mutation(api.prices.adminSet, { ...saudi, plan: "free" })).rejects.toThrow()
    await expect(staff.mutation(api.prices.adminSet, { ...saudi, market: "SAU" })).rejects.toThrow()
    await expect(staff.mutation(api.prices.adminSet, { ...saudi, currency: "RIYAL" })).rejects.toThrow()
    await expect(staff.mutation(api.prices.adminSet, { ...saudi, amountMinor: 379.99 })).rejects.toThrow()
    await expect(staff.mutation(api.prices.adminSet, { ...saudi, amountMinor: 0 })).rejects.toThrow()
  })

  test("removing a country drops its row and is audited", async () => {
    const t = await setup()
    const staff = t.withIdentity({ subject: "billing-staff" })
    await staff.mutation(api.prices.adminSet, saudi)
    await staff.mutation(api.prices.adminRemove, { plan: "annual", market: "SA" })

    const published = await t.query(api.plans.published, {})
    expect(published.prices).toEqual([])
    const audit = await t.run((ctx) => ctx.db.query("auditLog").collect())
    expect(audit.map((row) => row.event)).toEqual(["billing.price_set", "billing.price_removed"])
  })

  test("the preview seed fills gaps and never overwrites a set price", async () => {
    const t = await setup()
    await t.withIdentity({ subject: "billing-staff" }).mutation(api.prices.adminSet, {
      ...saudi,
      amountMinor: 41999,
    })

    expect(await t.mutation(internal.prices.seedPreview, {})).toEqual({ added: 2 })
    expect(await t.mutation(internal.prices.seedPreview, {})).toEqual({ added: 0 })

    const published = await t.query(api.plans.published, {})
    const sa = published.prices.find((price) => price.market === "SA")
    expect(sa?.amountMinor).toBe(41999)
    expect(published.prices.map((price) => price.market).sort()).toEqual(["*", "AE", "SA"])
  })
})
