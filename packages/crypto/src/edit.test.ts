import { describe, expect, it } from "vitest"

import { bytesToUtf8, utf8ToBytes } from "./bytes"
import { decryptAsset, encryptAsset } from "./asset"
import { generateDek, generateMk } from "./keys"
import { openLabel, sealLabel } from "./label"
import { unwrap, wrap } from "./wrap"

/**
 * Editing an asset reuses its DEK. It does not rotate it.
 *
 * That is forced by the release model rather than chosen for convenience: a
 * routed asset's DEK is sealed to the escrow key at routing time, so minting a
 * fresh key on an ordinary rename would leave that sealed copy opening nothing —
 * silently, and only discoverable years later at a claim, by someone who cannot
 * fix it.
 *
 * Reuse is safe because `seal` mints a nonce per call and `encryptAsset` a salt
 * per call. That was believed on the strength of a doc comment; these tests
 * make it a property the suite enforces, because the failure mode of being
 * wrong is an asset that saves successfully and can never be opened again —
 * after `assets.update` has already deleted the blob it replaced.
 */
describe("editing an asset under its existing DEK", () => {
  it("re-seals a label any number of times and reopens every one", () => {
    const dek = generateDek()
    const first = { title: "iCloud · fatima@icloud.com", subtitle: "حساب رقمي" }
    const second = { title: "iCloud · f@icloud.com", subtitle: "حساب رقمي · احذف الحساب نهائياً" }
    const third = { title: "‏Apple ID", subtitle: "حساب رقمي" }

    const a = sealLabel(first, dek)
    const b = sealLabel(second, dek)
    const c = sealLabel(third, dek)

    expect(openLabel(a, dek)).toEqual(first)
    expect(openLabel(b, dek)).toEqual(second)
    expect(openLabel(c, dek)).toEqual(third)
  })

  it("re-encrypts a payload any number of times and decrypts every one", () => {
    const dek = generateDek()
    const first = JSON.stringify({ service: "iCloud", password: "hunter2" })
    const second = JSON.stringify({ service: "iCloud", password: "correct horse" })

    const a = encryptAsset(utf8ToBytes(first), dek)
    const b = encryptAsset(utf8ToBytes(second), dek)

    expect(bytesToUtf8(decryptAsset(a, dek))).toBe(first)
    expect(bytesToUtf8(decryptAsset(b, dek))).toBe(second)
  })

  /**
   * The property that makes reuse safe rather than merely working. Encrypting
   * identical plaintext twice under one DEK must not produce identical bytes —
   * a repeated nonce stream would leak the XOR of two payloads to anyone
   * holding both blobs, and the server holds every version it was ever sent.
   */
  it("never produces the same ciphertext twice for the same plaintext", () => {
    const dek = generateDek()
    const plaintext = utf8ToBytes("the same twelve words, saved twice")

    const a = encryptAsset(plaintext, dek)
    const b = encryptAsset(plaintext, dek)

    expect(a).not.toEqual(b)
    expect(bytesToUtf8(decryptAsset(a, dek))).toBe(bytesToUtf8(decryptAsset(b, dek)))
  })

  it("does the same for labels", () => {
    const dek = generateDek()
    const label = { title: "مصرف الراجحي", subtitle: "SA44 •••• 2345" }

    expect(sealLabel(label, dek)).not.toEqual(sealLabel(label, dek))
  })

  /**
   * The whole edit path, end to end: the row hands back a wrapped DEK, the
   * device unwraps it with MK, re-seals and re-encrypts under it, and the
   * wrapper on the row is never touched. This is exactly what
   * `use-update-asset.ts` does.
   */
  it("round-trips an edit starting from the wrapped DEK on the row", () => {
    const mk = generateMk()
    const original = generateDek()
    const dekWrappedByMk = wrap(original, mk)

    // Created once…
    const created = encryptAsset(utf8ToBytes("before"), original)
    const createdLabel = sealLabel({ title: "before" }, original)

    // …then edited, with only the wrapper to go on.
    const dek = unwrap(dekWrappedByMk, mk)
    const edited = encryptAsset(utf8ToBytes("after"), dek)
    const editedLabel = sealLabel({ title: "after" }, dek)
    dek.fill(0)

    // Both versions still open under the key the row has always carried.
    const reread = unwrap(dekWrappedByMk, mk)
    expect(bytesToUtf8(decryptAsset(created, reread))).toBe("before")
    expect(bytesToUtf8(decryptAsset(edited, reread))).toBe("after")
    expect(openLabel(createdLabel, reread)).toEqual({ title: "before" })
    expect(openLabel(editedLabel, reread)).toEqual({ title: "after" })
  })

  /**
   * The escrow lock holds the DEK itself, not the wrapper. So the test that
   * actually matters for delivery: a key captured at routing time still opens
   * what the owner saved afterwards.
   */
  it("keeps a DEK captured at routing time able to open later edits", () => {
    const dek = generateDek()
    // What the escrow lock sealed, whenever routing last ran.
    const routed = Uint8Array.from(dek)

    const laterEdit = encryptAsset(utf8ToBytes("edited long after routing"), dek)

    expect(bytesToUtf8(decryptAsset(laterEdit, routed))).toBe(
      "edited long after routing"
    )
  })
})
