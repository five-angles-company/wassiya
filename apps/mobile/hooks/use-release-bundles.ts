/**
 * Keeps every heir's delivery bundle current — AGENTS.md "Escrowed release".
 *
 * While the vault is open, any heir `routing.staleHeirs` reports gets a fresh
 * bundle: their routed DEKs under a new random K_h, K_h locked to the pinned
 * escrow key with this owner's and heir's ids inside, the bundle uploaded as
 * ciphertext. The server never sees K_h or a DEK.
 *
 * Rules:
 *  - Only a key from `lib/escrow-key.ts` whose fingerprint matches is used.
 *    With no pinned key (a production build before Cloud KMS exists) nothing
 *    is built, so nothing is ever locked to the development key.
 *  - K_h and every unwrapped DEK are zeroed once the bundle is sealed.
 *  - One rebuild at a time; a failure is left for the next change to retry,
 *    and the protection score's "delivery" item stays amber meanwhile.
 */
import { useEffect, useRef } from "react"
import { useConvex, useMutation, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import {
  escrowKeyFingerprint,
  lockHeirKey,
  parseEscrowPublicKey,
} from "@workspace/crypto/escrow"
import {
  buildReleaseBundle,
  generateHeirKey,
  type KeyMap,
} from "@workspace/crypto/heir"
import { MESSAGE_KEY_ID } from "@workspace/crypto/message"
import { unwrap } from "@workspace/crypto/wrap"

import { uploadCiphertext } from "@/lib/asset-upload"
import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { pinnedEscrowKey } from "@/lib/escrow-key"
import { useVault } from "@/stores/vault"

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.slice().buffer
}

export function useReleaseBundles(): void {
  const mk = useVault((state) => state.mk)
  const me = useQuery(api.users.me)
  const stale = useQuery(api.routing.staleHeirs, mk === null ? "skip" : {})
  const convex = useConvex()
  const generateUploadUrl = useMutation(api.assets.generateUploadUrl)
  const saveBundles = useMutation(api.release.saveBundles)
  const running = useRef(false)

  useEffect(() => {
    if (mk === null || me == null || stale === undefined) return
    if (stale.length === 0 || running.current) return

    const pinned = pinnedEscrowKey()
    if (pinned === null) return
    if (escrowKeyFingerprint(pinned.pem) !== pinned.fingerprint) {
      console.error("Pinned escrow key does not match its fingerprint")
      return
    }

    running.current = true
    void (async () => {
      try {
        ensureWebCrypto()
        const escrowKey = parseEscrowPublicKey(pinned.pem)
        const bundles: {
          heirId: Id<"heirs">
          bundleStorageId: Id<"_storage">
          lockedKey: ArrayBuffer
          escrowKeyId: string
        }[] = []

        for (const { heirId } of stale) {
          const preview = await convex.query(api.routing.previewForHeir, {
            heirId,
          })
          const deks: KeyMap = {}
          const messageKeys: KeyMap = {}
          const kH = generateHeirKey()
          try {
            for (const item of preview.items) {
              deks[item.assetId] = unwrap(new Uint8Array(item.dekWrappedByMk), mk)
            }
            if (preview.messageKeyWrappedByMk !== null) {
              messageKeys[MESSAGE_KEY_ID] = unwrap(
                new Uint8Array(preview.messageKeyWrappedByMk),
                mk
              )
            }
            const blob = buildReleaseBundle(deks, messageKeys, kH)
            const lockedKey = lockHeirKey({ ownerId: me.id, heirId }, kH, escrowKey)
            const storageId = await uploadCiphertext(blob, await generateUploadUrl())
            bundles.push({
              heirId,
              bundleStorageId: storageId as Id<"_storage">,
              lockedKey: toArrayBuffer(lockedKey),
              escrowKeyId: pinned.id,
            })
          } finally {
            kH.fill(0)
            for (const key of [...Object.values(deks), ...Object.values(messageKeys)]) {
              key.fill(0)
            }
          }
        }

        await saveBundles({ bundles })
      } catch (error) {
        console.warn(
          "Delivery bundle rebuild failed:",
          error instanceof Error ? error.message : "unknown error"
        )
      } finally {
        running.current = false
      }
    })()
  }, [mk, me, stale, convex, generateUploadUrl, saveBundles])
}
