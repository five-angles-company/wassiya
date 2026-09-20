// What a plan lets an owner add, enforced at the two chokepoints that can grow
// a vault: `assets.create`/`assets.update` and `heirs.add`.
//
// ## These throw `ConvexError`, and nothing else in this deployment does
//
// Every other failure here is a plain `Error` with a sentence, because every
// other failure is a bug or a forgery and the client only has to say "no". A
// limit is neither: the app has to open the right paywall, and the difference
// between "you have five assets" and "photos need the annual plan" is the
// difference between two screens. Matching on error text to find that out is
// the trap this avoids — `use-asset-submit` reads Convex errors as strings and
// would have had to parse Arabic.
//
// ## Counting without a counter
//
// Convex has no count operator, and `storageBytesUsed` is denormalised for
// exactly that reason. Counts are not: every cap is small enough to read
// `cap + 1` rows through `by_userId` and stop. That is a handful of documents
// per add, it cannot drift the way a counter can, and an unlimited plan reads
// nothing at all.
import { ConvexError } from "convex/values"

import type { Doc, Id } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"
import {
  limitsFor,
  planOf,
  storageUsed,
  type PlanId,
  type PlanLimits,
} from "./plans"

/** Which wall the caller hit. The mobile paywall branches on exactly this. */
export type LimitCode = "assets" | "storage" | "heirs" | "photos" | "fileSize"

export type LimitError = {
  code: "limit"
  limit: LimitCode
  plan: PlanId
}

function refuse(limit: LimitCode, plan: PlanId): never {
  throw new ConvexError<LimitError>({ code: "limit", limit, plan })
}

/** Rows up to `cap + 1`, which is all a cap check ever needs to know. */
async function countUpTo(
  ctx: QueryCtx,
  table: "assets" | "heirs",
  userId: Id<"users">,
  cap: number
): Promise<number> {
  const rows = await ctx.db
    .query(table)
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(cap + 1)
  return rows.length
}

/**
 * The per-asset half of the limits, shared by `create` and `update` because an
 * edit that replaces a 1 KB note with a 400 MB file is an add in everything but
 * name. `type` is absent on an update — that column cannot change.
 */
function assertPayloadAllowed(
  limits: PlanLimits,
  plan: PlanId,
  payload: { type?: Doc<"assets">["type"]; byteSize: number }
): void {
  if (payload.type === "photos" && !limits.photos) {
    refuse("photos", plan)
  }
  if (limits.maxFileBytes !== null && payload.byteSize > limits.maxFileBytes) {
    refuse("fileSize", plan)
  }
}

/**
 * Everything the plan has to say about a new asset. The lapse rule is *not*
 * here: `assets.create` asserts that separately and first, so a lapsed owner
 * is told to renew rather than to upgrade.
 */
export async function assertCanAddAsset(
  ctx: QueryCtx,
  user: Doc<"users">,
  now: number,
  asset: { type: Doc<"assets">["type"]; byteSize: number }
): Promise<void> {
  const plan = planOf(user)
  const limits = await limitsFor(ctx, user, now)

  assertPayloadAllowed(limits, plan, asset)
  assertStorageHeadroom(user, limits, plan, asset.byteSize)

  if (limits.assets !== null) {
    const count = await countUpTo(ctx, "assets", user._id, limits.assets)
    if (count >= limits.assets) {
      refuse("assets", plan)
    }
  }
}

/**
 * The growth half of an edit. Called only when the payload got bigger, so an
 * owner already over quota can still rename, re-route, shrink or re-wrap what
 * they have — a vault that cannot be repaired after a plan change would be a
 * worse outcome than one that is slightly over.
 */
export async function assertEditWithinLimits(
  ctx: QueryCtx,
  user: Doc<"users">,
  now: number,
  edit: { byteSize: number; addedBytes: number }
): Promise<void> {
  const plan = planOf(user)
  const limits = await limitsFor(ctx, user, now)

  assertPayloadAllowed(limits, plan, { byteSize: edit.byteSize })
  assertStorageHeadroom(user, limits, plan, edit.addedBytes)
}

function assertStorageHeadroom(
  user: Doc<"users">,
  limits: PlanLimits,
  plan: PlanId,
  addedBytes: number
): void {
  if (limits.storageBytes === null || addedBytes <= 0) {
    return
  }
  const used = storageUsed(user)
  if (used + addedBytes > limits.storageBytes) {
    refuse("storage", plan)
  }
}

/**
 * Deliberately not lapse-gated beyond the free limits it inherits: naming who
 * should receive your vault is the product working, and a card that expired
 * last night is not a reason to stop someone recording a daughter's name.
 */
export async function assertCanAddHeir(
  ctx: QueryCtx,
  user: Doc<"users">,
  now: number
): Promise<void> {
  const plan = planOf(user)
  const limits = await limitsFor(ctx, user, now)
  if (limits.heirs === null) {
    return
  }
  const count = await countUpTo(ctx, "heirs", user._id, limits.heirs)
  if (count >= limits.heirs) {
    refuse("heirs", plan)
  }
}

/** What ٩.٤ draws its meter and its counters from. `null` counts are uncapped. */
export async function usageFor(
  ctx: QueryCtx,
  user: Doc<"users">,
  limits: PlanLimits
): Promise<{
  storageBytesUsed: number
  assets: number | null
  heirs: number | null
}> {
  return {
    storageBytesUsed: storageUsed(user),
    assets:
      limits.assets === null
        ? null
        : await countUpTo(ctx, "assets", user._id, limits.assets),
    heirs:
      limits.heirs === null
        ? null
        : await countUpTo(ctx, "heirs", user._id, limits.heirs),
  }
}
