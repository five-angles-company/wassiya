/**
 * The whole path one real asset takes, end to end: saved on the owner's phone,
 * read back there, handed over, and read by an executor with their sheet.
 *
 * Every other test in this package covers one primitive. This one covers the
 * composition the apps actually perform, because that is where the pieces can
 * each be correct and still not fit: a label sealed under the DEK but unwrapped
 * with MK, a file framed by `encryptAsset` but opened with `open`, an
 * `ArrayBuffer` handed over as a view into a larger buffer.
 */
import { describe, expect, it } from "vitest"

import { decryptAsset, encryptAsset } from "./asset"
import { bytesToUtf8, utf8ToBytes } from "./bytes"
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
import { decodeExecutorCode, decodePaperCode, encodeExecutorCode } from "./papercode"
import { recoverMk, splitRecovery } from "./recovery"
import { openLabel, sealLabel } from "./label"
import { openSecret, sealSecret } from "./secret"
import { unwrap, wrap } from "./wrap"

type Stored = {
  labelSealed: Uint8Array
  secretSealed: Uint8Array
  dekWrappedByMk: Uint8Array
  file: Uint8Array
}

/** Exactly what the save hook does, minus the network. */
function saveAsset(
  mk: Uint8Array,
  label: { title: string; subtitle?: string },
  secret: string,
  file: Uint8Array
): Stored {
  const dek = generateDek()
  const stored = {
    labelSealed: sealLabel(label, dek),
    secretSealed: sealSecret(secret, dek),
    dekWrappedByMk: wrap(dek, mk),
    file: encryptAsset(file, dek),
  }
  dek.fill(0)
  return stored
}

/** What any holder of the DEK does: the owner's detail screen, or an executor. */
function readAsset(dek: Uint8Array, stored: Stored) {
  return {
    label: openLabel(stored.labelSealed, dek),
    secret: openSecret(stored.secretSealed, dek),
    file: decryptAsset(stored.file, dek),
  }
}

describe("asset round trip", () => {
  it("reads back exactly what was written", () => {
    const mk = generateMk()
    const label = { title: "محفظة Ledger الرئيسية", subtitle: "Bitcoin · ١٢ كلمة" }
    const secret = JSON.stringify({
      phrase:
        "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about",
    })

    const stored = saveAsset(mk, label, secret, utf8ToBytes("pdf"))
    const opened = readAsset(unwrap(stored.dekWrappedByMk, mk), stored)

    expect(opened.label).toEqual(label)
    expect(opened.secret).toBe(secret)
    expect(bytesToUtf8(opened.file)).toBe("pdf")
  })

  it("survives a file larger than one chunk", () => {
    const mk = generateMk()
    // 2.5 MiB crosses the 1 MiB chunk boundary twice, so the framing, the
    // per-chunk nonces and the final short chunk all get exercised.
    const photo = new Uint8Array(2.5 * 1024 * 1024)
    for (let i = 0; i < photo.length; i++) photo[i] = i % 251

    const stored = saveAsset(mk, { title: "صور العائلة" }, "{}", photo)
    const opened = readAsset(unwrap(stored.dekWrappedByMk, mk), stored)

    expect(opened.file.length).toBe(photo.length)
    expect(Array.from(opened.file.slice(-64))).toEqual(Array.from(photo.slice(-64)))
  })

  it("is useless under the wrong MK — the whole point of the wrapper", () => {
    const stored = saveAsset(generateMk(), { title: "x" }, "y", new Uint8Array(0))
    expect(() => unwrap(stored.dekWrappedByMk, generateMk())).toThrow()
  })

  it("does not let one asset's DEK open another's", () => {
    const mk = generateMk()
    const a = saveAsset(mk, { title: "a" }, "secret a", utf8ToBytes("a"))
    const b = saveAsset(mk, { title: "b" }, "secret b", utf8ToBytes("b"))
    const dekA = unwrap(a.dekWrappedByMk, mk)
    expect(() => readAsset(dekA, b)).toThrow()
  })

  it("reaches an executor through their sheet, and only for its own row", () => {
    const owner = "owner_1"
    const mk = generateMk()
    const stored = saveAsset(mk, { title: "صك ملكية" }, "{\"kind\":\"deed\"}", utf8ToBytes("deed"))
    const asset = { ownerId: owner, assetId: "asset_1" }
    const sheet = { ownerId: owner, executorId: "executor_1", sheetVersion: 1 }

    // On the phone: the release key, the handed-over DEK, the printed sheet.
    const releaseKey = generateReleaseKey()
    const forAsset = wrapDekForHandover(unwrap(stored.dekWrappedByMk, mk), releaseKey, asset)
    const sheetSecret = generateReleaseKey()
    const forExecutor = wrapReleaseKeyForExecutor(releaseKey, sheetSecret, sheet)
    const printed = encodeExecutorCode(sheetSecret, sheet.sheetVersion)

    // After release, in the executor's browser: the typed sheet opens it all.
    const typed = decodeExecutorCode(printed)
    const opened = unwrapReleaseKeyForExecutor(forExecutor, typed.sheetSecret, sheet)
    const dek = unwrapDekFromHandover(forAsset, opened, asset)
    expect(readAsset(dek, stored).label.title).toBe("صك ملكية")

    expect(() =>
      unwrapDekFromHandover(forAsset, opened, { ...asset, assetId: "asset_2" })
    ).toThrow()
  })

  it("falls back to the owner's recovery sheet after death", () => {
    const owner = "owner_1"
    const mk = generateMk()
    const stored = saveAsset(mk, { title: "wallet" }, "{}", new Uint8Array(0))
    const asset = { ownerId: owner, assetId: "asset_1" }
    const releaseKey = generateReleaseKey()
    const forAsset = wrapDekForHandover(unwrap(stored.dekWrappedByMk, mk), releaseKey, asset)
    const ownerCopy = wrapReleaseKeyForOwner(releaseKey, mk, owner)
    const { sPaper, mkWrappedByRecovery } = splitRecovery(mk, owner, 1)

    const recovered = recoverMk(sPaper, mkWrappedByRecovery, owner, 1)
    const opened = unwrapReleaseKeyForOwner(ownerCopy, recovered, owner)
    expect(readAsset(unwrapDekFromHandover(forAsset, opened, asset), stored).label.title).toBe("wallet")
  })

  it("never accepts a recovery code as an executor code, or the reverse", () => {
    const secret = generateReleaseKey()
    const executor = encodeExecutorCode(secret, 1)
    expect(() => decodePaperCode(executor.replace("WSE", "WSY"))).toThrow()
  })

  it("survives the ArrayBuffer copy Convex does on the way through", () => {
    const mk = generateMk()
    const stored = saveAsset(mk, { title: "صك ملكية" }, "s", utf8ToBytes("deed"))

    // `v.bytes()` is an ArrayBuffer; the apps convert with
    // `new Uint8Array(bytes).buffer` and back. A `subarray` view whose buffer
    // is larger than the view would ship trailing bytes without this copy.
    const trip = (value: Uint8Array) => new Uint8Array(new Uint8Array(value).buffer)

    const opened = readAsset(unwrap(trip(stored.dekWrappedByMk), mk), {
      labelSealed: trip(stored.labelSealed),
      secretSealed: trip(stored.secretSealed),
      dekWrappedByMk: trip(stored.dekWrappedByMk),
      file: trip(stored.file),
    })
    expect(opened.label.title).toBe("صك ملكية")
    expect(bytesToUtf8(opened.file)).toBe("deed")
  })
})
