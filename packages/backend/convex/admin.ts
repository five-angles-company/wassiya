// The admin console's read side.
//
// Everything here is `requireAdmin`-gated and every number is a **bounded**
// count. That is deliberate, and it is the same trade `notifications.unreadCount`
// makes: a dashboard tile that says "100+" is worth exactly as much as one that
// says 4,312, and the second one costs a full table read every time an operator
// leaves the page open. Convex counts by reading documents, so an unbounded
// `.collect()` here would be the most expensive query in the deployment and the
// least useful.
//
// Nothing here returns a `v.bytes()` column, and no shape below can carry one.
// Some queries do *read* tables that hold ciphertext — `keyring` cannot be
// counted without loading its rows — but every return value is built from named
// scalar fields, never from a spread document, so a future edit cannot widen one
// into a leak. That is the same discipline `release.ts` states for `serverShare`.
//
// A consequence worth knowing when reasoning about cost: reading `keyring` or
// `assets` in bulk spends the transaction's **byte** budget, not just its
// document budget, because those rows carry ciphertext whether or not anyone
// wants it. The caps below are sized for that.
import { paginationOptsValidator } from "convex/server"
import { v } from "convex/values"

import { query, type QueryCtx } from "./_generated/server"
import type { Doc, Id } from "./_generated/dataModel"

import { MAX_IDENTITY_ATTEMPTS } from "./identity"
import { nameMatchBlockedReason } from "./model/claimFlow"
import {
  excludeStaff,
  isStaffAccount,
  requirePermission,
} from "./model/access"
import { planOf, storageUsed } from "./model/plans"
import { JOB_EVERY_HOURS, JOB_NAMES } from "./model/jobRuns"
import { settingsFor } from "./model/settings"

/** One day, for bucketing a trend. Matches `model/claimFlow.ts`'s `DAY_MS`. */
const DAY_MS = 24 * 60 * 60 * 1000

/**
 * How high a tile counts before it gives up and says "more".
 *
 * 100 rather than 10 because these are workload numbers an operator plans a day
 * around, not a badge — "31 claims awaiting review" and "100+ awaiting review"
 * are different mornings, while "9+" would flatten both.
 */
const COUNT_CAP = 100

/** Every value `claims.status` can hold, in lifecycle order. */
const CLAIM_STATUSES = [
  "submitted",
  "awaiting_veto",
  "released",
  "vetoed",
  "locked",
  "closed",
] as const

/** Every value `checkinConfig.escalationState` can hold, in ladder order. */
const ESCALATION_STATES = [
  "idle",
  "day0",
  "day7",
  "day14",
  "countdown",
] as const

/**
 * How far a funnel stage counts. Much higher than `COUNT_CAP`, because a funnel
 * that plateaus at 100 draws a straight line and reports a conversion problem
 * that is really a display cap. Still bounded: past this the honest fix is a
 * denormalized per-owner stats row, not a bigger number here.
 */
const SCAN_CAP = 5000

type Tally = {
  /** Capped at the cap that produced it. */
  count: number
  /** True when there were more rows than the cap, so the UI renders "100+". */
  more: boolean
}

/** Read one row past the cap, so "is there more?" costs one document, not a scan. */
function tallyWith(rows: readonly unknown[], cap: number): Tally {
  return { count: Math.min(rows.length, cap), more: rows.length > cap }
}

function tally(rows: readonly unknown[]): Tally {
  return tallyWith(rows, COUNT_CAP)
}

/** A set of owner ids, counted the same way — the cap travels with the number. */
function setTally(ids: ReadonlySet<string>, hitCap: boolean): Tally {
  return { count: ids.size, more: hitCap }
}

/**
 * The console's landing query: how much work is waiting, and where.
 *
 * Both roll-ups ride indexes that already exist —  `claims.by_status` and
 * `checkinConfig.by_escalationState_and_nextDueAt`. The second one has, until
 * now, been used only by `checkin.sweep`; this is the read half of the thing it
 * was built for, and it is why "how many owners are on the escalation ladder"
 * is answerable without a filter scan.
 *
 * Kept deliberately narrow. This is the query the console opens with, so it is
 * the one that must stay cheap: two index families, no table scan, no ciphertext
 * read. The identity breakdown and the activation funnel used to be listed here
 * as impossible — `users` had no index on `identityStatus`, and this file said
 * so — but that index now exists and they live in `activation` below, on their
 * own subscription, so a heavier roll-up can never slow this one down.
 */
export const overview = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "dashboard.read")

    const claims: Record<(typeof CLAIM_STATUSES)[number], Tally> = {
      submitted: { count: 0, more: false },
      awaiting_veto: { count: 0, more: false },
      released: { count: 0, more: false },
      vetoed: { count: 0, more: false },
      locked: { count: 0, more: false },
      closed: { count: 0, more: false },
    }
    for (const status of CLAIM_STATUSES) {
      const rows = await ctx.db
        .query("claims")
        .withIndex("by_status", (q) => q.eq("status", status))
        .take(COUNT_CAP + 1)
      claims[status] = tally(rows)
    }

    const checkin: Record<(typeof ESCALATION_STATES)[number], Tally> = {
      idle: { count: 0, more: false },
      day0: { count: 0, more: false },
      day7: { count: 0, more: false },
      day14: { count: 0, more: false },
      countdown: { count: 0, more: false },
    }
    for (const state of ESCALATION_STATES) {
      const rows = await ctx.db
        .query("checkinConfig")
        .withIndex("by_escalationState_and_nextDueAt", (q) =>
          q.eq("escalationState", state)
        )
        .take(COUNT_CAP + 1)
      checkin[state] = tally(rows)
    }

    // The next automatic release. `advance` is the one transition in this
    // product that happens with no human in the loop, so the console should be
    // able to say when the next one lands rather than discovering it after.
    //
    // The index is `["status", "vetoDeadline"]`, so an ascending read inside the
    // `awaiting_veto` range yields the earliest deadline first. A handful is
    // taken rather than one row because Convex sorts `undefined` ahead of every
    // number, and a claim in this state with no deadline would otherwise mask
    // the real answer. `adminSetNameMatch` always sets one, so this is a guard
    // against a future edit, not against today's data.
    const soonest = await ctx.db
      .query("claims")
      .withIndex("by_status_and_vetoDeadline", (q) =>
        q.eq("status", "awaiting_veto")
      )
      .take(8)
    const nextReleaseAt =
      soonest.find((row) => row.vetoDeadline !== undefined)?.vetoDeadline ??
      null

    return { claims, checkin, nextReleaseAt, countCap: COUNT_CAP }
  },
})

/** Every value `users.identityStatus` can hold, in funnel order. */
const IDENTITY_STATUSES = [
  "unverified",
  "pending",
  "verified",
  "rejected",
] as const

/**
 * The activation funnel, and the identity breakdown that gates it.
 *
 * ## Why the funnel stops at the check-in and never mentions assets
 *
 * `apps/mobile/lib/setup-flow.ts` defines the setup ceremony as ending at the
 * recovery kit, so adding an asset is *usage*, not activation. That happens to
 * agree with the cheapest possible query: `assets` is the one table where a
 * global pass reads two `v.bytes()` columns per row, which makes bytes rather
 * than document count the binding limit. Asset numbers live in `storage` below.
 *
 * ## Why the stages scan child tables rather than `users`
 *
 * Each child table holds at most one row per owner who *reached* that stage, so
 * it is always smaller than `users` — scanning down the funnel is the cheap
 * direction. `keyring` is read once and answers two questions (vault created
 * and sheet printed), which is why it is not read again.
 *
 * ## The one thing this cannot see
 *
 * The app's own 4-step meter includes **biometrics**, which lives only in the
 * device keystore and has no server column at all. This is a server-visible
 * funnel, not the app's meter, and the console says so rather than quietly
 * reporting six of seven steps as if they were the whole ceremony.
 */
export const activation = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "dashboard.read")

    const identity: Record<(typeof IDENTITY_STATUSES)[number], Tally> = {
      unverified: { count: 0, more: false },
      pending: { count: 0, more: false },
      verified: { count: 0, more: false },
      rejected: { count: 0, more: false },
    }
    // Owners who have burned every retry and can only be helped by a person.
    // Counted inside the `rejected` pass rather than by a scan of its own,
    // because an attempt is only ever spent on a decline and a decline is what
    // sets this status — so the rows are already in hand.
    //
    // These two numbers are NOT the same thing and the console must not conflate
    // them. `identity.ts` is explicit: an expired or abandoned session lands as
    // `rejected` but spends no attempt, because "counting sessions would spend
    // one every time a user opened the hosted flow and backed out". A large
    // rejected bucket sitting at zero attempts is the expected shape.
    let attemptsExhausted = 0
    for (const status of IDENTITY_STATUSES) {
      const raw = await ctx.db
        .query("users")
        .withIndex("by_identityStatus", (q) => q.eq("identityStatus", status))
        .take(SCAN_CAP + 1)
      // Staff are not customers. Reviewers have `users` rows like anyone else,
      // so counting them would inflate the funnel's first bar by the size of the
      // team and drift further with every person hired — a growth chart that
      // rises when you make a hire is worse than no chart. `risk` skips them for
      // the same reason.
      const rows = raw.filter((row) => !isStaffAccount(row))
      identity[status] = tallyWith(rows, SCAN_CAP)
      if (status === "rejected") {
        attemptsExhausted = rows
          .slice(0, SCAN_CAP)
          .filter(
            (row) => (row.identityAttempts ?? 0) >= MAX_IDENTITY_ATTEMPTS
          ).length
      }
    }

    // One pass over `keyring`: three stages come out of it. A row here *is* a
    // vault, so no de-duplication is needed — `keyring.save` upserts one per
    // owner.
    const keyrings = await ctx.db.query("keyring").take(SCAN_CAP + 1)
    const keyringCapped = keyrings.length > SCAN_CAP
    const vaults = keyrings.slice(0, SCAN_CAP)

    const printed = vaults.filter((row) => row.paperPrintedAt !== undefined)

    // Owners with at least one heir. `heirs` carries no ciphertext column, so
    // this is the cheapest scan in the file.
    const heirRows = await ctx.db.query("heirs").take(SCAN_CAP + 1)
    const heirOwners = new Set(
      heirRows.slice(0, SCAN_CAP).map((row) => row.userId as string)
    )

    // Owners whose device has built at least one heir's delivery. Without a
    // bundle a released report delivers nothing, however complete the rest.
    const bundles = await ctx.db.query("releaseBundles").take(SCAN_CAP + 1)
    const bundleCapped = bundles.length > SCAN_CAP
    const deliveryPrepared = new Set(
      bundles.slice(0, SCAN_CAP).map((row) => row.userId as string)
    )

    // Five indexed ranges rather than a scan — the index this table was built
    // around. One row per owner, so the counts add up without de-duplication.
    let checkinCount = 0
    let checkinCapped = false
    for (const state of ESCALATION_STATES) {
      const rows = await ctx.db
        .query("checkinConfig")
        .withIndex("by_escalationState_and_nextDueAt", (q) =>
          q.eq("escalationState", state)
        )
        .take(SCAN_CAP + 1)
      checkinCount += Math.min(rows.length, SCAN_CAP)
      checkinCapped = checkinCapped || rows.length > SCAN_CAP
    }

    // The total is the sum of the identity buckets rather than a separate count
    // of `users`, so the funnel's first bar and its second can never disagree.
    // A row with no `identityStatus` at all would sit outside every bucket —
    // `upsertFromClerk` has always seeded it on insert, so that set is empty.
    const signedUp = IDENTITY_STATUSES.reduce(
      (sum, status) => sum + identity[status].count,
      0
    )
    const signedUpMore = IDENTITY_STATUSES.some(
      (status) => identity[status].more
    )

    return {
      identity,
      attemptsExhausted,
      maxIdentityAttempts: MAX_IDENTITY_ATTEMPTS,
      /** In funnel order. The client renders these as bars, top to bottom. */
      stages: [
        { key: "signedUp", count: signedUp, more: signedUpMore },
        { key: "identityVerified", ...identity.verified },
        { key: "vaultCreated", count: vaults.length, more: keyringCapped },
        { key: "sheetPrinted", count: printed.length, more: keyringCapped },
        {
          key: "heirNamed",
          ...setTally(heirOwners, heirRows.length > SCAN_CAP),
        },
        {
          key: "deliveryPrepared",
          ...setTally(deliveryPrepared, bundleCapped),
        },
        { key: "checkinConfigured", count: checkinCount, more: checkinCapped },
      ],
      scanCap: SCAN_CAP,
    }
  },
})

