/// <reference types="vite/client" />
import {
  generateDek,
  generateMk,
  generateReleaseKey,
  openLabel,
  randomBytes,
  recoverMk,
  sealLabel,
  splitRecovery,
  unwrapDekFromHandover,
  unwrapReleaseKeyForExecutor,
  unwrapReleaseKeyForOwner,
  wrap,
  wrapDekForHandover,
  wrapReleaseKeyForExecutor,
  wrapReleaseKeyForOwner,
} from "@workspace/crypto"
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { api } from "./_generated/api"
import type { Doc, Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

const buffer = (bytes: Uint8Array): ArrayBuffer =>
  bytes.slice().buffer as ArrayBuffer

const person = (externalId: string) => ({
  externalId,
  name: externalId,
  email: `${externalId}@example.com`,
  role: "owner" as const,
  identityStatus: "verified" as const,
})

/**
 * What the owner's phone builds, stored the way the backend stores it: one
 * asset handed over, one kept private, one executor holding a printed sheet.
 */
async function releasedVault(
  delivery: Partial<Doc<"deliveries">> = {},
  executorUser: { identityStatus?: Doc<"users">["identityStatus"] } = {}
) {
  const t = convexTest(schema, modules)
  const mk = generateMk()
  const releaseKey = generateReleaseKey()
  const sheetSecret = randomBytes(32)
  // Kept out of `t.run`'s return value, which must be a Convex value.
  let sPaper: Uint8Array = new Uint8Array()

  const ids = await t.run(async (ctx) => {
    const ownerId = await ctx.db.insert("users", {
      ...person("owner"),
      vaultClosedAt: Date.now(),
    })
    const executorUserId = await ctx.db.insert("users", {
      ...person("executor"),
      ...executorUser,
    })
    await ctx.db.insert("users", person("stranger"))

    const recovery = splitRecovery(mk, ownerId, 1)
    sPaper = recovery.sPaper
    await ctx.db.insert("keyring", {
      userId: ownerId,
      mkWrappedByRecovery: buffer(recovery.mkWrappedByRecovery),
      paperVersion: 1,
      wrapperVersion: 2,
      releaseKeyWrappedByMk: buffer(
        wrapReleaseKeyForOwner(releaseKey, mk, ownerId)
      ),
      rotatedAt: Date.now(),
    })

    const assetIds: Id<"assets">[] = []
    for (const [title, handedOver] of [
      ["Handed over", true],
      ["Private", false],
    ] as const) {
      const dek = generateDek()
      const assetId = await ctx.db.insert("assets", {
        userId: ownerId,
        type: "note",
        labelSealed: buffer(sealLabel({ title }, dek)),
        meta: {},
        dekWrappedByMk: buffer(wrap(dek, mk)),
        files: [],
      })
      if (handedOver) {
        await ctx.db.patch("assets", assetId, {
          dekWrappedByRelease: buffer(
            wrapDekForHandover(dek, releaseKey, { ownerId, assetId })
          ),
        })
      }
      assetIds.push(assetId)
    }

    const executorId = await ctx.db.insert("executors", {
      userId: ownerId,
      name: "Executor",
      phone: "+966500000000",
      idNumberHash: "0".repeat(64),
    })
    await ctx.db.patch("executors", executorId, {
      sheet: {
        releaseKeyWrapped: buffer(
          wrapReleaseKeyForExecutor(releaseKey, sheetSecret, {
            ownerId,
            executorId,
            sheetVersion: 1,
          })
        ),
        version: 1,
        printedAt: Date.now(),
      },
    })

    const claimId = await ctx.db.insert("claims", {
      subjectUserId: ownerId,
      claimantName: "Reporter",
      claimantContact: "reporter@example.com",
      nameMatch: true,
      status: "released",
      releasedAt: Date.now(),
    })
    const deliveryId = await ctx.db.insert("deliveries", {
      claimId,
      subjectUserId: ownerId,
      executorId,
      status: "ready",
      contactToken: "token",
      executorUserId,
      expiresAt: Date.now() + 365 * DAY,
      ...delivery,
    })
    return { ownerId, executorId, deliveryId, assetIds }
  })

  return { t, sheetSecret, sPaper, ...ids }
}

describe("handover.open", () => {
  test("the bound, verified executor opens only what was handed over", async () => {
    const { t, sheetSecret, ownerId, executorId, deliveryId, assetIds } =
      await releasedVault()

    const opened = await t
      .withIdentity({ subject: "executor" })
      .mutation(api.handover.open, { deliveryId })

    expect(opened.items.map((item) => item.assetId)).toEqual([assetIds[0]])
    expect(opened.sheet?.version).toBe(1)

    // What the executor's browser does with it.
    const releaseKey = unwrapReleaseKeyForExecutor(
      new Uint8Array(opened.sheet!.releaseKeyWrapped),
      sheetSecret,
      { ownerId, executorId, sheetVersion: opened.sheet!.version }
    )
    const item = opened.items[0]!
    const dek = unwrapDekFromHandover(
      new Uint8Array(item.dekWrappedByRelease),
      releaseKey,
      { ownerId, assetId: item.assetId }
    )
    expect(openLabel(new Uint8Array(item.labelSealed), dek).title).toBe(
      "Handed over"
    )

    const audit = await t.run((ctx) =>
      ctx.db
        .query("auditLog")
        .withIndex("by_userId_and_at", (q) => q.eq("userId", ownerId))
        .collect()
    )
    expect(audit.map((row) => row.event)).toContain("release.delivery_opened")
  })

  test("the owner's recovery sheet stands in for a lost executor sheet", async () => {
    const { t, ownerId, deliveryId, sPaper } = await releasedVault()

    const opened = await t
      .withIdentity({ subject: "executor" })
      .mutation(api.handover.open, { deliveryId })
    const fallback = opened.fallback!

    const mk = recoverMk(
      sPaper,
      new Uint8Array(fallback.mkWrappedByRecovery),
      ownerId,
      fallback.paperVersion
    )
    const releaseKey = unwrapReleaseKeyForOwner(
      new Uint8Array(fallback.releaseKeyWrappedByMk),
      mk,
      ownerId
    )
    const item = opened.items[0]!
    const dek = unwrapDekFromHandover(
      new Uint8Array(item.dekWrappedByRelease),
      releaseKey,
      { ownerId, assetId: item.assetId }
    )
    expect(openLabel(new Uint8Array(item.labelSealed), dek).title).toBe(
      "Handed over"
    )
  })

  test("anyone else, or any unmet gate, gets the same refusal", async () => {
    const stranger = await releasedVault()
    await expect(
      stranger.t
        .withIdentity({ subject: "stranger" })
        .mutation(api.handover.open, { deliveryId: stranger.deliveryId })
    ).rejects.toThrow("Not found")

    for (const [delivery, executorUser] of [
      [{ status: "identity_pending" }, {}],
      [{ expiresAt: Date.now() - 1 }, {}],
      [{ destroyedAt: Date.now() }, {}],
      [{}, { identityStatus: "pending" }],
    ] as const) {
      const { t, deliveryId } = await releasedVault(delivery, executorUser)
      await expect(
        t
          .withIdentity({ subject: "executor" })
          .mutation(api.handover.open, { deliveryId })
      ).rejects.toThrow("Not found")
    }
  })
})
