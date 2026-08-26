/**
 * The one path from an edited asset back to its row.
 *
 * The mirror of `use-create-asset.ts`, and deliberately shaped like it — same
 * ordering, same zeroing, same `VaultLockedError`. One difference matters, and
 * it is the whole reason this is a separate hook:
 *
 * ## The DEK is reused, never regenerated
 *
 * `useCreateAsset` mints a fresh DEK per asset. An **edit must not**. Heir
 * release bundles carry the routed DEKs — that is how an heir opens an asset
 * without ever holding MK — so minting a new DEK on an ordinary rename would
 * silently invalidate every bundle already built for this asset. Nothing would
 * surface it: the owner would see a saved asset, and the failure would appear
 * years later, at a claim, to someone who cannot fix it.
 *
 * So the existing DEK is unwrapped from the row, used to re-seal the label and
 * re-encrypt the payload, and never sent back. `assets.update` still accepts
 * `dekWrappedByMk` for the one case that genuinely is a rotation — MK itself
 * changing — and this hook is not it.
 *
 * Reusing a DEK across two encryptions is safe here because the primitives
 * derive fresh randomness per call: `seal` mints a new nonce, and
 * `encryptAsset` a new salt whose own doc says it exists so that "each
 * encryption's nonce stream [is] unique even when the DEK is deliberately
 * reused". That is this call site.
 *
 * ## Ordering: uploads before the patch
 *
 * Same trade as `create`, for the same reason. New blobs go up first and the
 * row is patched last, so a crash between them leaves orphaned ciphertext
 * nobody can open — never a row whose `storageIds` point at nothing. The
 * mutation deletes the superseded blobs only after its own patch succeeds.
 */
import { useCallback } from "react"
import { useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { encryptAsset } from "@workspace/crypto/asset"
import { sealLabel, type AssetLabel } from "@workspace/crypto/label"
import { unwrap } from "@workspace/crypto/wrap"

import { uploadCiphertext, type UploadProgress } from "@/lib/asset-upload"
import { VaultLockedError, type AssetPayload } from "@/screens/assets/new/use-create-asset"
import { useVault } from "@/stores/vault"

export type UpdateAssetInput = {
  assetId: Id<"assets">
  /** Straight off the row — this is the DEK that must be reused. */
  dekWrappedByMk: ArrayBuffer
  label: AssetLabel
  /** Plaintext blobs to encrypt and upload, replacing whatever they supersede. */
  payloads: AssetPayload[]
  /**
   * Blobs already in storage that survive this edit, in the order they should
   * appear ahead of the new ones. Empty for the credential types, which hold a
   * single blob and always replace it; the file types keep what was not
   * touched, and the mutation deletes exactly the difference.
   */
  keep?: Id<"_storage">[]
  /**
   * Compose the final list from the ids just uploaded, overriding `keep`.
   * Whatever it returns *is* `storageIds`, and the mutation deletes exactly the
   * blobs no longer in it — so dropping an id here is how a file is removed.
   */
  arrange?: (uploaded: Id<"_storage">[]) => Id<"_storage">[]
  /** Non-sensitive counters only; the server may read every field of this. */
  meta?: {
    itemCount?: number
    byteSize?: number
    mimeType?: string
    expiryRemindAt?: number
  }
  onProgress?: (fileIndex: number, progress: UploadProgress) => void
}

export function useUpdateAsset(): (input: UpdateAssetInput) => Promise<void> {
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const update = useMutation(api.assets.update)

  return useCallback(
    async ({
      assetId,
      dekWrappedByMk,
      label,
      payloads,
      keep = [],
      arrange,
      meta,
      onProgress,
    }: UpdateAssetInput) => {
      // Read at call time, not at mount: a screen that grabbed MK when it
      // opened could hold a key the lock has since cleared, and would encrypt
      // the owner's edit under a stale one.
      const mk = useVault.getState().mk
      if (mk === null) throw new VaultLockedError()

      const dek = unwrap(new Uint8Array(dekWrappedByMk), mk)
      try {
        const labelSealed = sealLabel(label, dek)

        const uploaded: Id<"_storage">[] = []
        for (const [index, payload] of payloads.entries()) {
          const plaintext = await payload.read()
          const ciphertext = encryptAsset(plaintext, dek)
          // Wipe as soon as it is encrypted: `read` produced this buffer for
          // this iteration alone and no caller holds a reference to it.
          plaintext.fill(0)
          const url = await generateUploadUrl({})
          const storageId = await uploadCiphertext(ciphertext, url, (p) =>
            onProgress?.(index, p)
          )
          uploaded.push(storageId as Id<"_storage">)
        }

        await update({
          assetId,
          labelSealed: toArrayBuffer(labelSealed),
          meta: meta ?? {},
          storageIds: arrange ? arrange(uploaded) : [...keep, ...uploaded],
        })
      } finally {
        dek.fill(0)
      }
    },
    [generateUploadUrl, update]
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