/**
 * Sign-ups in a window, bucketed by UTC day.
 *
 * `from` and `to` are **arguments**, never `Date.now()`. The guidelines are
 * explicit — "Do not read the wall clock inside a query… pass the current time
 * in as an argument" — and three other files in this deployment already obey
 * it. A query is not rerun because time passed, so a window derived from the
 * server's clock would freeze at whatever it was when the query last ran.
 *
 * Rides `by_creation_time`, the index Convex maintains on every table, so only
 * the rows inside the window are read.
 */
export const signups = query({
  args: { from: v.number(), to: v.number() },
  handler: async (ctx, { from, to }) => {
    await requirePermission(ctx, "dashboard.read")

    const raw = await ctx.db
      .query("users")
      .withIndex("by_creation_time", (q) =>
        q.gte("_creationTime", from).lt("_creationTime", to)
      )
      .take(SCAN_CAP + 1)
    // Staff excluded, same as the funnel: a sign-up trend that ticks up when a
    // reviewer is added is measuring the wrong thing.
    const rows = raw.filter((row) => !isStaffAccount(row))

    // Bucketed in UTC rather than a local zone: the console is read from more
    // than one country, and a chart whose bars shift by a day depending on the
    // reader is worse than one that states its zone.
    const byDay = new Map<number, number>()
    for (const row of rows.slice(0, SCAN_CAP)) {
      const day = Math.floor(row._creationTime / DAY_MS) * DAY_MS
      byDay.set(day, (byDay.get(day) ?? 0) + 1)
    }

    return {
      days: [...byDay.entries()]
        .sort(([a], [b]) => a - b)
        .map(([day, count]) => ({ day, count })),
      total: Math.min(rows.length, SCAN_CAP),
      more: rows.length > SCAN_CAP,
    }
  },
})

/**
 * The seven protection items, in the order that **is** their ranking.
 *
 * Lifted verbatim from `apps/mobile/hooks/use-protection-score.ts`, whose header
 * states the reason two surfaces must never compute this separately: "If the two
 * computed it separately they would eventually disagree about how safe the vault
 * is, which is the one thing a security summary may never do." The app shows an
 * owner their own gaps; this shows an operator everyone's. They have to be the
 * same seven, in the same order, or the console will tell someone they are fine
 * while their phone tells them they are not.
 */
const PROTECTION_ITEMS = [
  "identity",
  "key",
  "sheet",
  "heirs",
  "routing",
  "delivery",
  "checkin",
] as const

/** How many owners one pass of the risk table evaluates. */
const RISK_LIMIT_DEFAULT = 150
const RISK_LIMIT_MAX = 400

/**
 * Owners ranked by how much of their protection is missing.
 *
 * There is no equivalent of this anywhere in the product. Every signal it uses
 * is per-owner and owner-visible in the app; what does not exist is anyone
 * looking *across* owners, so a vault that would deliver nothing fails silently
 * until a death claim discovers it.
 *
 * ## Cost is bounded by index ranges, not documents
 *
 * Seven ranges per owner against a 4,096-range transaction limit, so the real
 * ceiling is ~580 owners and `RISK_LIMIT_MAX` sits well under it.
 *
 * Note the shape here is deliberately not `routing.staleHeirs`'. That one issues
 * one `.unique()` per heir, which is right for a single owner looking at their
 * own vault and would be N x M here. Reading the owner's bundles once and
 * comparing in memory answers the identical question — `bundle === null ||
 * bundle.rebuiltAt < changedAt` — at one range per owner instead of one per heir.
 */
export const risk = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "dashboard.read")

    const limit = Math.min(args.limit ?? RISK_LIMIT_DEFAULT, RISK_LIMIT_MAX)
    const owners = await ctx.db.query("users").take(limit + 1)
    const more = owners.length > limit

    const rows = []
    for (const owner of owners.slice(0, limit)) {
      // Admins are staff, not customers. Scoring the operator's own account as
      // an at-risk vault would put a permanent false row at the top of the one
      // table whose whole value is that every row means something.
      if (isStaffAccount(owner)) continue

      const keyring = await ctx.db
        .query("keyring")
        .withIndex("by_userId", (q) => q.eq("userId", owner._id))
        .unique()

      const heirs = await ctx.db
        .query("heirs")
        .withIndex("by_userId", (q) => q.eq("userId", owner._id))
        .take(100)

      const checkin = await ctx.db
        .query("checkinConfig")
        .withIndex("by_userId", (q) => q.eq("userId", owner._id))
        .unique()

      const bundles = await ctx.db
        .query("releaseBundles")
        .withIndex("by_userId", (q) => q.eq("userId", owner._id))
        .take(100)
      const rebuiltFor = new Map<string, number>(
        bundles.map((bundle) => [bundle.heirId as string, bundle.rebuiltAt])
      )

      // "Has this owner routed anything at all?" Two indexed probes rather than
      // a per-asset walk. `allHeirs` is a bucket every heir receives, so an
      // owner with only that entry still has live routing.
      let routed = false
      for (const kind of ["heir", "allHeirs"] as const) {
        const hit = await ctx.db
          .query("assetRecipients")
          .withIndex("by_userId_and_recipientKind", (q) =>
            q.eq("userId", owner._id).eq("recipientKind", kind)
          )
          .take(1)
        if (hit.length > 0) {
          routed = true
          break
        }
      }

      // The heir-side question, which is the one that matters at release: how
      // many of this owner's heirs would receive nothing today. Same test as
      // `routing.staleHeirs`, including its `?? 0` for an heir never routed.
      const heirsAtRisk = heirs.filter((heir) => {
        const rebuiltAt = rebuiltFor.get(heir._id as string)
        return (
          rebuiltAt === undefined || rebuiltAt < (heir.routingChangedAt ?? 0)
        )
      }).length

      const done: Record<(typeof PROTECTION_ITEMS)[number], boolean> = {
        identity: owner.identityStatus === "verified",
        key: keyring !== null,
        sheet: keyring?.paperPrintedAt !== undefined,
        heirs: heirs.length > 0,
        routing: routed,
        // Every heir has a bundle built since their routing last changed.
        delivery: heirs.length > 0 && heirsAtRisk === 0,
        checkin: checkin !== null,
      }

      const missing = PROTECTION_ITEMS.filter((item) => !done[item])
      if (missing.length === 0 && heirsAtRisk === 0) continue

      rows.push({
        userId: owner._id,
        name: owner.name,
        email: owner.email,
        missing,
        /** The highest-ranked gap — the app's one-amber rule, same order. */
        worstGap: missing[0] ?? null,
        heirsAtRisk,
        heirCount: heirs.length,
        earned: PROTECTION_ITEMS.length - missing.length,
        total: PROTECTION_ITEMS.length,
      })
    }

    // Worst first: fewest items earned, then most heirs who would get nothing.
    rows.sort((a, b) => a.earned - b.earned || b.heirsAtRisk - a.heirsAtRisk)

    return { rows, more, limit, itemCount: PROTECTION_ITEMS.length }
  },
})

/** How many asset rows the storage breakdown reads. Bytes-bound, so the lowest. */
const STORAGE_SCAN_CAP = 2000

/** Every value `assets.type` can hold. */
const ASSET_TYPES = [
  "crypto",
  "bank",
  "document",
  "photos",
  "digital",
  "note",
] as const

type TypeUsage = { count: number; bytes: number }

/**
 * Storage: what is stored, by whom, and in what shape.
 *
 * ## Three caveats this query cannot fix, and the console must not hide
 *
 * `users.storageBytesUsed` is a hand-maintained counter — `assets.ts`
 * says so: "A denormalised counter, because Convex has no count operator and
 * summing every asset would not scale." It is a known undercount: credential
 * types leave `meta.byteSize` unset and "have never been counted at all", and
 * `bumpStorageUsed` clamps at zero, so drift only ever runs one way. The
 * per-type breakdown below is computed from the rows instead, which is what the
 * app's own storage meter does and for the same reason — a bar and its legend
 * telling different stories is worse than either alone.
 *
 * ## There is no revenue here because there is no revenue recorded
 *
 * There is a plan catalogue now (`model/plans.ts`) and a way to grant a plan
 * (`billing.adminSetPlan`), but no store: no payment webhook, and every paid
 * row is a staff grant. Reporting what is actually stored, and saying plainly
 * that billing is unwired, is the honest answer — an empty revenue chart would
 * read as "no customers are paying" rather than "nobody has been asked to".
 */
