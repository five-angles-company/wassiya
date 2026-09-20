// The plan catalogue.
//
// Limits resolve through three layers, most specific first:
//
//   1. `users.limitsOverride` — this one account, field by field.
//   2. the `plans` row for the account's plan — editable from the console.
//   3. `PLAN_DEFAULTS` below — what a deployment with no rows runs on.
//
// The third layer is not a formality. A missing row must never be able to take
// the product down, and a fresh deployment has none: without a code-side
// default, the first owner to open the app on a new deployment would meet a
// crash instead of a vault.
//
// Two rules survive the catalogue becoming editable, and both have been broken
// once already:
//
//   - **No client ever writes a limit down.** `plans.current` serves them, and
//     every screen and every string interpolates what it is given.
//     `DEFAULT_QUOTA_BYTES` on ٩.٤ was a client constant claiming 5 GB while
//     the server enforced nothing.
//   - **There is no price here, or in the table.** Prices are set per
//     storefront and rendered from the store's own `priceString`. A price in
//     this repo would be wrong in every country but one, and stale in that one.
//
// `null` means unlimited. Convex serialises `Infinity` as a string, so a limit
// that reaches the client as `"Infinity"` renders as garbage and compares as
// NaN — `null` is the only wire-safe way to say "no cap".
import type { Doc } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"

// Decimal, not binary: the storage meter on ٩.٤ formats in powers of 1000,
// and a 500 MB tier that rendered as "٥٢٤" beside a paywall saying "٥٠٠" is
// the bar-and-legend disagreement this product already refuses once.
const MB = 1_000_000
const GB = 1000 * MB

export const PLAN_IDS = ["free", "annual"] as const
export type PlanId = (typeof PLAN_IDS)[number]

export type PlanLimits = {
  /** Total encrypted payload across every asset. */
  storageBytes: number | null
  assets: number | null
  heirs: number | null
  /** Whether the `photos` asset type may be created at all. */
  photos: boolean
  /**
   * Ceiling on a single asset's payload. Without it "no photos" is a formality
   * — a 400 MB video files perfectly well as a `document`.
   */
  maxFileBytes: number | null
}

export const PLAN_DEFAULTS: Record<PlanId, PlanLimits> = {
  free: {
    storageBytes: 500 * MB,
    assets: 5,
    heirs: 1,
    photos: false,
    maxFileBytes: 10 * MB,
  },
  annual: {
    storageBytes: 100 * GB,
    assets: null,
    heirs: null,
    photos: true,
    maxFileBytes: 2 * GB,
  },
}

export function isPlanId(value: string): value is PlanId {
  return (PLAN_IDS as readonly string[]).includes(value)
}

export function planOf(user: Doc<"users">): PlanId {
  return user.subscription?.plan ?? "free"
}

/**
 * A paid plan whose `renewsAt` has passed. There is deliberately no grace
 * period: the store's own retry window already is one, and a second grace on
 * top of it is a month of service nobody was paid for.
 */
export function isLapsed(user: Doc<"users">, now: number): boolean {
  const renewsAt = user.subscription?.renewsAt
  return renewsAt !== undefined && renewsAt < now
}

/** A plan's published limits: its row if it has one, the defaults if not. */
export async function limitsOfPlan(
  ctx: QueryCtx,
  plan: PlanId
): Promise<PlanLimits> {
  const row = await ctx.db
    .query("plans")
    .withIndex("by_key", (q) => q.eq("key", plan))
    .first()
  if (row === null) {
    return PLAN_DEFAULTS[plan]
  }
  return {
    storageBytes: row.storageBytes,
    assets: row.assets,
    heirs: row.heirs,
    photos: row.photos,
    maxFileBytes: row.maxFileBytes,
  }
}

/**
 * What this account is actually held to.
 *
 * **A lapsed subscription is not an entitlement.** A lapsed owner falls to the
 * free plan's limits, which is what makes the rule statable in one line instead
 * of one line per call site.
 *
 * It does not take anything away: the limits gate *adding*, never reading, and
 * never release. An owner already over them — because they lapsed, or because
 * a tier was lowered under them — keeps every asset and every heir and simply
 * cannot add the next one. That asymmetry is the whole subscription-lapse
 * promise, and it is why the asset path still calls `assertCanAddAssets`
 * separately: a lapse deserves "renew", not "upgrade".
 *
 * The per-account override is applied last and field by field, so raising one
 * owner's storage does not silently hand them every other paid limit too.
 */
export async function limitsFor(
  ctx: QueryCtx,
  user: Doc<"users">,
  now: number
): Promise<PlanLimits> {
  const base = await limitsOfPlan(ctx, isLapsed(user, now) ? "free" : planOf(user))
  const override = user.limitsOverride
  if (override === undefined) {
    return base
  }
  // `??` would be wrong here and quietly so: an override of `null` means
  // *unlimited*, and `null ?? base` hands back the base. Only `undefined`
  // means "not overridden", which is the whole reason the override's fields are
  // optional rather than nullable.
  return {
    storageBytes: pick(override.storageBytes, base.storageBytes),
    assets: pick(override.assets, base.assets),
    heirs: pick(override.heirs, base.heirs),
    photos: pick(override.photos, base.photos),
    maxFileBytes: pick(override.maxFileBytes, base.maxFileBytes),
  }
}

function pick<T>(override: T | undefined, base: T): T {
  return override === undefined ? base : override
}

/**
 * The storage counter, with its legacy home as a fallback: it lived inside
 * `subscription` until the catalogue landed, and `billing` is now the only
 * writer allowed in that object. Reading through one function means the day the
 * old field is deleted is a one-line day.
 */
export function storageUsed(user: Doc<"users">): number {
  return user.storageBytesUsed ?? user.subscription?.storageBytesUsed ?? 0
}
