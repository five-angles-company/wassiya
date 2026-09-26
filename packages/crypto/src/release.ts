/**
 * The handover: what reaches the owner's executors (الأوصياء) after a verified
 * death, and nothing else. Wassiya holds none of these keys.
 *
 *   R   the release key — one per owner, random, generated on the phone.
 *   R   wraps the DEK of every handed-over asset (bound to owner and asset).
 *   MK  wraps R: the owner's own copy, and the fallback after death, when the
 *       owner's recovery sheet opens MK and MK opens R.
 *   each executor sheet wraps R (bound to owner, executor and sheet version).
 *
 * A private asset has no R-wrapper, so nothing but MK opens it. The server keeps
 * only wrappers and releases them after a verified death to a verified
 * executor, whose browser opens them with the sheet.
 */
import { KEY_BYTES, randomBytes, utf8ToBytes } from "./bytes"
import { unwrap, wrap } from "./wrap"

export function generateReleaseKey(): Uint8Array {
  return randomBytes(KEY_BYTES)
}

/** `|` never occurs in a Convex id, so no two contexts can collide. */
const aad = (...parts: (string | number)[]) =>
  utf8ToBytes(["wassiya/release/v1", ...parts].join("|"))

export function wrapReleaseKeyForOwner(
  releaseKey: Uint8Array,
  mk: Uint8Array,
  ownerId: string
): Uint8Array {
  return wrap(releaseKey, mk, aad("owner", ownerId))
}

export function unwrapReleaseKeyForOwner(
  wrapped: Uint8Array,
  mk: Uint8Array,
  ownerId: string
): Uint8Array {
  return unwrap(wrapped, mk, aad("owner", ownerId))
}

export type HandoverAsset = { ownerId: string; assetId: string }

export function wrapDekForHandover(
  dek: Uint8Array,
  releaseKey: Uint8Array,
  asset: HandoverAsset
): Uint8Array {
  return wrap(dek, releaseKey, aad("asset", asset.ownerId, asset.assetId))
}

export function unwrapDekFromHandover(
  wrapped: Uint8Array,
  releaseKey: Uint8Array,
  asset: HandoverAsset
): Uint8Array {
  return unwrap(wrapped, releaseKey, aad("asset", asset.ownerId, asset.assetId))
}

/**
 * The version is bound in, so a reprinted sheet voids the old one the moment
 * its wrapper is saved — and not before: mint → display → confirm → save, as
 * for the recovery sheet.
 */
export type ExecutorSheet = {
  ownerId: string
  executorId: string
  sheetVersion: number
}

export function wrapReleaseKeyForExecutor(
  releaseKey: Uint8Array,
  sheetSecret: Uint8Array,
  sheet: ExecutorSheet
): Uint8Array {
  return wrap(
    releaseKey,
    sheetSecret,
    aad("executor", sheet.ownerId, sheet.executorId, sheet.sheetVersion)
  )
}

export function unwrapReleaseKeyForExecutor(
  wrapped: Uint8Array,
  sheetSecret: Uint8Array,
  sheet: ExecutorSheet
): Uint8Array {
  return unwrap(
    wrapped,
    sheetSecret,
    aad("executor", sheet.ownerId, sheet.executorId, sheet.sheetVersion)
  )
}