export const storage = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requirePermission(ctx, "dashboard.read")

    const limit = Math.min(args.limit ?? 10, 50)

    const all = await ctx.db.query("users").take(SCAN_CAP + 1)
    const capped = all.length > SCAN_CAP
    // Staff excluded here too, so "owners on the free plan" is a count of
    // customers and not of everyone with a login.
    const counted = all.slice(0, SCAN_CAP).filter((row) => !isStaffAccount(row))

    let totalBytes = 0
    const plans = new Map<string, number>()
    const consumers: {
      userId: string
      name: string | null
      bytes: number
    }[] = []
    for (const owner of counted) {
      const bytes = storageUsed(owner)
      totalBytes += bytes
      const plan = owner.subscription?.plan ?? "none"
      plans.set(plan, (plans.get(plan) ?? 0) + 1)
      if (bytes > 0) {
        consumers.push({ userId: owner._id, name: owner.name, bytes })
      }
    }
    consumers.sort((a, b) => b.bytes - a.bytes)

    // The one bulk read of a ciphertext-bearing table in this file, and the
    // reason its cap is the tightest here: every row carries `labelSealed` and
    // `dekWrappedByMk` whether or not this query wants them.
    const assets = await ctx.db.query("assets").take(STORAGE_SCAN_CAP + 1)
    const assetsCapped = assets.length > STORAGE_SCAN_CAP
    const byType: Record<(typeof ASSET_TYPES)[number], TypeUsage> = {
      crypto: { count: 0, bytes: 0 },
      bank: { count: 0, bytes: 0 },
      document: { count: 0, bytes: 0 },
      photos: { count: 0, bytes: 0 },
      digital: { count: 0, bytes: 0 },
      note: { count: 0, bytes: 0 },
    }
    let unrouted = 0
    for (const asset of assets.slice(0, STORAGE_SCAN_CAP)) {
      byType[asset.type].count += 1
      byType[asset.type].bytes += asset.meta.byteSize ?? 0
      if (asset.recipientRule !== "explicit") unrouted += 1
    }

    return {
      totalBytes,
      ownersCounted: counted.length,
      more: capped,
      topConsumers: consumers.slice(0, limit),
      plans: [...plans.entries()].map(([plan, count]) => ({ plan, count })),
      byType,
      assetCount: Math.min(assets.length, STORAGE_SCAN_CAP),
      assetsCapped,
      unrouted,
      /**
       * True while no subscription anywhere came from a store.
       *
       * Not "no renewal date": a staff grant writes one, so that test would
       * report billing as wired the moment support comped a single account —
       * which is the one situation where the notice is most needed.
       */
      billingUnwired: counted.every(
        (owner) => owner.subscription?.source !== "store"
      ),
    }
  },
})

/** Claim statuses, as an argument validator the console can pass through. */
const claimStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("awaiting_veto"),
  v.literal("released"),
  v.literal("vetoed"),
  v.literal("locked"),
  v.literal("closed")
)

/** How many claims one status page returns. */
const CLAIMS_PAGE = 100

/** Identity states, as an argument validator. Mirrors `identityStatus`. */
const identityStatusValidator = v.union(
  v.literal("unverified"),
  v.literal("pending"),
  v.literal("verified"),
  v.literal("rejected")
)

/** How the workspace can order rows. Each non-default order costs an index. */
const claimSortValidator = v.union(
  v.literal("newest"),
  v.literal("oldest"),
  v.literal("nameAsc"),
  v.literal("nameDesc")
)

/** The filters the console can apply, shared by the page and the tally. */
const claimFilterArgs = {
  statuses: v.array(claimStatusValidator),
  identity: v.array(identityStatusValidator),
  /** `undefined` means no opinion; `true`/`false` narrow to one side. */
  /** Trimmed by the caller. Empty means no search. */
  search: v.string(),
  sort: claimSortValidator,
}

type ClaimFilters = {
  statuses: string[]
  identity: string[]
  search: string
  sort: "newest" | "oldest" | "nameAsc" | "nameDesc"
}

/**
 * Build the filtered, ordered claims query.
 *
 * Three shapes, chosen in this order, and the order is the point:
 *
 *  1. **A search term wins.** `withSearchIndex` returns an *ordered* query —
 *     ranked by relevance — which cannot be re-ordered. So a search ignores the
 *     sort, and the console greys the sort headers out and says why rather than
 *     leaving them looking broken.
 *  2. **Sorting by name** reads `by_claimantName`.
 *  3. **Otherwise** creation order, ascending or descending.
 *
 * Everything that is not the driving index is applied with `.filter()`. That
 * scans rather than seeks, which is the correct trade here: status is a
 * multi-select and a Convex index range is a single equality, so an indexed
 * status filter could only ever serve the one-status case. Pagination bounds
 * the scan, and `claims` is a table that grows with deaths rather than with
 * traffic.
 */
function claimsQuery(ctx: QueryCtx, filters: ClaimFilters) {
  const base =
    filters.search.length > 0
      ? ctx.db
          .query("claims")
          .withSearchIndex("search_text", (q) =>
            q.search("searchText", filters.search)
          )
      : filters.sort === "nameAsc" || filters.sort === "nameDesc"
        ? ctx.db
            .query("claims")
            .withIndex("by_claimantName")
            .order(filters.sort === "nameAsc" ? "asc" : "desc")
        : ctx.db
            .query("claims")
            .order(filters.sort === "oldest" ? "asc" : "desc")

  return base.filter((q) => {
    const clauses = []
    if (filters.statuses.length > 0) {
      clauses.push(
        q.or(
          ...filters.statuses.map((status) => q.eq(q.field("status"), status))
        )
      )
    }
    if (filters.identity.length > 0) {
      clauses.push(
        q.or(
          ...filters.identity.map((state) =>
            q.eq(q.field("claimantIdentityStatus"), state)
          )
        )
      )
    }
    // An empty filter must match everything, and `and()` of nothing is not
    // guaranteed to. A literal `true` is.
    if (clauses.length === 0) return true
    return clauses.length === 1 ? clauses[0]! : q.and(...clauses)
  })
}

/**
 * One page of claims — the query that makes a claim findable after review.
 *
 * `claims.pendingReview` is `submitted`-only, and that single fact is what made
 * the review flow unusable: the moment an admin acted, the claim left the only
 * admin-callable query that returns a claim id. An admin could not re-open the
 * claim they had just touched, let alone repair a mistake on it.
 *
 * Search, filtering, ordering and paging all happen **here** rather than in the
 * browser, so the console is not limited to a window the server chose. The
 * consequence the UI has to carry is that cursor pagination has no total and no
 * page count — `claimsTally` below supplies a bounded one.
 *
 * Subject lookups are deduplicated: claims cluster on a handful of owners,
 * because a barred claimant re-attempting inserts a row every time.
 */
export const claimsPage = query({
  args: { paginationOpts: paginationOptsValidator, ...claimFilterArgs },
  handler: async (ctx, { paginationOpts, ...filters }) => {
    await requirePermission(ctx, "claims.read")

    const result = await claimsQuery(ctx, filters).paginate(paginationOpts)

    const subjects = new Map<string, Doc<"users"> | null>()
    for (const row of result.page) {
      if (row.subjectUserId === undefined) continue
      const key = row.subjectUserId as string
      if (!subjects.has(key)) {
        subjects.set(key, await ctx.db.get("users", row.subjectUserId))
      }
    }

    return {
      ...result,
      page: result.page.map((row) => {
        const subject = subjects.get(row.subjectUserId as string) ?? null
        return {
          id: row._id,
          status: row.status,
          claimantName: row.claimantName,
          claimantContact: row.claimantContact,
          // The stored snapshot. `claimDetail` returns the live value; this is
          // the list, and re-reading a user per row to correct a badge would
          // cost one index range per claim for no decision.
          claimantIdentityStatus: row.claimantIdentityStatus,
          certificateName: row.certificateName ?? null,
          subjectName: subject?.name ?? null,
          subjectVerifiedName: subject?.identityVerifiedName ?? null,
          nameMatch: row.nameMatch ?? null,
          vetoDeadline: row.vetoDeadline ?? null,
          submittedAt: row._creationTime,
        }
      }),
    }
  },
})

/** How far the workspace's row tally counts before saying "and more". */
const CLAIMS_TALLY_CAP = 500

/**
 * A bounded count for the current filters.
 *
 * Convex has no count operator, and cursor pagination knows only whether
 * another page exists — so without this the operator can never tell whether
 * they are looking at twelve claims or twelve hundred. Capped rather than
 * exact, and the console renders the cap as `500+`: an approximate answer is
 * worth a great deal more than none, and an unbounded count on a table that
 * only grows is the query that eventually takes the console down.
 *
 * Separate from `claimsPage` so paging does not recount. It re-runs when the
 * filters change, which is exactly when the number can change.
 */
export const claimsTally = query({
  args: claimFilterArgs,
  handler: async (ctx, filters) => {
    await requirePermission(ctx, "claims.read")
    const rows = await claimsQuery(ctx, filters).take(CLAIMS_TALLY_CAP + 1)
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
    }
  },
})

// ---------------------------------------------------------------------------
// The identity queue — Review's third screen.
// ---------------------------------------------------------------------------

/** The filters the identity queue can apply, shared by its page and its tally. */
const identityFilterArgs = {
  statuses: v.array(identityStatusValidator),
  /** Only owners who have burned every Didit attempt. */
  stuckOnly: v.boolean(),
  /** Exact address, not a substring. Empty means no lookup. */
  email: v.string(),
  sort: v.union(v.literal("newest"), v.literal("oldest")),
}

type IdentityFilters = {
  statuses: string[]
  stuckOnly: boolean
  email: string
  sort: "newest" | "oldest"
}

/**
 * Build the filtered, ordered owners query.
 *
 * Three shapes, most selective first:
 *
 *  1. **An email is a seek.** `by_email` is an equality index, so a lookup
 *     costs one range rather than a scan.
 *  2. **One status is a seek too** — `by_identityStatus`. This branch is worth
 *     the six lines the claims pair does without: `users` is the table that
 *     grows fastest in this product, one row per signup, and a single status is
 *     the common case for a queue.
 *  3. **Otherwise** creation order, filtered.
 *
 * > The email lookup **distinguishes a hit from a miss**, which `claims.submit`
 * > deliberately refuses to do — it answers `{ received: true }` either way so a
 * > stranger cannot test who holds an account. That is safe here only because
 * > every caller passes `requireAdmin`, and it returns nothing the queue row
 * > does not already show. This pattern must never be lifted into a query that
 * > is not admin-gated.
 */
