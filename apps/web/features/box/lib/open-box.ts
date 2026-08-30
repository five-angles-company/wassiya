import { concatBytes, hexToBytes } from "@workspace/crypto/bytes"
import { decryptAsset } from "@workspace/crypto/asset"
import { heirKey, openReleaseBundle, type KeyMap } from "@workspace/crypto/heir"
import { openLabel, type AssetLabel } from "@workspace/crypto/label"

/**
 * The crypto half of the box, kept out of the components.
 *
 * Everything here runs in the browser. `@workspace/crypto` is platform-neutral
 * by design, so the bundle is fetched and opened client-side and the server
 * never sees K_h, either half of it, or any DEK it protects — which is the
 * entire point of having withheld one half.
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
 * Derive K_h and open the bundle.
 *
 * The two halves are zeroed by the caller in a `finally`, not here: a throw
 * between deriving K_h and opening the bundle would otherwise leave both
 * sitting in memory for the life of the page.
 */
export function deriveHeirKey(
  serverShare: ArrayBuffer,
  guardianShareText: string
): { kH: Uint8Array; guardianShare: Uint8Array } {
  const guardianShare = hexToBytes(guardianShareText.trim().replace(/[\s-]/g, ""))
  return { kH: heirKey(new Uint8Array(serverShare), guardianShare), guardianShare }
}

export function openBundle(blob: Uint8Array, kH: Uint8Array): OpenedBundle {
  const contents = openReleaseBundle(blob, kH)
  return { deks: contents.deks, messageKeys: contents.messageKeys }
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
