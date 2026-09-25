// The one unlock path — AGENTS.md "Escrowed release".
//
//  - `openDelivery` is the only reader of `escrowedDek`, `messageKeyEscrowed`
//    and `ESCROW_PRIVATE_KEY`, and this is the only module that may import
//    `@workspace/crypto`. `scripts/verify-invariants.mjs` enforces all three.
//  - Every precondition is re-read here, as the calling heir. Nothing passed in
//    is trusted, and every refusal is the same "not found".
//  - An open that passes the gate is audited in the same transaction, including
//    one whose keys then fail to open.
//  - Keys leave only in this mutation's return value, to the one verified heir.
//    They are never logged, stored in the clear, or put in an error.
import {
  type EscrowSubject,
  openFromEscrow,
  parseEscrowKey,
} from "@workspace/crypto/escrow"
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, type MutationCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import { currentEscrowKeyId } from "./model/escrowSeal"
import { routesForHeir } from "./model/receivers"
import { getCurrentUserOrThrow } from "./users"

/**
 * What one heir receives: every routed asset with its DEK, and their message
 * with its key. The heir's browser decrypts everything itself.
 */
export const openDelivery = mutation({
  args: { deliveryId: v.id("deliveries") },
  handler: async (ctx, { deliveryId }) => {
    const delivery = await openableDelivery(ctx, deliveryId)
    if (delivery === null) throw new Error("Not found")

    const now = Date.now()
    await ctx.db.patch("deliveries", deliveryId, { lastOpenedAt: now })
    await writeAudit(ctx, {
      userId: delivery.subjectUserId,
      event: "release.delivery_opened",
      meta: {
        deliveryId,
        heirId: delivery.heirId,
        heirUserId: delivery.heirUserId ?? null,
      },
      at: now,
    })

    const secretKey = escrowSecretKey()
    const ownerId = delivery.subjectUserId
    try {
      const items = []
      for (const route of await routesForHeir(ctx, ownerId, delivery.heirId)) {
        const asset = await ctx.db.get("assets", route.assetId)
        if (asset === null) continue
        items.push({
          assetId: asset._id,
          type: asset.type,
          via: route.recipient.kind,
          meta: asset.meta,
          labelSealed: asset.labelSealed,
          secretSealed: asset.secretSealed ?? null,
          files: await Promise.all(
            asset.files.map(async (file) => ({
              url: await ctx.storage.getUrl(file.storageId),
              thumbnailUrl:
                file.thumbnailId === undefined
                  ? null
                  : await ctx.storage.getUrl(file.thumbnailId),
            }))
          ),
          dek: openKey(asset.escrowedDek, asset.escrowKeyId, secretKey, {
            ownerId,
            assetId: asset._id,
          }),
        })
      }

      const heir = await ctx.db.get("heirs", delivery.heirId)
      const stored = heir?.messageMeta
      const message =
        stored === undefined
          ? null
          : {
              kind: stored.kind,
              url: await ctx.storage.getUrl(stored.storageId),
              key: openKey(stored.messageKeyEscrowed, stored.escrowKeyId, secretKey, {
                ownerId,
                messageForHeirId: delivery.heirId,
              }),
            }

      return { expiresAt: delivery.expiresAt, items, message }
    } finally {
      secretKey.fill(0)
    }
  },
})

/**
 * Every precondition for opening a delivery, re-read now. `null` means "not
 * found" to the caller, who learns nothing more.
 */
async function openableDelivery(
  ctx: MutationCtx,
  deliveryId: Id<"deliveries">
): Promise<Doc<"deliveries"> | null> {
  const caller = await getCurrentUserOrThrow(ctx)
  const delivery = await ctx.db.get("deliveries", deliveryId)
  if (delivery === null) return null
  if (delivery.status !== "ready") return null
  if (delivery.destroyedAt !== undefined) return null
  if (delivery.expiresAt <= Date.now()) return null
  if (delivery.heirUserId !== caller._id) return null
  if (caller.identityStatus !== "verified") return null

  const claim = await ctx.db.get("claims", delivery.claimId)
  if (claim === null || claim.status !== "released") return null
  if (claim.nameMatch !== true) return null
  if (claim.subjectUserId !== delivery.subjectUserId) return null
  return delivery
}

function escrowSecretKey(): Uint8Array {
  currentEscrowKeyId()
  const hex = process.env.ESCROW_PRIVATE_KEY
  if (hex === undefined) {
    throw new Error("ESCROW_PRIVATE_KEY is not set on this deployment")
  }
  return parseEscrowKey(hex)
}

/**
 * One escrowed key, as bytes the heir's browser can use — or `null` when it
 * will not open, which the page shows as an item it cannot name rather than
 * failing the whole delivery.
 */
function openKey(
  sealed: ArrayBuffer | undefined,
  keyId: string | undefined,
  secretKey: Uint8Array,
  subject: EscrowSubject
): ArrayBuffer | null {
  if (sealed === undefined || keyId !== currentEscrowKeyId()) return null
  try {
    const key = openFromEscrow(new Uint8Array(sealed), secretKey, subject)
    const out = key.slice().buffer
    key.fill(0)
    return out
  } catch {
    return null
  }
}