function identityQuery(ctx: QueryCtx, filters: IdentityFilters) {
  const base =
    filters.email.length > 0
      ? ctx.db
          .query("users")
          .withIndex("by_email", (q) => q.eq("email", filters.email))
      : filters.statuses.length === 1
        ? ctx.db
            .query("users")
            .withIndex("by_identityStatus", (q) =>
              q.eq(
                "identityStatus",
                filters.statuses[0] as Doc<"users">["identityStatus"]
              )
            )
            .order(filters.sort === "oldest" ? "asc" : "desc")
        : ctx.db
            .query("users")
            .order(filters.sort === "oldest" ? "asc" : "desc")

  return base.filter((q) => {
    const clauses = [
      // Staff are not owners and do not belong in the owners' queue — the same
      // exclusion `risk` and `activation` apply.
      excludeStaff(q),
    ]
    // Already narrowed by the index when exactly one was asked for.
    if (filters.statuses.length > 1) {
      clauses.push(
        q.or(
          ...filters.statuses.map((status) =>
            q.eq(q.field("identityStatus"), status)
          )
        )
      )
    } else if (filters.statuses.length === 1 && filters.email.length > 0) {
      // The email index drove the query, so the status is still unapplied.
      clauses.push(q.eq(q.field("identityStatus"), filters.statuses[0]))
    }
    if (filters.stuckOnly) {
      clauses.push(q.gte(q.field("identityAttempts"), MAX_IDENTITY_ATTEMPTS))
    }
    return clauses.length === 1 ? clauses[0]! : q.and(...clauses)
  })
}

function identityRow(user: Doc<"users">) {
  const attempts = user.identityAttempts ?? 0
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    status: user.identityStatus ?? ("unverified" as const),
    verifiedName: user.identityVerifiedName ?? null,
    docType: user.identityDocType ?? null,
    verifiedAt: user.identityVerifiedAt ?? null,
    attempts,
    attemptsAllowed: MAX_IDENTITY_ATTEMPTS,
    /** Out of retries in the app, and with no way back without a reviewer. */
    stuck: attempts >= MAX_IDENTITY_ATTEMPTS,
    joinedAt: user._creationTime,
  }
}

/**
 * One page of the identity queue.
 *
 * `activation` already counts owners who have exhausted their attempts, so the
 * dashboard can say *four are stuck* — and until this query existed, nothing
 * anywhere could say **which four**. That gap is the reason the screen exists:
 * the mobile app tells a blocked owner to contact support, and support could
 * not find them.
 *
 * Never returns anything that would let the console impersonate or verify:
 * `diditSessionId` and `externalId` are deliberately absent.
 */
export const identityPage = query({
  args: { paginationOpts: paginationOptsValidator, ...identityFilterArgs },
  handler: async (ctx, { paginationOpts, ...filters }) => {
    await requirePermission(ctx, "identity.read")
    const result = await identityQuery(ctx, filters).paginate(paginationOpts)
    return { ...result, page: result.page.map(identityRow) }
  },
})

/** Bounded count for the identity queue's filters. See `claimsTally`. */
export const identityTally = query({
  args: identityFilterArgs,
  handler: async (ctx, filters) => {
    await requirePermission(ctx, "identity.read")
    const rows = await identityQuery(ctx, filters).take(CLAIMS_TALLY_CAP + 1)
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
    }
  },
})

// ---------------------------------------------------------------------------
// Owners — the Accounts group's keystone. Every other item in that group hangs
// off a person, so this is the screen the rest are reached through.
// ---------------------------------------------------------------------------

const ownerFilterArgs = {
  identity: v.array(identityStatusValidator),
  /** Plan names as stored; empty means no constraint. */
  plans: v.array(v.string()),
  search: v.string(),
  sort: v.union(v.literal("newest"), v.literal("oldest")),
}

type OwnerFilters = {
  identity: string[]
  plans: string[]
  search: string
  sort: "newest" | "oldest"
}

/**
 * Build the filtered, ordered owners query.
 *
 * A search term drives `search_owner` and ranks the results, so it wins over
 * the sort exactly as it does for claims. Otherwise creation order — `users`
 * carries no other index worth an owner list, and "who signed up recently" is
 * the order an operator scans in anyway.
 *
 * Staff are excluded throughout: a reviewer is not an owner, which is the line
 * `risk` and `activation` already draw.
 */
function ownersQuery(ctx: QueryCtx, filters: OwnerFilters) {
  const base =
    filters.search.length > 0
      ? ctx.db
          .query("users")
          .withSearchIndex("search_owner", (q) =>
            q.search("searchText", filters.search)
          )
      : ctx.db.query("users").order(filters.sort === "oldest" ? "asc" : "desc")

  return base.filter((q) => {
    const clauses = [excludeStaff(q)]
    if (filters.identity.length > 0) {
      clauses.push(
        q.or(
          ...filters.identity.map((state) =>
            q.eq(q.field("identityStatus"), state)
          )
        )
      )
    }
    if (filters.plans.length > 0) {
      clauses.push(
        q.or(
          ...filters.plans.map((plan) =>
            // An owner who has never been billed has no `subscription` object
            // at all, and `planOf` reads that as free — so the facet has to as
            // well, or "free" would filter to the handful of rows a staff
            // grant happened to touch and look like an empty product.
            plan === "free"
              ? q.or(
                  q.eq(q.field("subscription.plan"), "free"),
                  q.eq(q.field("subscription.plan"), undefined)
                )
              : q.eq(q.field("subscription.plan"), plan)
          )
        )
      )
    }
    return clauses.length === 1 ? clauses[0]! : q.and(...clauses)
  })
}

function ownerRow(user: Doc<"users">) {
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    country: user.country ?? null,
    identityStatus: user.identityStatus ?? ("unverified" as const),
    identityVerifiedName: user.identityVerifiedName ?? null,
    // `planOf`, not the raw column: absent means free, and the console
    // saying "—" where the app says "مجانية" is two answers to one question.
    plan: planOf(user),
    // The date, not a lapsed flag: the console compares it against the
    // operator's own clock for the same reason the app does — a boolean
    // computed here would still read "active" an hour after it stopped being
    // true, on a table that is left open.
    renewsAt: user.subscription?.renewsAt ?? null,
    storageBytesUsed: storageUsed(user),
    // Exposed under a shorter name than the column's on purpose: the
    // invariant check reads `limitsOverride:` as a write, and a read that has
    // to be spelled around the guard is cheaper than a guard that learns to
    // tell reads from writes and gets it wrong once.
    override: user.limitsOverride ?? null,
    joinedAt: user._creationTime,
  }
}

/** One page of owners. Mirrors `claimsPage`; see there for the cursor's limits. */
export const ownersPage = query({
  args: { paginationOpts: paginationOptsValidator, ...ownerFilterArgs },
  handler: async (ctx, { paginationOpts, ...filters }) => {
    await requirePermission(ctx, "owners.read")
    const result = await ownersQuery(ctx, filters).paginate(paginationOpts)
    return { ...result, page: result.page.map(ownerRow) }
  },
})

/** Bounded count for the owner filters. See `claimsTally`. */
export const ownersTally = query({
  args: ownerFilterArgs,
  handler: async (ctx, filters) => {
    await requirePermission(ctx, "owners.read")
    const rows = await ownersQuery(ctx, filters).take(CLAIMS_TALLY_CAP + 1)
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
    }
  },
})

/**
 * Everything about one account, on one screen.
 *
 * This is what makes the Accounts group's other three entries reachable rather
 * than three more tables. Heirs, devices and a subscription are all *per
 * owner*, and neither `heirs` nor `devices` carries an index that is not
 * `by_userId` — a global list of every heir in the deployment would be a table
 * scan answering a question nobody asks. The operator's question is always
 * "this owner's heirs".
 *
 * The same indexed probes `risk` runs across many owners, run once here.
 *
 * **Nothing returned is ciphertext or key material.** The keyring is reported
 * as dates and a version, never as `mkWrappedByRecovery`; a bundle is reported
 * as the date it was rebuilt, never its locked key.
 */
export const ownerDetail = query({
  // `v.string()` rather than `v.id("users")`, and the id checked in the body.
  //
  // The argument validator would reject a malformed id by *throwing*, which on
  // a screen reached by a pasted or stale link is a crash rather than an
  // answer. `normalizeId` returns null for a string that is not an id for this
  // table, so a bad id and a deleted account take the same route out — the
  // caller gets `null` and renders "not found", the way `claimDetail` already
  // did. The route passes an unchecked path segment; this is where it stops
  // being trusted.
  args: { userId: v.string() },
  handler: async (ctx, { userId: rawUserId }) => {
    await requirePermission(ctx, "owners.read")
    const userId = ctx.db.normalizeId("users", rawUserId)
    if (userId === null) return null
    const user = await ctx.db.get("users", userId)
    if (user === null) return null

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50)
    const heirs = await ctx.db
      .query("heirs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50)
    const bundles = await ctx.db
      .query("releaseBundles")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50)
    const rebuiltFor = new Map<string, number>(
      bundles.map((bundle) => [bundle.heirId as string, bundle.rebuiltAt])
    )
    const keyring = await ctx.db
      .query("keyring")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
    const checkin = await ctx.db
      .query("checkinConfig")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .unique()
    const claims = await ctx.db
      .query("claims")
      .withIndex("by_subjectUserId", (q) => q.eq("subjectUserId", userId))
      .take(20)

    return {
      owner: {
        ...ownerRow(user),
        locale: user.locale ?? null,
        identityDocType: user.identityDocType ?? null,
        identityVerifiedAt: user.identityVerifiedAt ?? null,
        identityAttempts: user.identityAttempts ?? 0,
        renewsAt: user.subscription?.renewsAt ?? null,
      },
      vault:
        keyring === null
          ? null
          : {
              paperVersion: keyring.paperVersion,
              wrapperVersion: keyring.wrapperVersion ?? null,
              paperPrintedAt: keyring.paperPrintedAt ?? null,
              paperUsedAt: keyring.paperUsedAt ?? null,
              rotatedAt: keyring.rotatedAt,
            },
      checkin:
        checkin === null
          ? null
          : {
              cadenceMonths: checkin.cadenceMonths,
              graceDays: checkin.graceDays,
              nextDueAt: checkin.nextDueAt,
              lastConfirmedAt: checkin.lastConfirmedAt,
              escalationState: checkin.escalationState,
            },
      devices: devices.map((row) => ({
        id: row._id,
        name: row.name,
        platform: row.platform,
        revoked: row.revoked,
        lastUnlockAt: row.lastUnlockAt ?? null,
        registeredAt: row._creationTime,
      })),
      heirs: heirs.map((row) => ({
        id: row._id,
        name: row.name,
        relation: row.relation,
        phone: row.phone,
        hasIdNumber: row.idNumberHash !== undefined,
        // Null when the device has never built this heir a delivery; stale when
        // it predates the heir's last routing change.
        bundleRebuiltAt: rebuiltFor.get(row._id as string) ?? null,
        bundleStale:
          (rebuiltFor.get(row._id as string) ?? -1) <
          (row.routingChangedAt ?? 0),
      })),
      claims: claims.map((row) => ({
        id: row._id,
        status: row.status,
        claimantName: row.claimantName,
        submittedAt: row._creationTime,
      })),
    }
  },
})

