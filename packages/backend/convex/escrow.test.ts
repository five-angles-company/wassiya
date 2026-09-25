/// <reference types="vite/client" />
import { bytesToHex, utf8ToBytes } from "@workspace/crypto/bytes"
import { sealForEscrow } from "@workspace/crypto/escrow"
import { generateDek } from "@workspace/crypto/keys"
import { openLabel, sealLabel } from "@workspace/crypto/label"
import { generateSealKeypair } from "@workspace/crypto/seal"
import { openSecret, sealSecret } from "@workspace/crypto/secret"
import { convexTest } from "convex-test"
import { beforeEach, describe, expect, test } from "vitest"

import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

const escrow = generateSealKeypair()

/**
 * `v.bytes()` is an `ArrayBuffer`. A copy, because the crypto package builds
 * its outputs with `subarray` and the view's buffer can be larger than it.
 */
function toBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer
}

beforeEach(() => {
  process.env.ESCROW_KEY_ID = "test-1"
  process.env.ESCROW_PRIVATE_KEY = bytesToHex(escrow.secretKey)
})

type Fixture = {
  t: ReturnType<typeof convexTest>
  ownerId: Id<"users">
  heirId: Id<"heirs">
  otherHeirId: Id<"heirs">
  deliveryId: Id<"deliveries">
}

