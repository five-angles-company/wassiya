import { describe, expect, it } from "vitest"

import { generateDek, generateMk } from "./keys"
import {
  generateReleaseKey,
  unwrapDekFromHandover,
  unwrapReleaseKeyForExecutor,
  unwrapReleaseKeyForOwner,
  wrapDekForHandover,
  wrapReleaseKeyForExecutor,
  wrapReleaseKeyForOwner,
} from "./release"

const same = (a: Uint8Array, b: Uint8Array) =>
  expect(Array.from(a)).toEqual(Array.from(b))

describe("the handover", () => {
  const owner = "owner_1"
  const asset = { ownerId: owner, assetId: "asset_1" }
  const sheet = { ownerId: owner, executorId: "executor_1", sheetVersion: 1 }

  it("reaches a handed-over DEK from an executor sheet", () => {
    const releaseKey = generateReleaseKey()
    const sheetSecret = generateReleaseKey()
    const dek = generateDek()

    const forExecutor = wrapReleaseKeyForExecutor(releaseKey, sheetSecret, sheet)
    const forAsset = wrapDekForHandover(dek, releaseKey, asset)

    const opened = unwrapReleaseKeyForExecutor(forExecutor, sheetSecret, sheet)
    same(unwrapDekFromHandover(forAsset, opened, asset), dek)
  })

  it("reaches it from the owner's MK too — the fallback after death", () => {
    const mk = generateMk()
    const releaseKey = generateReleaseKey()
    const dek = generateDek()
    const owned = wrapReleaseKeyForOwner(releaseKey, mk, owner)
    const forAsset = wrapDekForHandover(dek, releaseKey, asset)

    const opened = unwrapReleaseKeyForOwner(owned, mk, owner)
    same(unwrapDekFromHandover(forAsset, opened, asset), dek)
  })

  it("does not open a sheet wrapper for another executor, owner or version", () => {
    const releaseKey = generateReleaseKey()
    const sheetSecret = generateReleaseKey()
    const wrapped = wrapReleaseKeyForExecutor(releaseKey, sheetSecret, sheet)

    for (const other of [
      { ...sheet, executorId: "executor_2" },
      { ...sheet, ownerId: "owner_2" },
      { ...sheet, sheetVersion: 2 },
    ]) {
      expect(() => unwrapReleaseKeyForExecutor(wrapped, sheetSecret, other)).toThrow()
    }
    expect(() =>
      unwrapReleaseKeyForExecutor(wrapped, generateReleaseKey(), sheet)
    ).toThrow()
  })

  it("does not open a DEK wrapper copied onto another asset", () => {
    const releaseKey = generateReleaseKey()
    const wrapped = wrapDekForHandover(generateDek(), releaseKey, asset)
    expect(() =>
      unwrapDekFromHandover(wrapped, releaseKey, { ...asset, assetId: "asset_2" })
    ).toThrow()
  })

  it("keeps the owner's copy and an asset's wrapper apart under one key", () => {
    const releaseKey = generateReleaseKey()
    const mk = generateMk()
    const owned = wrapReleaseKeyForOwner(releaseKey, mk, owner)
    expect(() =>
      unwrapDekFromHandover(owned, mk, { ownerId: owner, assetId: owner })
    ).toThrow()
  })
})
