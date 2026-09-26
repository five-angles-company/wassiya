/**
 * Reading a plan refusal off a Convex error.
 *
 * The backend throws `ConvexError({ code: "limit", limit, plan })` for exactly
 * these five walls, and a plain `Error` for everything else. That typed payload
 * exists because this app has to pick a screen: "you have five assets" and
 * "photos need the annual plan" are different sheets, and the alternative was
 * matching on the error's Arabic text — which `use-asset-submit` used to do for
 * the lapse, with a comment apologising for it.
 *
 * The lapse keeps its plain-`Error` sentence on the backend, so it is matched
 * here by message. That one string is load-bearing in two repos; the backend
 * comment on `assertCanAddAssets` says so.
 */
import { ConvexError } from "convex/values"

export type PlanLimit =
  | "assets"
  | "storage"
  | "executors"
  | "photos"
  | "fileSize"
  | "lapsed"

const LIMITS = ["assets", "storage", "executors", "photos", "fileSize"] as const

/** The wall this error hit, or `null` if it is not a plan refusal at all. */
export function planLimitOf(cause: unknown): PlanLimit | null {
  if (cause instanceof Error && cause.message.includes("Subscription lapsed")) {
    return "lapsed"
  }
  if (!(cause instanceof ConvexError)) {
    return null
  }
  const data: unknown = cause.data
  if (typeof data !== "object" || data === null) {
    return null
  }
  const { code, limit } = data as { code?: unknown; limit?: unknown }
  if (code !== "limit" || typeof limit !== "string") {
    return null
  }
  return (LIMITS as readonly string[]).includes(limit)
    ? (limit as PlanLimit)
    : null
}

/** What `plans.current` serves, narrowed to the parts a pre-check needs. */
export type PlanState = {
  limits: {
    storageBytes: number | null
    assets: number | null
    photos: boolean
    maxFileBytes: number | null
  }
  usage: { storageBytesUsed: number; assets: number | null }
}

/**
 * The same walls, checked before anything is encrypted or uploaded.
 *
 * Not a second copy of the rules: every number compared here came from
 * `plans.current`, so there is still exactly one place they are written down.
 * What this saves is an album of twenty photos encrypted, uploaded and then
 * refused by the mutation — correct, and a terrible minute for the owner.
 *
 * The server still decides. A client that skipped this check reaches the same
 * refusal; this one only reaches it sooner.
 */
export function limitBeforeUpload(
  plan: PlanState | undefined,
  asset: { type: string; byteSize: number }
): PlanLimit | null {
  if (plan === undefined) {
    return null
  }
  const { limits, usage } = plan

  if (asset.type === "photos" && !limits.photos) {
    return "photos"
  }
  if (limits.maxFileBytes !== null && asset.byteSize > limits.maxFileBytes) {
    return "fileSize"
  }
  if (
    limits.storageBytes !== null &&
    usage.storageBytesUsed + asset.byteSize > limits.storageBytes
  ) {
    return "storage"
  }
  if (
    limits.assets !== null &&
    usage.assets !== null &&
    usage.assets >= limits.assets
  ) {
    return "assets"
  }
  return null
}