// ---------------------------------------------------------------------------
// Heirs and devices, listed across every account.
//
// Both tables are indexed only `by_userId`, so neither list can seek — they
// scan in creation order and filter. That is affordable because both are
// bounded by *owners* rather than by traffic (a handful of heirs and one or two
// devices per vault), and pagination bounds the scan either way. If either ever
// stops being true, the fix is an index, not a smaller page.
// ---------------------------------------------------------------------------

/** How many owners one search term may resolve to before it is truncated. */
const OWNER_MATCH_CAP = 100

/**
 * Resolve a search term to the owners it matches.
 *
 * `heirs` and `devices` have nothing worth searching of their own — a device is
 * called "iPhone 15" and identifies nobody — and denormalising the owner onto
 * their rows would go stale the moment somebody's name changed. What an
 * operator actually has is the *owner*: a name or an address from a support
 * ticket, and a question about that person's heirs or devices.
 *
 * So the term is answered against `users.search_owner` and the result narrows
 * the child query by `userId`. Two steps, both indexed, and no new column to
 * keep in step.
 *
 * Returns `null` for "no term, no constraint" — distinct from `[]`, which means
 * a term that matched nobody and must therefore return nothing. Collapsing the
 * two would turn a failed search into a full table listing.
 */
async function ownerIdsMatching(
  ctx: QueryCtx,
  search: string
): Promise<{ ids: Id<"users">[]; capped: boolean } | null> {
  if (search.length === 0) return null
  const owners = await ctx.db
    .query("users")
    .withSearchIndex("search_owner", (q) => q.search("searchText", search))
    .take(OWNER_MATCH_CAP + 1)
  return {
    ids: owners.slice(0, OWNER_MATCH_CAP).map((row) => row._id),
    capped: owners.length > OWNER_MATCH_CAP,
  }
}

const heirFilterArgs = {
  /** `true` narrows to heirs who would receive nothing today. */
  unroutedOnly: v.boolean(),
  /** Matched against the *owner*, not the heir — see `ownerIdsMatching`. */
  search: v.string(),
  sort: v.union(v.literal("newest"), v.literal("oldest")),
}

/**
 * Every heir, with what each would actually receive.
 *
 * The count is the point. A list of names and relations answers nothing an
 * owner's own screen does not, but **"which heirs would receive nothing"** is a
 * question no other screen in the console asks — and it is the commonest silent
 * failure in the product, because an owner who added an heir believes they are
 * provided for.
 *
 * Two probes per row, both indexed, and the second deduplicated per owner:
 * assets routed to this heir *directly*, plus assets routed to every heir at
 * once. Counting only the first would report a `0` against an heir who is in
 * fact covered by the default rule — a wrong answer that looks like a finding.
 */
export const heirsPage = query({
  args: { paginationOpts: paginationOptsValidator, ...heirFilterArgs },
  handler: async (ctx, { paginationOpts, sort, unroutedOnly, search }) => {
    await requirePermission(ctx, "owners.read")

    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      // A term that matched no owner matches no heir. Returning the unfiltered
      // stream here would read as "search found everything".
      return { page: [], isDone: true, continueCursor: "" }
    }

    const result = await ctx.db
      .query("heirs")
      .order(sort === "oldest" ? "asc" : "desc")
      .filter((q) =>
        ownerMatch === null
          ? true
          : q.or(...ownerMatch.ids.map((id) => q.eq(q.field("userId"), id)))
      )
      .paginate(paginationOpts)

    const owners = new Map<string, Doc<"users"> | null>()
    const sharedCounts = new Map<string, number>()

    const rows = []
    for (const heir of result.page) {
      const ownerKey = heir.userId as string
      if (!owners.has(ownerKey)) {
        owners.set(ownerKey, await ctx.db.get("users", heir.userId))
        const shared = await ctx.db
          .query("assetRecipients")
          .withIndex("by_userId_and_recipientKind", (q) =>
            q.eq("userId", heir.userId).eq("recipientKind", "allHeirs")
          )
          .take(200)
        sharedCounts.set(ownerKey, shared.length)
      }

      const direct = await ctx.db
        .query("assetRecipients")
        .withIndex("by_userId_and_recipientHeirId", (q) =>
          q.eq("userId", heir.userId).eq("recipientHeirId", heir._id)
        )
        .take(200)

      const owner = owners.get(ownerKey) ?? null
      rows.push({
        id: heir._id,
        name: heir.name,
        relation: heir.relation,
        phone: heir.phone,
        ownerId: heir.userId,
        ownerName: owner?.name ?? null,
        ownerEmail: owner?.email ?? null,
        directCount: direct.length,
        sharedCount: sharedCounts.get(ownerKey) ?? 0,
        receivesCount: direct.length + (sharedCounts.get(ownerKey) ?? 0),
        routingChangedAt: heir.routingChangedAt ?? null,
        addedAt: heir._creationTime,
      })
    }

    // Filtered after counting, because the count is what the filter is about
    // and it cannot be expressed as an index range. A page may therefore come
    // back shorter than asked for; `isDone` still says whether another follows.
    return {
      ...result,
      page: unroutedOnly ? rows.filter((row) => row.receivesCount === 0) : rows,
    }
  },
})

/**
 * Bounded count of heirs.
 *
 * Unlike the claims and owners tallies this one ignores `unroutedOnly`: that
 * filter needs two indexed probes per row to evaluate, and running them across
 * five hundred rows to produce a number would cost more than the page it
 * describes. The console labels this as the total rather than the filtered
 * count, so the number is not read as something it is not.
 */
export const heirsTally = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "owners.read")
    const rows = await ctx.db.query("heirs").take(CLAIMS_TALLY_CAP + 1)
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
    }
  },
})

const deviceFilterArgs = {
  platforms: v.array(
    v.union(v.literal("ios"), v.literal("android"), v.literal("web"))
  ),
  /** `true` shows only revoked rows, `false` only live ones. */
  revoked: v.optional(v.boolean()),
  /** Matched against the *owner*, not the device — see `ownerIdsMatching`. */
  search: v.string(),
  sort: v.union(v.literal("newest"), v.literal("oldest")),
}

type DeviceFilters = {
  platforms: string[]
  revoked?: boolean | undefined
  sort: "newest" | "oldest"
}

function devicesQuery(
  ctx: QueryCtx,
  filters: DeviceFilters,
  ownerIds: Id<"users">[] | null
) {
  return ctx.db
    .query("devices")
    .order(filters.sort === "oldest" ? "asc" : "desc")
    .filter((q) => {
      const clauses = []
      if (ownerIds !== null) {
        clauses.push(q.or(...ownerIds.map((id) => q.eq(q.field("userId"), id))))
      }
      if (filters.platforms.length > 0) {
        clauses.push(
          q.or(
            ...filters.platforms.map((platform) =>
              q.eq(q.field("platform"), platform)
            )
          )
        )
      }
      if (filters.revoked !== undefined) {
        clauses.push(q.eq(q.field("revoked"), filters.revoked))
      }
      if (clauses.length === 0) return true
      return clauses.length === 1 ? clauses[0]! : q.and(...clauses)
    })
}

/**
 * Every enrolled device, across every account.
 *
 * A device is the *daily* way into a vault — it holds MK wrapped by a
 * hardware key — so "which devices are enrolled and when did each last open
 * one" is the closest the console gets to a live access log. It is also where a
 * revoked row is visible as a decision somebody made rather than as an absence.
 *
 * Returns no `installId`. It identifies an install and is written to the
 * device's keystore before `register` is called; the console has no use for it
 * and every value here is one an operator might read aloud.
 */
export const devicesPage = query({
  args: { paginationOpts: paginationOptsValidator, ...deviceFilterArgs },
  handler: async (ctx, { paginationOpts, search, ...filters }) => {
    await requirePermission(ctx, "owners.read")

    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { page: [], isDone: true, continueCursor: "" }
    }

    const result = await devicesQuery(
      ctx,
      filters,
      ownerMatch?.ids ?? null
    ).paginate(paginationOpts)

    const owners = new Map<string, Doc<"users"> | null>()
    for (const row of result.page) {
      const key = row.userId as string
      if (!owners.has(key)) {
        owners.set(key, await ctx.db.get("users", row.userId))
      }
    }

    return {
      ...result,
      page: result.page.map((row) => {
        const owner = owners.get(row.userId as string) ?? null
        return {
          id: row._id,
          name: row.name,
          platform: row.platform,
          revoked: row.revoked,
          lastUnlockAt: row.lastUnlockAt ?? null,
          registeredAt: row._creationTime,
          ownerId: row.userId,
          ownerName: owner?.name ?? null,
          ownerEmail: owner?.email ?? null,
        }
      }),
    }
  },
})

/** Bounded count for the device filters. See `claimsTally`. */
export const devicesTally = query({
  args: deviceFilterArgs,
  handler: async (ctx, { search, ...filters }) => {
    await requirePermission(ctx, "owners.read")
    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { count: 0, more: false }
    }
    const rows = await devicesQuery(ctx, filters, ownerMatch?.ids ?? null).take(
      CLAIMS_TALLY_CAP + 1
    )
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
    }
  },
})

// ---------------------------------------------------------------------------
// Operations — the machinery, and whether it ran.
// ---------------------------------------------------------------------------

const escalationStateValidator = v.union(
  v.literal("idle"),
  v.literal("day0"),
  v.literal("day7"),
  v.literal("day14"),
  v.literal("countdown")
)

const checkinFilterArgs = {
  states: v.array(escalationStateValidator),
  /** Matched against the owner — see `ownerIdsMatching`. */
  search: v.string(),
  /** `soonest` puts the furthest past due first; `latest` reverses it. */
  sort: v.union(v.literal("soonest"), v.literal("latest")),
  /** Passed in: a query may not read the clock. Drives "days overdue". */
  now: v.number(),
}

