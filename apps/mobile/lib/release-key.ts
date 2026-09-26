/**
 * The owner's release key R — AGENTS.md "Handover".
 *
 * R is minted once, by whichever device first needs it, and stored only
 * wrapped by MK (`keyring.setReleaseKey`). Every handed-over asset's DEK and
 * every executor sheet is built on it, so a second R would strand them all:
 * the backend refuses to replace one, and a device that loses that race uses
 * the stored key instead of its own.
 *
 * The returned key is a copy the caller must zero.
 */
import { useCallback } from "react"
import { useConvex, useMutation } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import {
  generateReleaseKey,
  unwrapReleaseKeyForOwner,
  wrapDekForHandover,
  wrapReleaseKeyForOwner,
} from "@workspace/crypto/release"
import { unwrap } from "@workspace/crypto/wrap"

import { ensureWebCrypto } from "@/lib/crypto-polyfill"
import { useVault } from "@/stores/vault"

export class VaultLockedError extends Error {
  constructor() {
    super("The vault must be unlocked first")
    this.name = "VaultLockedError"
  }
}

export type ReleaseKeyHandle = {
  ownerId: string
  releaseKey: Uint8Array
}

export function useReleaseKey(): () => Promise<ReleaseKeyHandle> {
  const convex = useConvex()
  const setReleaseKey = useMutation(api.keyring.setReleaseKey)

  return useCallback(async () => {
    const mk = useVault.getState().mk
    if (mk === null) throw new VaultLockedError()
    ensureWebCrypto()

    const me = await convex.query(api.users.me, {})
    if (me === null) throw new Error("Not signed in")
    const ownerId = me.id as string

    const stored = async () => {
      const keyring = await convex.query(api.keyring.get, {})
      return keyring?.releaseKeyWrappedByMk ?? null
    }

    const existing = await stored()
    if (existing !== null) {
      return {
        ownerId,
        releaseKey: unwrapReleaseKeyForOwner(new Uint8Array(existing), mk, ownerId),
      }
    }

    const releaseKey = generateReleaseKey()
    try {
      await setReleaseKey({
        releaseKeyWrappedByMk: toArrayBuffer(
          wrapReleaseKeyForOwner(releaseKey, mk, ownerId)
        ),
      })
      return { ownerId, releaseKey }
    } catch (error) {
      // Another device stored one first. Use it; this one was never saved.
      releaseKey.fill(0)
      const raced = await stored()
      if (raced === null) throw error
      return {
        ownerId,
        releaseKey: unwrapReleaseKeyForOwner(new Uint8Array(raced), mk, ownerId),
      }
    }
  }, [convex, setReleaseKey])
}

/**
 * Hand an asset over or make it private. Handing over wraps the asset's own
 * DEK under R, bound to the asset — the same DEK every edit reuses, so the
 * wrapper keeps opening the asset after it changes.
 */
export function useSetHandover(): (
  asset: { assetId: Id<"assets">; dekWrappedByMk: ArrayBuffer },
  handedOver: boolean
) => Promise<void> {
  const obtainReleaseKey = useReleaseKey()
  const setHandover = useMutation(api.assets.setHandover)

  return useCallback(
    async ({ assetId, dekWrappedByMk }, handedOver) => {
      if (!handedOver) {
        await setHandover({ assetId })
        return
      }
      const mk = useVault.getState().mk
      if (mk === null) throw new VaultLockedError()
      const { ownerId, releaseKey } = await obtainReleaseKey()
      const dek = unwrap(new Uint8Array(dekWrappedByMk), mk)
      try {
        await setHandover({
          assetId,
          dekWrappedByRelease: toArrayBuffer(
            wrapDekForHandover(dek, releaseKey, { ownerId, assetId })
          ),
        })
      } finally {
        dek.fill(0)
        releaseKey.fill(0)
      }
    },
    [obtainReleaseKey, setHandover]
  )
}

/**
 * Convex `v.bytes()` is an `ArrayBuffer`. Copying rather than handing over
 * `bytes.buffer` matters: `@workspace/crypto` builds its outputs with
 * `subarray`, so the underlying buffer can be larger than the view.
 */
export function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return new Uint8Array(bytes).buffer
}
