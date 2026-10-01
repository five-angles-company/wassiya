/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { ConvexError } from "convex/values"
import { afterEach, describe, expect, test, vi } from "vitest"

import { api } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import { VAULT_BLOB_TYPE } from "./model/assetFiles"
import { MAX_ASSETS } from "./model/entitlements"
import { JOIN_WINDOW_MS } from "./model/storage"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")
const DAY = 24 * 60 * 60 * 1000

type Test = ReturnType<typeof convexTest>

async function seedOwner(
  t: Test,
  externalId: string,
  { vault = true, limitsOverride = {} } = {}
): Promise<Id<"users">> {
  return await t.run(async (ctx) => {
    const owner = await ctx.db.insert("users", {
      externalId,
      name: externalId,
      email: `${externalId}@example.com`,
      role: "owner",
      identityStatus: "verified",
      subscription: { plan: "annual", renewsAt: Date.now() + 300 * DAY },
      limitsOverride,
    })
    if (vault) {
      await ctx.db.insert("keyring", {
        userId: owner,
        mkWrappedByRecovery: new ArrayBuffer(72),
        paperVersion: 1,
        rotatedAt: Date.now(),
      })
    }
    return owner
  })
}

/** convex-test records no content type on a stored blob, so the test sets the one the phone sends. */
async function upload(
  t: Test,
  bytes: number,
  contentType = VAULT_BLOB_TYPE
): Promise<Id<"_storage">> {
  return await t.run(async (ctx) => {
    const storageId = await ctx.storage.store(new Blob([new Uint8Array(bytes)]))
    const db = ctx.db as unknown as {
      patch: (table: string, id: string, value: object) => Promise<void>
    }
    await db.patch("_storage", storageId, { contentType })
    return storageId
  })
}