type CheckinFilters = {
  states: string[]
  sort: "soonest" | "latest"
}

/**
 * Owners ordered by how far past due they are.
 *
 * `by_nextDueAt` rather than the compound `by_escalationState_and_nextDueAt`:
 * the compound index leads on the state, so it cannot order by due date across
 * several states or none. One key gives the same order however the states are
 * filtered, which is what makes the sort mean one thing.
 */
function checkinsQuery(
  ctx: QueryCtx,
  filters: CheckinFilters,
  ownerIds: Id<"users">[] | null
) {
  return ctx.db
    .query("checkinConfig")
    .withIndex("by_nextDueAt")
    .order(filters.sort === "soonest" ? "asc" : "desc")
    .filter((q) => {
      const clauses = []
      if (ownerIds !== null) {
        clauses.push(q.or(...ownerIds.map((id) => q.eq(q.field("userId"), id))))
      }
      if (filters.states.length > 0) {
        clauses.push(
          q.or(
            ...filters.states.map((state) =>
              q.eq(q.field("escalationState"), state)
            )
          )
        )
      }
      if (clauses.length === 0) return true
      return clauses.length === 1 ? clauses[0]! : q.and(...clauses)
    })
}

/**
 * One page of the check-in ladder.
 *
 * `admin.overview` has always counted these by state, so the dashboard could
 * say *six owners are mid-escalation* while nothing anywhere could say which
 * six. Third time that gap has appeared in this console — the identity queue
 * and the claims workspace were the others.
 */
export const checkinsPage = query({
  args: { paginationOpts: paginationOptsValidator, ...checkinFilterArgs },
  handler: async (ctx, { paginationOpts, search, now, ...filters }) => {
    await requirePermission(ctx, "owners.read")

    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { page: [], isDone: true, continueCursor: "" }
    }

    const result = await checkinsQuery(
      ctx,
      filters,
      ownerMatch?.ids ?? null
    ).paginate(paginationOpts)

    const owners = new Map<string, Doc<"users"> | null>()
    for (const row of result.page) {
      const key = row.userId as string
      if (!owners.has(key)) {
        owners.set(key, await ctx.db.get("users", row.userId))
      }
    }

    return {
      ...result,
      page: result.page.map((row) => {
        const owner = owners.get(row.userId as string) ?? null
        return {
          id: row._id,
          ownerId: row.userId,
          ownerName: owner?.name ?? null,
          ownerEmail: owner?.email ?? null,
          escalationState: row.escalationState,
          cadenceMonths: row.cadenceMonths,
          graceDays: row.graceDays,
          nextDueAt: row.nextDueAt,
          lastConfirmedAt: row.lastConfirmedAt,
          /** Negative until the deadline passes; the console reads the sign. */
          overdueMs: now - row.nextDueAt,
        }
      }),
    }
  },
})

/** Bounded count for the check-in filters. See `claimsTally`. */
export const checkinsTally = query({
  args: checkinFilterArgs,
  handler: async (ctx, { search, now: _now, ...filters }) => {
    await requirePermission(ctx, "owners.read")
    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { count: 0, more: false }
    }
    const rows = await checkinsQuery(
      ctx,
      filters,
      ownerMatch?.ids ?? null
    ).take(CLAIMS_TALLY_CAP + 1)
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
    }
  },
})

/** How many rows each release band contributes before the table says so. */
const RELEASE_BAND_CAP = 100

/**
 * One row of the releases table.
 *
 * Declared rather than inferred because the two bands fill different halves of
 * it: a counting-down report has no release date and a released one has no
 * countdown. Both halves are `null` on the other side rather than absent, so
 * the table renders one shape and the column decides what a null means.
 */
type ReleaseRow = {
  id: Id<"claims">
  band: "counting" | "released"
  subjectName: string | null
  subjectEmail: string | null
  claimantName: string
  vetoDeadline: number | null
  remainingMs: number | null
  heirsWithBundle: number | null
  releasedAt: number | null
  deliveries: {
    total: number
    awaitingHeir: number
    identityPending: number
    ready: number
    rejected: number
    expired: number
  } | null
}

/**
 * Releases: what is counting down, and what already went.
 *
 * **One row per death report, both bands in one list.** They were two panels
 * once, which made this the only screen in the console that was not a table —
 * no search, no column visibility, no export, and two empty states where every
 * other screen has one. The band is a column now, so it faceting like any other.
 *
 * Bounded rather than paginated: a countdown an operator pages through has
 * stopped being a countdown, and the table says when it was cut short.
 *
 * A counting-down report carries how many heirs have a bundle, because a report
 * that releases into an owner with none delivers nothing to anyone. A released
 * one carries its deliveries by state — the per-heir work lives on the
 * deliveries screen, and a row here links to it.
 */
export const releasesTable = query({
  args: { now: v.number() },
  handler: async (ctx, { now }) => {
    await requirePermission(ctx, "claims.read")

    const pending = await ctx.db
      .query("claims")
      .withIndex("by_status_and_vetoDeadline", (q) =>
        q.eq("status", "awaiting_veto")
      )
      .take(RELEASE_BAND_CAP + 1)

    const done = await ctx.db
      .query("claims")
      .withIndex("by_status", (q) => q.eq("status", "released"))
      .order("desc")
      .take(RELEASE_BAND_CAP + 1)

    const subjects = new Map<string, Doc<"users"> | null>()
    const subjectOf = async (row: Doc<"claims">) => {
      if (row.subjectUserId === undefined) return null
      const key = row.subjectUserId as string
      if (!subjects.has(key)) {
        subjects.set(key, await ctx.db.get("users", row.subjectUserId))
      }
      return subjects.get(key) ?? null
    }

    const rows: ReleaseRow[] = []

    for (const row of pending.slice(0, RELEASE_BAND_CAP)) {
      const subject = await subjectOf(row)
      const bundles =
        row.subjectUserId === undefined
          ? []
          : await ctx.db
              .query("releaseBundles")
              .withIndex("by_userId", (q) => q.eq("userId", row.subjectUserId!))
              .take(100)
      rows.push({
        id: row._id,
        band: "counting",
        subjectName: subject?.name ?? null,
        subjectEmail: subject?.email ?? null,
        claimantName: row.claimantName,
        vetoDeadline: row.vetoDeadline ?? null,
        /** Negative once the deadline has passed and the sweep has not run. */
        remainingMs: (row.vetoDeadline ?? now) - now,
        heirsWithBundle: bundles.length,
        releasedAt: null,
        deliveries: null,
      })
    }

    for (const row of done.slice(0, RELEASE_BAND_CAP)) {
      const subject = await subjectOf(row)
      const deliveries = await ctx.db
        .query("deliveries")
        .withIndex("by_claimId", (q) => q.eq("claimId", row._id))
        .take(100)
      const count = (status: Doc<"deliveries">["status"]) =>
        deliveries.filter((d) => d.status === status).length
      rows.push({
        id: row._id,
        band: "released",
        subjectName: subject?.name ?? null,
        subjectEmail: subject?.email ?? null,
        claimantName: row.claimantName,
        vetoDeadline: null,
        remainingMs: null,
        heirsWithBundle: null,
        releasedAt: row.releasedAt ?? row.vetoDeadline ?? row._creationTime,
        deliveries: {
          total: deliveries.length,
          awaitingHeir: count("awaiting_heir"),
          identityPending: count("identity_pending"),
          ready: count("ready"),
          rejected: count("rejected"),
          expired: count("expired"),
        },
      })
    }

    return {
      rows,
      // One flag, because one table: an operator does not care which half was
      // truncated, only that what they are reading is not all of it.
      capped:
        pending.length > RELEASE_BAND_CAP || done.length > RELEASE_BAND_CAP,
      bandCap: RELEASE_BAND_CAP,
    }
  },
})

/**
 * What the system emailed, to whom, and when.
 *
 * A slice of `auditLog` rather than a table of its own: `email.ts`'s `send()`
 * now writes one row per message, and that log already exists. Reads the new
 * `by_at` index, because "recently" across every account was otherwise a full
 * scan of the one table that only grows.
 *
 * Returns the kind and the recipient, never a body — see `send()` for why the
 * row holds as little as it does.
 */
export const emailLogPage = query({
  args: { paginationOpts: paginationOptsValidator, search: v.string() },
  handler: async (ctx, { paginationOpts, search }) => {
    await requirePermission(ctx, "ops.read")

    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { page: [], isDone: true, continueCursor: "" }
    }

    const result = await ctx.db
      .query("auditLog")
      .withIndex("by_at")
      .order("desc")
      .filter((q) => {
        const isEmail = q.eq(q.field("event"), "email.sent")
        return ownerMatch === null
          ? isEmail
          : q.and(
              isEmail,
              q.or(...ownerMatch.ids.map((id) => q.eq(q.field("userId"), id)))
            )
      })
      .paginate(paginationOpts)

    const recipients = new Map<string, Doc<"users"> | null>()
    for (const row of result.page) {
      const key = row.userId as string
      if (!recipients.has(key)) {
        recipients.set(key, await ctx.db.get("users", row.userId))
      }
    }

    return {
      ...result,
      page: result.page.map((row) => {
        const user = recipients.get(row.userId as string) ?? null
        return {
          id: row._id,
          kind: typeof row.meta.kind === "string" ? row.meta.kind : "unknown",
          recipientId: row.userId,
          recipientName: user?.name ?? null,
          recipientEmail: user?.email ?? null,
          at: row.at,
        }
      }),
    }
  },
})

/**
 * Bounded count of recorded sends, and whether a mailer is configured at all.
 *
 * `send()` returns early when `RESEND_FROM` is unset — no mail, and by design
 * no row. So an empty log has two very different causes: nothing has been sent,
 * or **nothing can be**. On this deployment right now it is the second: eleven
 * rungs have advanced and not one message has left. A screen that showed an
 * empty table without saying so would be reporting silence as calm.
 */
export const emailLogTally = query({
  args: { search: v.string() },
  handler: async (ctx, { search }) => {
    await requirePermission(ctx, "ops.read")
    const mailerConfigured = (await settingsFor(ctx)).emailFrom !== null
    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { count: 0, more: false, mailerConfigured }
    }
    const rows = await ctx.db
      .query("auditLog")
      .withIndex("by_at")
      .order("desc")
      .filter((q) => q.eq(q.field("event"), "email.sent"))
      .take(CLAIMS_TALLY_CAP + 1)
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
      mailerConfigured,
    }
  },
})

