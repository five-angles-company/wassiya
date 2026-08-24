/**
 * The whole path one real asset takes, end to end.
 *
 * Every other test in this package covers one primitive. This one covers the
 * *composition* the app actually performs — `useCreateAsset` writing an asset
 * and `4.9` reading it back — because that is where the pieces can each be
 * correct and still not fit: a label sealed under the DEK but unwrapped with
 * MK, a payload framed by `encryptAsset` but opened with `open`, an
 * `ArrayBuffer` handed over as a view into a larger buffer.
 *
 * If this file passes, an asset written by the wizards can be read by the
 * detail screen. If it fails, no amount of typechecking would have said so.
 */
import { describe, expect, it } from "vitest"

import { decryptAsset, encryptAsset } from "./asset"
import { bytesToUtf8, utf8ToBytes } from "./bytes"
import { generateDek, generateMk } from "./keys"
import { openLabel, sealLabel } from "./label"
import { unwrap, wrap } from "./wrap"

/** Exactly what `useCreateAsset` does, minus the network. */
function createAsset(
  mk: Uint8Array,
  label: { title: string; subtitle?: string },
  plaintext: Uint8Array
) {
  const dek = generateDek()
  const stored = {
    labelSealed: sealLabel(label, dek),
    dekWrappedByMk: wrap(dek, mk),
    blob: encryptAsset(plaintext, dek),
  }
  // The wizard zeroes the DEK here; the stored record is all that survives.
  dek.fill(0)
  return stored
}

/** Exactly what the detail screen does. */
function openAsset(mk: Uint8Array, stored: ReturnType<typeof createAsset>) {
  const dek = unwrap(stored.dekWrappedByMk, mk)
  return {
    label: openLabel(stored.labelSealed, dek),
    plaintext: decryptAsset(stored.blob, dek),
  }
}

describe("asset round trip", () => {
  it("reads back exactly what was written", () => {
    const mk = generateMk()
    const label = { title: "محفظة Ledger الرئيسية", subtitle: "Bitcoin · ١٢ كلمة" }
    const phrase =
      "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about"

    const stored = createAsset(mk, label, utf8ToBytes(phrase))
    const opened = openAsset(mk, stored)

    expect(opened.label).toEqual(label)
    expect(bytesToUtf8(opened.plaintext)).toBe(phrase)
  })

  it("survives a payload larger than one chunk", () => {
    const mk = generateMk()
    // 2.5 MiB crosses the 1 MiB chunk boundary twice, so the framing, the
    // per-chunk nonces and the final short chunk all get exercised.
    const photo = new Uint8Array(2.5 * 1024 * 1024)
    for (let i = 0; i < photo.length; i++) photo[i] = i % 251

    const stored = createAsset(mk, { title: "صور العائلة" }, photo)
    const opened = openAsset(mk, stored)

    expect(opened.plaintext.length).toBe(photo.length)
    expect(Array.from(opened.plaintext.slice(0, 64))).toEqual(
      Array.from(photo.slice(0, 64))
    )
    expect(Array.from(opened.plaintext.slice(-64))).toEqual(
      Array.from(photo.slice(-64))
    )
  })

  it("round-trips an empty payload", () => {
    const mk = generateMk()
    const stored = createAsset(mk, { title: "ملاحظة" }, new Uint8Array(0))
    expect(openAsset(mk, stored).plaintext.length).toBe(0)
  })

  it("is useless under the wrong MK — the whole point of the wrapper", () => {
    const stored = createAsset(generateMk(), { title: "x" }, utf8ToBytes("y"))
    expect(() => openAsset(generateMk(), stored)).toThrow()
  })

  it("does not let one asset's DEK open another's blob", () => {
    const mk = generateMk()
    const a = createAsset(mk, { title: "a" }, utf8ToBytes("secret a"))
    const b = createAsset(mk, { title: "b" }, utf8ToBytes("secret b"))
    // A fresh DEK per asset is what makes this true; reusing one would not.
    const dekA = unwrap(a.dekWrappedByMk, mk)
    expect(() => decryptAsset(b.blob, dekA)).toThrow()
    expect(() => openLabel(b.labelSealed, dekA)).toThrow()
  })

  it("survives the ArrayBuffer copy Convex does on the way through", () => {
    const mk = generateMk()
    const stored = createAsset(mk, { title: "صك ملكية" }, utf8ToBytes("deed"))

    // `v.bytes()` is an ArrayBuffer; the app converts with
    // `new Uint8Array(bytes).buffer` and back. A `subarray` view whose buffer
    // is larger than the view would ship trailing bytes without this copy.
    const trip = (value: Uint8Array) =>
      new Uint8Array(new Uint8Array(value).buffer)

    const opened = openAsset(mk, {
      labelSealed: trip(stored.labelSealed),
      dekWrappedByMk: trip(stored.dekWrappedByMk),
      blob: trip(stored.blob),
    })
    expect(opened.label.title).toBe("صك ملكية")
    expect(bytesToUtf8(opened.plaintext)).toBe("deed")
  })
})