function newAsset(files: { storageId: Id<"_storage">; thumbnailId?: Id<"_storage"> }[]) {
  return {
    type: "document" as const,
    labelSealed: new ArrayBuffer(8),
    meta: { itemCount: files.length, byteSize: 0, mimeType: "application/pdf" },
    dekWrappedByMk: new ArrayBuffer(8),
    files,
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe("an unlimited plan's assets", () => {
  test("the owner's list holds every one, up to the ceiling that no plan lifts", async () => {
    const t = convexTest(schema, modules)
    const owner = await seedOwner(t, "owner")
    await t.run(async (ctx) => {
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

describe("what the vault accepts", () => {
  test("an account with no vault can neither upload nor add", async () => {
    const t = convexTest(schema, modules)
    await seedOwner(t, "stranger", { vault: false })
    const storageId = await upload(t, 16)
    const as = t.withIdentity({ subject: "stranger" })

    await expect(as.mutation(api.assets.generateUploadUrl, {})).rejects.toThrow(
      "Set up the vault"
    )
    await expect(
      as.mutation(api.assets.create, newAsset([{ storageId }]))
    ).rejects.toThrow("Set up the vault")
  })

  test("a file must be opaque: a readable upload is refused", async () => {
    const t = convexTest(schema, modules)
    await seedOwner(t, "owner")
    const as = t.withIdentity({ subject: "owner" })

    for (const contentType of ["image/png", "text/html", "application/pdf"]) {
      const storageId = await upload(t, 16, contentType)
      await expect(
        as.mutation(api.assets.create, newAsset([{ storageId }]))
      ).rejects.toThrow("File not accepted")
    }
  })

  test("the size is measured from storage, whatever the phone reports", async () => {
    const t = convexTest(schema, modules)
    const owner = await seedOwner(t, "owner")
    const storageId = await upload(t, 1000)
    const thumbnailId = await upload(t, 24)
    const as = t.withIdentity({ subject: "owner" })

    const assetId = await as.mutation(
      api.assets.create,
      newAsset([{ storageId, thumbnailId }])
    )

    await t.run(async (ctx) => {
      expect((await ctx.db.get("assets", assetId))?.meta.byteSize).toBe(1024)
      expect((await ctx.db.get("users", owner))?.storageBytesUsed).toBe(1024)
    })
  })

  test("a quota the phone cannot talk its way past", async () => {
    const t = convexTest(schema, modules)
    await seedOwner(t, "owner", { limitsOverride: { maxFileBytes: 500 } })
    const storageId = await upload(t, 1000)
    const as = t.withIdentity({ subject: "owner" })

    const error = await as
      .mutation(api.assets.create, newAsset([{ storageId }]))
      .catch((cause: unknown) => cause)
    expect((error as ConvexError<{ limit: string }>).data.limit).toBe("fileSize")
  })

  test("a file named twice is refused", async () => {
    const t = convexTest(schema, modules)
    await seedOwner(t, "owner")
    const storageId = await upload(t, 16)
    const as = t.withIdentity({ subject: "owner" })

    await expect(
      as.mutation(api.assets.create, newAsset([{ storageId }, { storageId }]))
    ).rejects.toThrow("File not accepted")
  })

  test("an old upload cannot join a row, but the row keeps its own files", async () => {
    vi.useFakeTimers()
    const t = convexTest(schema, modules)
    await seedOwner(t, "victim")
    await seedOwner(t, "owner")
    const victimFile = await upload(t, 16)
    const ownFile = await upload(t, 32)
    const assetId = await t
      .withIdentity({ subject: "owner" })
      .mutation(api.assets.create, newAsset([{ storageId: ownFile }]))
    await t
      .withIdentity({ subject: "victim" })
      .mutation(api.assets.create, newAsset([{ storageId: victimFile }]))

    vi.setSystemTime(Date.now() + JOIN_WINDOW_MS + 1)
    const as = t.withIdentity({ subject: "owner" })

    await expect(
      as.mutation(api.assets.create, newAsset([{ storageId: victimFile }]))
    ).rejects.toThrow("File not accepted")
    await expect(
      as.mutation(api.assets.update, {
        assetId,
        files: [{ storageId: ownFile }, { storageId: victimFile }],
      })
    ).rejects.toThrow("File not accepted")

    const added = await upload(t, 8)
    await as.mutation(api.assets.update, {
      assetId,
      files: [{ storageId: ownFile }, { storageId: added }],
    })
    await t.run(async (ctx) => {
      expect((await ctx.db.get("assets", assetId))?.meta.byteSize).toBe(40)
      expect(await ctx.db.system.get("_storage", victimFile)).not.toBeNull()
    })
  })

  test("an edit that sends no files keeps the measured size", async () => {
    const t = convexTest(schema, modules)
    const owner = await seedOwner(t, "owner")
    const storageId = await upload(t, 64)
    const as = t.withIdentity({ subject: "owner" })
    const assetId = await as.mutation(api.assets.create, newAsset([{ storageId }]))

    await as.mutation(api.assets.update, {
      assetId,
      labelSealed: new ArrayBuffer(8),
      meta: { itemCount: 1, byteSize: 0, mimeType: "application/pdf" },
    })

    await t.run(async (ctx) => {
      expect((await ctx.db.get("assets", assetId))?.meta.byteSize).toBe(64)
      expect((await ctx.db.get("users", owner))?.storageBytesUsed).toBe(64)
    })
  })

  test("a file one asset holds cannot join another", async () => {
    const t = convexTest(schema, modules)
    await seedOwner(t, "owner")
    const storageId = await upload(t, 16)
    const as = t.withIdentity({ subject: "owner" })
    await as.mutation(api.assets.create, newAsset([{ storageId }]))

    await expect(
      as.mutation(api.assets.create, newAsset([{ storageId }]))
    ).rejects.toThrow("File not accepted")
  })

  test("removing an asset deletes its files and their holds", async () => {
    const t = convexTest(schema, modules)
    await seedOwner(t, "owner")
    const storageId = await upload(t, 16)
    const thumbnailId = await upload(t, 4)
    const as = t.withIdentity({ subject: "owner" })
    const assetId = await as.mutation(
      api.assets.create,
      newAsset([{ storageId, thumbnailId }])
    )
    expect(await t.run((ctx) => ctx.db.query("storageRefs").collect())).toHaveLength(2)

    await as.mutation(api.assets.remove, { assetId })

    await t.run(async (ctx) => {
      expect(await ctx.db.system.get("_storage", storageId)).toBeNull()
      expect(await ctx.db.system.get("_storage", thumbnailId)).toBeNull()
      expect(await ctx.db.query("storageRefs").collect()).toHaveLength(0)
    })
  })
})

describe("a closed vault", () => {
  test("takes no upload, and no asset is added, changed, handed over or removed", async () => {
    const t = convexTest(schema, modules)
    const owner = await seedOwner(t, "owner")
    const storageId = await upload(t, 16)
    const as = t.withIdentity({ subject: "owner" })
    const assetId = await as.mutation(api.assets.create, newAsset([{ storageId }]))
    await t.run((ctx) =>
      ctx.db.patch("users", owner, { vaultClosedAt: Date.now() })
    )

    const closed = "closed after a verified death"
    await expect(as.mutation(api.assets.generateUploadUrl, {})).rejects.toThrow(closed)
    await expect(
      as.mutation(api.assets.create, {
        ...newAsset([]),
        secretSealed: new ArrayBuffer(8),
      })
    ).rejects.toThrow(closed)
    await expect(
      as.mutation(api.assets.update, { assetId, labelSealed: new ArrayBuffer(8) })
    ).rejects.toThrow(closed)
    await expect(
      as.mutation(api.assets.setHandover, {
        assetId,
        dekWrappedByRelease: new ArrayBuffer(72),
      })
    ).rejects.toThrow(closed)
    await expect(as.mutation(api.assets.remove, { assetId })).rejects.toThrow(closed)
  })
})

describe("a lapsed subscription freezes the vault as it stands", () => {
  async function lapsedWithAsset() {
    const t = convexTest(schema, modules)
    const owner = await seedOwner(t, "owner")
    const as = t.withIdentity({ subject: "owner" })
    const assetId = await as.mutation(api.assets.create, {
      ...newAsset([]),
      secretSealed: new ArrayBuffer(8),
    })
    await t.run(async (ctx) => {
      await ctx.db.patch("users", owner, {
        subscription: { plan: "annual", renewsAt: Date.now() - DAY },
      })
    })
    return { t, as, assetId }
  }

  test("adding, editing the contents and handing over are refused", async () => {
    const { as, assetId } = await lapsedWithAsset()
    await expect(
      as.mutation(api.assets.create, { ...newAsset([]), secretSealed: new ArrayBuffer(8) })
    ).rejects.toThrow("Subscription lapsed")
    await expect(
      as.mutation(api.assets.update, { assetId, labelSealed: new ArrayBuffer(8) })
    ).rejects.toThrow("Subscription lapsed")
    await expect(
      as.mutation(api.assets.update, { assetId, secretSealed: new ArrayBuffer(8) })
    ).rejects.toThrow("Subscription lapsed")
    await expect(
      as.mutation(api.assets.setHandover, { assetId, dekWrappedByRelease: new ArrayBuffer(72) })
    ).rejects.toThrow("Subscription lapsed")
  })

  test("re-wrapping, making private, reading and deleting stay open", async () => {
    const { as, assetId } = await lapsedWithAsset()
    await as.mutation(api.assets.update, { assetId, dekWrappedByMk: new ArrayBuffer(8) })
    await as.mutation(api.assets.setHandover, { assetId })
    expect(await as.query(api.assets.get, { assetId })).not.toBeNull()
    await as.mutation(api.assets.remove, { assetId })
    expect(await as.query(api.assets.get, { assetId })).toBeNull()
  })
})