// The job list lives in `jobs.ts`, beside the registry that can run them, and
// is imported rather than restated. It was restated once and drifted:
// `deliveries.expire` was missing here, so the sweep that makes a delivery
// permanently unopenable was the one piece of machinery the console could not
// see at all.

/** How many recent runs one job shows. */
const JOB_RUNS_SHOWN = 20

/**
 * Whether the machinery is running.
 *
 * Per job: the most recent run, and the most recent run that *changed*
 * something. Both, because they answer different questions — the first says
 * the cron is alive, the second says when it last had work. A sweep that finds
 * nothing due is healthy, and until `jobRuns` existed it was indistinguishable
 * from one that had stopped.
 *
 * A job with no rows at all has either never run or been renamed. The console
 * says so rather than rendering an empty row, because "no data" and "no cron"
 * are the confusion this whole table exists to remove.
 */
export const jobRunsList = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "jobs.read")

    const jobs = []
    for (const name of JOB_NAMES) {
      const recent = await ctx.db
        .query("jobRuns")
        .withIndex("by_name_and_ranAt", (q) => q.eq("name", name))
        .order("desc")
        .take(JOB_RUNS_SHOWN)

      jobs.push({
        name,
        /** The schedule, so the console can judge late against the right one. */
        everyHours: JOB_EVERY_HOURS[name],
        lastRun: recent[0] ?? null,
        lastChange: recent.find((row) => row.changed > 0) ?? null,
        /** Whether `lastChange` is merely outside the window shown. */
        changeOutsideWindow:
          recent.length === JOB_RUNS_SHOWN &&
          recent.every((row) => row.changed === 0),
        runs: recent.map((row) => ({
          id: row._id,
          ranAt: row.ranAt,
          scanned: row.scanned,
          changed: row.changed,
          rescheduled: row.rescheduled,
        })),
      })
    }
    return { jobs, shown: JOB_RUNS_SHOWN }
  },
})

// ---------------------------------------------------------------------------
// Records — the append-only material.
// ---------------------------------------------------------------------------

/**
 * The domains an audit event can belong to, taken from the prefix of its name.
 *
 * Faceting on the *domain* rather than the exact event, because there are
 * thirty-odd events and a dropdown of thirty checkboxes is not a filter anyone
 * uses. The events themselves are shown raw — the same decision the claim
 * history made, and for the same reason: a reviewer comparing the console
 * against the deployment needs the two to be the same string.
 */
const AUDIT_DOMAINS = [
  "asset",
  "billing",
  "checkin",
  "claim",
  "device",
  "email",
  "guardian",
  "heir",
  "identity",
  "job",
  "keyring",
  "profile",
  "release",
  "routing",
  "settings",
] as const

const auditDomainValidator = v.union(
  ...AUDIT_DOMAINS.map((domain) => v.literal(domain))
)

/**
 * Match every event in a domain without enumerating them.
 *
 * Convex orders strings lexicographically, so `"claim." <= event < "claim/"` is
 * a prefix range — `/` is the next code point after `.`. That matters more than
 * elegance: enumerating the events per domain would be a list to forget to
 * update, and a new `claim.*` event would silently stop being filterable while
 * still appearing in the table. A prefix has nothing to keep in sync.
 */
function eventInDomain(q: any, domain: string) {
  return prefixRange(q, "event", domain)
}

/** The same range over a notification's `kind`. */
function kindInDomain(q: any, domain: string) {
  return prefixRange(q, "kind", domain)
}

function prefixRange(q: any, field: string, domain: string) {
  return q.and(
    q.gte(q.field(field), `${domain}.`),
    q.lt(q.field(field), `${domain}/`)
  )
}

const auditFilterArgs = {
  domains: v.array(auditDomainValidator),
  /** Matched against the subject of the event — see `ownerIdsMatching`. */
  search: v.string(),
  /**
   * One staff member's own actions.
   *
   * ⚠️ It can only see forward from the RBAC cutover. `actorUserId` is a
   * column now, but the rows written before it existed carry the actor in
   * `meta.adminUserId`, which is a `v.record` and unindexable — and the log
   * is append-only, so nothing may go back and fix them. The screen says so;
   * silence here must not read as innocence.
   */
  actor: v.optional(v.id("users")),
}

/**
 * The audit log, across every account.
 *
 * The compliance backbone of a product that hands over estates: who did what,
 * to whom, and when. Until `by_at` existed there was no way to read it except
 * one user at a time, so "what happened recently" had no answer.
 *
 * Append-only and read-only, enforced two ways — `verify-invariants.mjs` fails
 * the build on any `patch`, `replace` or `delete` against this table, and there
 * is deliberately no mutation here to call.
 *
 * Newest first, always. A log with one meaningful order should not offer a
 * column sort that reorders only the page in front of you.
 */
export const auditPage = query({
  args: { paginationOpts: paginationOptsValidator, ...auditFilterArgs },
  handler: async (ctx, { paginationOpts, search, domains, actor }) => {
    await requirePermission(ctx, "audit.read")

    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { page: [], isDone: true, continueCursor: "" }
    }

    // Same order either way, so the page shape does not change with the filter.
    const result = await (actor === undefined
      ? ctx.db.query("auditLog").withIndex("by_at")
      : ctx.db
          .query("auditLog")
          .withIndex("by_actorUserId_and_at", (q) => q.eq("actorUserId", actor)))
      .order("desc")
      .filter((q) => {
        const clauses = []
        if (domains.length > 0) {
          clauses.push(
            q.or(...domains.map((domain) => eventInDomain(q, domain)))
          )
        }
        if (ownerMatch !== null) {
          clauses.push(
            q.or(...ownerMatch.ids.map((id) => q.eq(q.field("userId"), id)))
          )
        }
        if (clauses.length === 0) return true
        return clauses.length === 1 ? clauses[0]! : q.and(...clauses)
      })
      .paginate(paginationOpts)

    // One map for both sides: a staff member appearing fifty times costs one
    // read, and an actor who has since been deleted resolves to null, which the
    // row shape already tolerates.
    const subjects = new Map<string, Doc<"users"> | null>()
    for (const row of result.page) {
      for (const id of [row.userId, row.actorUserId]) {
        if (id === undefined) continue
        const key = id as string
        if (!subjects.has(key)) {
          subjects.set(key, await ctx.db.get("users", id))
        }
      }
    }

    return {
      ...result,
      page: result.page.map((row) => {
        const subject = subjects.get(row.userId as string) ?? null
        return {
          id: row._id,
          event: row.event,
          subjectId: row.userId,
          subjectName: subject?.name ?? null,
          subjectEmail: subject?.email ?? null,
          // Scalars only, by schema. Every writer keeps third-party personal
          // data out of it deliberately — `claim.certificate_attached` logs the
          // claim id and not the name on the certificate.
          meta: row.meta,
          actorId: row.actorUserId ?? null,
          actorName:
            row.actorUserId === undefined
              ? null
              : (subjects.get(row.actorUserId as string)?.name ??
                subjects.get(row.actorUserId as string)?.email ??
                null),
          deviceId: row.deviceId ?? null,
          at: row.at,
        }
      }),
    }
  },
})

/** Bounded count for the audit filters. See `claimsTally`. */
export const auditTally = query({
  args: auditFilterArgs,
  handler: async (ctx, { search, domains, actor }) => {
    await requirePermission(ctx, "audit.read")
    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { count: 0, more: false }
    }
    const rows = await (actor === undefined
      ? ctx.db.query("auditLog").withIndex("by_at")
      : ctx.db
          .query("auditLog")
          .withIndex("by_actorUserId_and_at", (q) => q.eq("actorUserId", actor)))
      .order("desc")
      .filter((q) => {
        const clauses = []
        if (domains.length > 0) {
          clauses.push(
            q.or(...domains.map((domain) => eventInDomain(q, domain)))
          )
        }
        if (ownerMatch !== null) {
          clauses.push(
            q.or(...ownerMatch.ids.map((id) => q.eq(q.field("userId"), id)))
          )
        }
        if (clauses.length === 0) return true
        return clauses.length === 1 ? clauses[0]! : q.and(...clauses)
      })
      .take(CLAIMS_TALLY_CAP + 1)
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
    }
  },
})

/**
 * The domains a *notification* kind can belong to.
 *
 * Deliberately shorter than `AUDIT_DOMAINS`: only three writers insert into
 * `notifications` — the escalation ladder (`checkin.*`), the claim machine
 * (`claim.*`) and `keyring.recoverAttempt`
 * (`recovery.attempted`). Offering a facet for a domain nothing can write
 * would be a filter that always returns nothing.
 */
const NOTIFICATION_DOMAINS = ["checkin", "claim", "recovery"] as const

const notificationFilterArgs = {
  domains: v.array(
    v.union(...NOTIFICATION_DOMAINS.map((domain) => v.literal(domain)))
  ),
  /** `true` for unread only, `false` for read only. */
  unread: v.optional(v.boolean()),
  search: v.string(),
}

/**
 * The filter both notification reads share.
 *
 * Shared rather than written twice because the tally and the page must agree:
 * a count that ignored the facets would report the whole table under every
 * filter, which is worse than no count at all.
 */
function notificationClause(
  q: any,
  domains: readonly string[],
  ownerIds: Id<"users">[] | null,
  unread: boolean | undefined
) {
  const clauses = []
  if (domains.length > 0) {
    clauses.push(q.or(...domains.map((domain) => kindInDomain(q, domain))))
  }
  if (ownerIds !== null) {
    clauses.push(q.or(...ownerIds.map((id) => q.eq(q.field("userId"), id))))
  }
  if (unread === true) clauses.push(q.eq(q.field("readAt"), undefined))
  if (unread === false) clauses.push(q.neq(q.field("readAt"), undefined))
  if (clauses.length === 0) return true
  return clauses.length === 1 ? clauses[0]! : q.and(...clauses)
}

/**
 * What owners were told *in the app*, as opposed to by mail.
 *
 * The pair to the email log, and the reason both exist: an owner who missed a
 * check-in gets an in-app row and a message, and "did this person ever actually
 * hear from us" is only answerable with both. The mailer being unconfigured on
 * this deployment is exactly the case where the two disagree.
 *
 * `notifications` carries only `by_userId` indexes, so this scans in creation
 * order and filters. Affordable because notifications are bounded by owners
 * and events rather than by traffic, and pagination bounds it either way.
 */
