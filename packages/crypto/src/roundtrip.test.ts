/**
 * The whole path one real asset takes, end to end: saved on the owner's phone,
 * read back there, routed, opened by the release gate, and read by the heir.
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
import { openFromEscrow, sealForEscrow } from "./escrow"
import { generateDek, generateMk } from "./keys"
import { openLabel, sealLabel } from "./label"
import { generateSealKeypair } from "./seal"
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

/** What any holder of the DEK does: the owner's detail screen, or the heir. */
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

  it("reaches the heir through the escrow lock, and only for its own row", () => {
    const escrow = generateSealKeypair()
    const mk = generateMk()
    const stored = saveAsset(mk, { title: "صك ملكية" }, "{\"kind\":\"deed\"}", utf8ToBytes("deed"))
    const subject = { ownerId: "owner_1", assetId: "asset_1" }

    // Routing: the owner's phone seals the DEK to the pinned public key.
    const sealed = sealForEscrow(unwrap(stored.dekWrappedByMk, mk), escrow.publicKey, subject)

    // Release: the gate opens it, and the heir's browser reads the asset.
    const dek = openFromEscrow(sealed, escrow.secretKey, subject)
    const opened = readAsset(dek, stored)
    expect(opened.label.title).toBe("صك ملكية")
    expect(bytesToUtf8(opened.file)).toBe("deed")

    expect(() =>
      openFromEscrow(sealed, escrow.secretKey, { ...subject, assetId: "asset_2" })
    ).toThrow()
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