async function addUser(t: Fixture["t"], externalId: string) {
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

/** An owner, two heirs, and a released report with one ready delivery for "heir". */
async function released(): Promise<Fixture> {
  const t = convexTest(schema, modules)
  const ownerId = await addUser(t, "owner")
  const heirUserId = await addUser(t, "heir")
  await addUser(t, "stranger")

  const ids = await t.run(async (ctx) => {
    const heir = { userId: ownerId, relation: "son", phone: "+966500000000" }
    const heirId = await ctx.db.insert("heirs", {
      ...heir,
      name: "Heir",
      mode: "silent",
      inviteStatus: "none",
    })
    const otherHeirId = await ctx.db.insert("heirs", {
      ...heir,
      name: "Other",
      mode: "silent",
      inviteStatus: "none",
    })
    const claimId = await ctx.db.insert("claims", {
      subjectUserId: ownerId,
      claimantName: "Reporter",
      claimantContact: "reporter@example.com",
      nameMatch: true,
      status: "released",
    })
    const deliveryId = await ctx.db.insert("deliveries", {
      claimId,
      subjectUserId: ownerId,
      heirId,
      status: "ready",
      contactToken: "token",
      heirUserId,
      expiresAt: Date.now() + 365 * DAY,
    })
    return { heirId, otherHeirId, deliveryId }
  })
  return { t, ownerId, ...ids }
}

/** An asset saved and routed exactly as the owner's phone does it. */
async function routedAsset(
  f: Fixture,
  title: string,
  recipient: { kind: "heir"; heirId: Id<"heirs"> } | { kind: "allHeirs" }
): Promise<{ assetId: Id<"assets">; dek: Uint8Array }> {
  const dek = generateDek()
  const assetId = await f.t.run((ctx) =>
    ctx.db.insert("assets", {
      userId: f.ownerId,
      type: "crypto",
      labelSealed: toBuffer(sealLabel({ title }, dek)),
      secretSealed: toBuffer(sealSecret(`{"phrase":"${title}"}`, dek)),
      meta: {},
      dekWrappedByMk: new ArrayBuffer(72),
      files: [],
      recipientRule: "default",
    })
  )
  const sealed = sealForEscrow(dek, escrow.publicKey, {
    ownerId: f.ownerId,
    assetId,
  })
  await f.t.withIdentity({ subject: "owner" }).mutation(api.routing.setRecipients, {
    assetId,
    recipients: [{ recipient }],
    escrowedDek: toBuffer(sealed),
    escrowKeyId: "test-1",
  })
  return { assetId, dek }
}

describe("escrow.openDelivery", () => {
  test("hands the bound heir their items with keys that open them", async () => {
    const f = await released()
    const mine = await routedAsset(f, "wallet", { kind: "heir", heirId: f.heirId })
    const shared = await routedAsset(f, "deed", { kind: "allHeirs" })

    const opened = await f.t
      .withIdentity({ subject: "heir" })
      .mutation(api.escrow.openDelivery, { deliveryId: f.deliveryId })

    expect(opened.items.map((item) => item.assetId).sort()).toEqual(
      [mine.assetId, shared.assetId].sort()
    )
    for (const item of opened.items) {
      expect(item.dek).not.toBeNull()
      const dek = new Uint8Array(item.dek!)
      const title = openLabel(new Uint8Array(item.labelSealed), dek).title
      expect(openSecret(new Uint8Array(item.secretSealed!), dek)).toBe(
        `{"phrase":"${title}"}`
      )
    }
  })

  test("never includes an item routed to another heir", async () => {
    const f = await released()
    await routedAsset(f, "not yours", { kind: "heir", heirId: f.otherHeirId })

    const opened = await f.t
      .withIdentity({ subject: "heir" })
      .mutation(api.escrow.openDelivery, { deliveryId: f.deliveryId })
    expect(opened.items).toEqual([])
  })

  test("refuses anyone but the bound heir, and the owner too", async () => {
    const f = await released()
    await routedAsset(f, "wallet", { kind: "heir", heirId: f.heirId })

    for (const subject of ["stranger", "owner"]) {
      await expect(
        f.t
          .withIdentity({ subject })
          .mutation(api.escrow.openDelivery, { deliveryId: f.deliveryId })
      ).rejects.toThrow(/Not found/)
    }
  })

  test("refuses before the report is released", async () => {
    const f = await released()
    await f.t.run(async (ctx) => {
      const delivery = await ctx.db.get("deliveries", f.deliveryId)
      await ctx.db.patch("claims", delivery!.claimId, { status: "awaiting_veto" })
    })
    await expect(
      f.t
        .withIdentity({ subject: "heir" })
        .mutation(api.escrow.openDelivery, { deliveryId: f.deliveryId })
    ).rejects.toThrow(/Not found/)
  })

  test("does not open a sealed key copied onto another asset", async () => {
    const f = await released()
    const original = await routedAsset(f, "wallet", { kind: "heir", heirId: f.heirId })
    const copy = await routedAsset(f, "copy", { kind: "heir", heirId: f.heirId })
    await f.t.run(async (ctx) => {
      const source = await ctx.db.get("assets", original.assetId)
      await ctx.db.patch("assets", copy.assetId, { escrowedDek: source!.escrowedDek })
    })

    const opened = await f.t
      .withIdentity({ subject: "heir" })
      .mutation(api.escrow.openDelivery, { deliveryId: f.deliveryId })
    const copied = opened.items.find((item) => item.assetId === copy.assetId)
    expect(copied?.dek).toBeNull()
  })

  test("unrouting an asset deletes its escrowed key", async () => {
    const f = await released()
    const { assetId } = await routedAsset(f, "wallet", { kind: "heir", heirId: f.heirId })
    await f.t
      .withIdentity({ subject: "owner" })
      .mutation(api.routing.setRecipients, { assetId, recipients: [] })

    const asset = await f.t.run((ctx) => ctx.db.get("assets", assetId))
    expect(asset?.escrowedDek).toBeUndefined()
    expect(asset?.recipientRule).toBe("default")
  })

  test("routing refuses a key sealed to another escrow key id", async () => {
    const f = await released()
    const assetId = await f.t.run((ctx) =>
      ctx.db.insert("assets", {
        userId: f.ownerId,
        type: "note",
        labelSealed: toBuffer(utf8ToBytes("x")),
        meta: {},
        dekWrappedByMk: new ArrayBuffer(72),
        files: [],
        recipientRule: "default",
      })
    )
    await expect(
      f.t.withIdentity({ subject: "owner" }).mutation(api.routing.setRecipients, {
        assetId,
        recipients: [{ recipient: { kind: "allHeirs" } }],
        escrowedDek: new ArrayBuffer(104),
        escrowKeyId: "retired",
      })
    ).rejects.toThrow(/escrow key/)
  })
})
