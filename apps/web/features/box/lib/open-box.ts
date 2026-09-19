import { concatBytes } from "@workspace/crypto/bytes"
import { decryptAsset } from "@workspace/crypto/asset"
import { openReleaseBundle, type KeyMap } from "@workspace/crypto/heir"
import { openLabel, type AssetLabel } from "@workspace/crypto/label"
import { generateSealKeypair, openSealedKey } from "@workspace/crypto/seal"

/**
 * The crypto half of the box, kept out of the components.
 *
 * Everything here runs in the browser. K_h reaches this page only sealed to a
 * one-time key generated here, so the response carrying it is useless to
 * anyone who is not this tab — and K_h, the one-time secret and every DEK are
 * zeroed as soon as they are no longer needed.
 *
 * ## `v.bytes()` arrives as an `ArrayBuffer`
 *
 * Convex serialises `v.bytes()` to `ArrayBuffer`, and every function in
 * `@workspace/crypto` asserts on `Uint8Array`. Each crossing is wrapped once,
 * here, rather than at each call site: a missed wrap fails *inside* `open()`
 * with a tag error, which is indistinguishable from a wrong key half and would
 * be reported to the reader as "that half didn't open the box".
 */

export type OpenedBundle = {
  deks: KeyMap
  messageKeys: KeyMap
}

/**
 * Ask for this delivery's K_h, sealed to a fresh one-time key, and open the
 * bundle with it. `request` is the `escrow.openDelivery` action.
 *
 * K_h and the one-time secret are zeroed in `finally`, so a throw anywhere
 * between receiving the key and opening the bundle cannot leave either in
 * memory for the life of the page. The DEKs inside the bundle survive: every
 * row on the screen decrypts against them.
 */
export async function openDelivery(
  request: (
    browserPublicKey: ArrayBuffer
  ) => Promise<{ bundleUrl: string; sealedKey: ArrayBuffer }>
): Promise<OpenedBundle> {
  const oneTime = generateSealKeypair()
  let kH: Uint8Array | undefined
  try {
    const publicKey = oneTime.publicKey.slice().buffer
    const { bundleUrl, sealedKey } = await request(publicKey)
    kH = openSealedKey(new Uint8Array(sealedKey), oneTime.secretKey)
    const response = await fetch(bundleUrl)
    if (!response.ok) throw new Error(`Bundle fetch failed: ${response.status}`)
    const contents = openReleaseBundle(
      new Uint8Array(await response.arrayBuffer()),
      kH
    )
    return { deks: contents.deks, messageKeys: contents.messageKeys }
  } finally {
    kH?.fill(0)
    oneTime.secretKey.fill(0)
  }
}

/**
 * The asset's name, or `null` when this bundle carries no key for it.
 *
 * A routed asset with no DEK is not an error the reader can act on, and not
 * something to hide either — the row stays, named by its type, so the count on
 * the page matches the count in the vault. It happens when routing changed
 * after the last bundle rebuild, which `routing.staleHeirs` exists to catch.
 */
export function labelFor(
  labelSealed: ArrayBuffer,
  dek: Uint8Array | undefined
): AssetLabel | null {
  if (dek === undefined) return null
  try {
    return openLabel(new Uint8Array(labelSealed), dek)
  } catch {
    return null
  }
}

/**
 * Fetch an asset's ciphertext and decrypt it.
 *
 * `contentUrls` is an array because an asset can be chunked across several
 * storage objects, and `parseAssetHeader` reads its header off the front of the
 * *whole* blob. So the parts are concatenated **in array order** before a single
 * `decryptAsset` — fetching them in parallel but assembling them in order,
 * because `Promise.all` preserves order while `Promise.race` would not.
 */
export async function fetchAndDecrypt(
  contentUrls: readonly string[],
  dek: Uint8Array
): Promise<Uint8Array> {
  const parts = await Promise.all(
    contentUrls.map(async (url) => {
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Asset part failed: ${response.status}`)
      return new Uint8Array(await response.arrayBuffer())
    })
  )
  return decryptAsset(concatBytes(...parts), dek)
}

/** Zero every key in a map. Called when the page unmounts or the box re-locks. */
export function wipeKeyMap(map: KeyMap | undefined): void {
  if (map === undefined) return
  for (const key of Object.values(map)) key.fill(0)
}
