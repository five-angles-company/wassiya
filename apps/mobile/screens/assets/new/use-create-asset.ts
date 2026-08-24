/**
 * The one path from a filled-in wizard to a row in `assets`.
 *
 * All six wizards (٤.٣–٤.٨) end here, because everything that makes an asset
 * *safe* happens in this file and none of it should be re-derived per screen:
 *
 *   1. a fresh DEK per asset — never reused, so one compromised asset is one
 *      compromised asset;
 *   2. the label sealed under that DEK, so the server cannot read what the
 *      thing is called (see `@workspace/crypto/label`);
 *   3. the payload encrypted under the same DEK before a byte leaves the
 *      device, in the chunked `WSYA` frame `4.9` will later decrypt;
 *   4. the DEK wrapped under MK, which is the only thing that ties the asset to
 *      this owner;
 *   5. the DEK zeroed, whatever happened.
 *
 * ## Ordering: uploads before `assets.create`
 *
 * Blobs are uploaded first and the row is written last. The failure modes are
 * not symmetrical. A crash after upload but before `create` leaves orphaned
 * ciphertext in storage — invisible, unreferenced, and openable by nobody,
 * because the only DEK that could decrypt it died with the function call. The
 * reverse order would leave a *row* whose `storageIds` point at nothing, which
 * is an asset the vault claims to hold and cannot produce. An heir discovering
 * that is the failure this product exists to prevent, so the cost falls on the
 * side of wasted bytes.
 *
 * ## Everything lands unrouted
 *
 * `recipientRule: "default"` — always, for now. Step 2 of every wizard on the
 * board is heir assignment (5.3), which does not exist yet. That is not a
 * silent gap: 4.1 already renders an unrouted asset with the terracotta
 * "بلا مستلم" badge and sorts it to the top, so a vault filled by these wizards
 * reads as exactly what it is — saved, encrypted, and not yet going anywhere.
 */
import { useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { encryptAsset } from "@workspace/crypto/asset"
import { generateDek } from "@workspace/crypto/keys"
import { sealLabel, type AssetLabel } from "@workspace/crypto/label"
import { wrap } from "@workspace/crypto/wrap"

import { uploadCiphertext, type UploadProgress } from "@/lib/asset-upload"
import type { AssetType } from "@/lib/asset-types"
import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { useVault } from "@/stores/vault"

/**
 * One payload to encrypt and store as its own blob.
 *
 * `read` is a thunk, not bytes, and that is load-bearing for ٤.٦: an album of
 * twenty full-resolution photos handed over as twenty `Uint8Array`s would have
 * every one decoded and resident before the first upload starts, which is where
 * a mid-range handset runs out of memory. Reading inside the loop keeps exactly
 * one plaintext buffer alive at a time, and it stops a caller holding a
 * reference to a buffer this function then zeroes.
 */
export type AssetPayload = {
  read: () => Promise<Uint8Array>
  /** Bytes on the wire, for the meta counters. */
  byteSize?: number
}

export type CreateAssetInput = {
  type: AssetType
  label: AssetLabel
  /**
   * Plaintext blobs — a seed phrase, a note body, a photo. Each becomes one
   * encrypted object in storage, in order.
   */
  payloads: AssetPayload[]
  /** Non-sensitive counters only; the server may read every field of this. */
  meta?: {
    itemCount?: number
    byteSize?: number
    mimeType?: string
    expiryRemindAt?: number
  }
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
}

export class VaultLockedError extends Error {
  constructor() {
    super("The vault must be unlocked before an asset can be created")
    this.name = "VaultLockedError"
  }
}

export function useCreateAsset(): (
  input: CreateAssetInput
) => Promise<Id<"assets">> {
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const create = useMutation(api.assets.create)

  return useCallback(
    async ({ type, label, payloads, meta, onProgress }: CreateAssetInput) => {
      // Read once, here. A wizard that grabbed MK at mount could hold a key the
      // auto-lock has since cleared, and would encrypt under a stale one.
      const mk = useVault.getState().mk
      if (mk === null) throw new VaultLockedError()

      // Hermes has no Web Crypto global and `generateDek` refuses without one.
      ensureWebCrypto()
      const dek = generateDek()

      try {
        const labelSealed = sealLabel(label, dek)

        const storageIds: Id<"_storage">[] = []
        for (const [index, payload] of payloads.entries()) {
          const plaintext = await payload.read()
          const ciphertext = encryptAsset(dek, plaintext)
          // Wipe as soon as it is encrypted. Safe to do unconditionally now
          // that the buffer was produced by `read` for this iteration alone and
          // no caller holds it.
          plaintext.fill(0)
          const url = await generateUploadUrl({})
          const storageId = await uploadCiphertext(ciphertext, url, (p) =>
            onProgress?.(index, p)
          )
          storageIds.push(storageId as Id<"_storage">)
        }

        return await create({
          type,
          labelSealed: toArrayBuffer(labelSealed),
          meta: meta ?? {},
          dekWrappedByMk: toArrayBuffer(wrap(dek, mk)),
          storageIds,
          recipientRule: "default",
        })
      } finally {
        dek.fill(0)
      }
    },
    [create, generateUploadUrl]
  )
}

/**
 * Convex `v.bytes()` is an `ArrayBuffer`. Copying rather than handing over
 * `bytes.buffer` matters: `@workspace/crypto` builds its outputs with
 * `subarray`, so the underlying buffer can be larger than the view and passing
 * it raw would ship trailing bytes.
 */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer
}