export const notificationsPage = query({
  args: { paginationOpts: paginationOptsValidator, ...notificationFilterArgs },
  handler: async (ctx, { paginationOpts, search, domains, unread }) => {
    await requirePermission(ctx, "ops.read")

    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { page: [], isDone: true, continueCursor: "" }
    }

    const result = await ctx.db
      .query("notifications")
      .order("desc")
      .filter((q) =>
        notificationClause(q, domains, ownerMatch?.ids ?? null, unread)
      )
      .paginate(paginationOpts)

    const recipients = new Map<string, Doc<"users"> | null>()
    for (const row of result.page) {
      const key = row.userId as string
      if (!recipients.has(key)) {
        recipients.set(key, await ctx.db.get("users", row.userId))
      }
    }

    return {
      ...result,
      page: result.page.map((row) => {
        const user = recipients.get(row.userId as string) ?? null
        return {
          id: row._id,
          kind: row.kind,
          recipientId: row.userId,
          recipientName: user?.name ?? null,
          recipientEmail: user?.email ?? null,
          // Scalars only, by schema, and written by us rather than typed by
          // anyone — `daysOverdue`, `nextDueAt`, a claim id. It is the substance
          // of what the owner was told, which is the question the screen asks.
          payload: row.payload,
          readAt: row.readAt ?? null,
          at: row._creationTime,
        }
      }),
    }
  },
})

/** Bounded count for the notification filters. See `claimsTally`. */
export const notificationsTally = query({
  args: notificationFilterArgs,
  handler: async (ctx, { search, domains, unread }) => {
    await requirePermission(ctx, "ops.read")
    const ownerMatch = await ownerIdsMatching(ctx, search)
    if (ownerMatch !== null && ownerMatch.ids.length === 0) {
      return { count: 0, more: false }
    }
    const rows = await ctx.db
      .query("notifications")
      .filter((q) =>
        notificationClause(q, domains, ownerMatch?.ids ?? null, unread)
      )
      .take(CLAIMS_TALLY_CAP + 1)
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
    }
  },
})

/** Audit rows scanned looking for one claim's history. */
const HISTORY_SCAN = 400

/**
 * Everything a reviewer needs to rule on one claim, and nothing they do not.
 *
 * ## The comparison this exists to support
 *
 * The whole judgement is the certificate's name against the owner's
 * Didit-verified legal name. `adminSetNameMatch` says why a person makes it:
 * *"Never a string comparison in code: transliteration, honorifics and name
 * order make that unsafe in Arabic and in every other script this ships to."*
 * So both names come back, and the console puts them side by side.
 *
 * ## The identity status here is LIVE, and that is not a detail
 *
 * `claims.claimantIdentityStatus` is a snapshot written at submit and refreshed
 * only as a side effect of `adminSetNameMatch`. That mutation decides on the
 * live `users.identityStatus`. Returning the stored column would mean the
 * console disabled its button on one value while the server ruled on another —
 * precisely the disagreement `nameMatchBlockedReason` exists to prevent. Both
 * are returned so a stale snapshot is visible rather than silently wrong.
 *
 * ## Heirs are another owner's data, so they are projected
 *
 * Nothing else in this console reads an owner's heir list. `heirs` carries
 * plaintext `name`, `relation` and `phone`; only the first two and a routed
 * count come back, never the phone and never a spread document. Same discipline
 * `release.ts` states for itself: every read projects named fields, so a future
 * edit cannot widen one into a leak.
 *
 * ## Prior claims are included because the lockout does not catch them
 *
 * A veto sets `lockedUntil`, but `submit` only finds prior claims through
 * `by_subjectUserId_and_claimantContact` — and `claimantContact` is a
 * caller-supplied string. A vetoed claimant who re-files with a different email
 * matches nothing and lands here as a fresh `submitted` claim with no sign of
 * the veto. Listing this claimant's other claims against this subject is what
 * lets a reviewer see what the backend missed.
 */
/**
 * Claims that matched no vault, oldest first.
 *
 * The queue that exists because `submit` stopped silently discarding them. The
 * commonest entry is a mistyped address, and it is fixable — `adminLinkSubject`
 * attaches the right vault and the claim carries on as if it had matched. What
 * is not fixed here is closed by `sweepUnmatched` after the grace window.
 *
 * Oldest first, deliberately: this is a queue with a deadline attached, and the
 * row closest to being closed automatically is the one worth a human's time.
 */
export const unmatchedClaims = query({
  args: { paginationOpts: paginationOptsValidator },
  handler: async (ctx, { paginationOpts }) => {
    await requirePermission(ctx, "claims.read")
    const page = await ctx.db
      .query("claims")
      .withIndex("by_status_and_subjectUserId", (q) =>
        q.eq("status", "submitted").eq("subjectUserId", undefined)
      )
      .paginate(paginationOpts)

    return {
      ...page,
      page: page.page.map((claim) => ({
        id: claim._id,
        // The address as typed. This is the whole point of the screen: a human
        // reading it next to the real one is what spots the typo.
        subjectEmail: claim.subjectEmail ?? null,
        claimantName: claim.claimantName,
        claimantContact: claim.claimantContact,
        certificateName: claim.certificateName ?? null,
        submittedAt: claim._creationTime,
      })),
    }
  },
})

export const claimDetail = query({
  /** `v.string()` + `normalizeId` — see `ownerDetail` for why. */
  args: { claimId: v.string() },
  handler: async (ctx, { claimId: rawClaimId }) => {
    await requirePermission(ctx, "claims.read")

    const claimId = ctx.db.normalizeId("claims", rawClaimId)
    if (claimId === null) return null

    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) return null

    // Everything below hangs off the vault, and an unmatched claim has none.
    // The page still opens: staff need to read it in order to link or close it.
    const subjectUserId = claim.subjectUserId
    const subject =
      subjectUserId === undefined
        ? null
        : await ctx.db.get("users", subjectUserId)
    const claimant =
      claim.claimantUserId === undefined
        ? null
        : await ctx.db.get("users", claim.claimantUserId)
    const liveIdentityStatus = claimant?.identityStatus ?? "unverified"

    const heirRows =
      subjectUserId === undefined
        ? []
        : await ctx.db
            .query("heirs")
            .withIndex("by_userId", (q) => q.eq("userId", subjectUserId))
            .take(100)

    // Assets routed to each heir, folding in the "all heirs" bucket — the same
    // arithmetic `heirs.list` does for the owner, so the console and the app
    // cannot report a different number for the same heir.
    const direct = new Map<string, number>()
    const named = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientKind", (q) =>
        q.eq("userId", subjectUserId!).eq("recipientKind", "heir")
      )
      .take(2000)
    for (const row of named) {
      if (row.recipientHeirId === undefined) continue
      const key = row.recipientHeirId as string
      direct.set(key, (direct.get(key) ?? 0) + 1)
    }
    const shared = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientKind", (q) =>
        q.eq("userId", subjectUserId!).eq("recipientKind", "allHeirs")
      )
      .take(2000)

    // Other claims this person has filed against this vault. Matched on the
    // claimant's account where there is one, because that is the identity the
    // contact string fails to pin down.
    const siblings = await ctx.db
      .query("claims")
      .withIndex("by_subjectUserId", (q) =>
        q.eq("subjectUserId", claim.subjectUserId)
      )
      .take(50)
    const priorClaims = siblings
      .filter(
        (row) =>
          row._id !== claim._id &&
          (claim.claimantUserId !== undefined
            ? row.claimantUserId === claim.claimantUserId
            : row.claimantContact === claim.claimantContact)
      )
      .map((row) => ({
        id: row._id,
        status: row.status,
        submittedAt: row._creationTime,
        lockedUntil: row.lockedUntil ?? null,
      }))

    // This claim's history. Audit rows live under the *subject's* id with the
    // claim id inside `meta`, and `meta` is a `v.record` — unindexable — so the
    // only way to reconstruct one claim's trail is to read the subject's recent
    // rows and filter. Bounded, and scoped to one owner, so it stays cheap.
    const auditRows = await ctx.db
      .query("auditLog")
      .withIndex("by_userId_and_at", (q) => q.eq("userId", subjectUserId!))
      .order("desc")
      .take(HISTORY_SCAN)
    const history = auditRows
      .filter((row) => row.meta.claimId === (claim._id as string))
      .map((row) => ({ event: row.event, at: row.at }))

    // Whether the certificate is an image or a PDF decides how the console
    // shows it; the stored upload's own content type is the only honest source.
    const certificateMeta =
      claim.certificateStorageId === undefined
        ? null
        : await ctx.db.system.get("_storage", claim.certificateStorageId)

    // Once released, how its heirs are being reached — the page's next step.
    const deliveries =
      claim.status !== "released"
        ? []
        : await ctx.db
            .query("deliveries")
            .withIndex("by_claimId", (q) => q.eq("claimId", claim._id))
            .take(100)

    return {
      claim: {
        id: claim._id,
        status: claim.status,
        claimantName: claim.claimantName,
        claimantContact: claim.claimantContact,
        certificateName: claim.certificateName ?? null,
        certificateUrl:
          claim.certificateStorageId === undefined
            ? null
            : await ctx.storage.getUrl(claim.certificateStorageId),
        certificateContentType: certificateMeta?.contentType ?? null,
        nameMatch: claim.nameMatch ?? null,
        vetoDeadline: claim.vetoDeadline ?? null,
        lockedUntil: claim.lockedUntil ?? null,
        reviewedAt: claim.reviewedAt ?? null,
        releasedAt: claim.releasedAt ?? null,
        submittedAt: claim._creationTime,
      },
      deliveries: deliveries.map((row) => ({
        id: row._id,
        heirId: row.heirId,
        status: row.status,
        contactedAt: row.contactedAt ?? null,
      })),
      /** What Didit says right now — the value the mutation will rule on. */
      liveIdentityStatus,
      /** What was recorded at submit. Shown so a stale badge is visible. */
      storedIdentityStatus: claim.claimantIdentityStatus,
      subject: {
        name: subject?.name ?? null,
        email: subject?.email ?? null,
        verifiedName: subject?.identityVerifiedName ?? null,
      },
      heirs: heirRows.map((heir) => ({
        id: heir._id,
        name: heir.name,
        relation: heir.relation,
        routedAssetCount: (direct.get(heir._id as string) ?? 0) + shared.length,
      })),
      priorClaims,
      history,
      /** Why each verdict is unavailable, or `null`. The button reads this. */
      blocked: {
        approve: nameMatchBlockedReason(claim, true, liveIdentityStatus),
        reject: nameMatchBlockedReason(claim, false, liveIdentityStatus),
      },
    }
  },
})
