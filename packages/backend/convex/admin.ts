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
import type { Doc } from "./_generated/dataModel"

import { MAX_IDENTITY_ATTEMPTS } from "./identity"
import { nameMatchBlockedReason } from "./model/claimFlow"
import { requireAdmin } from "./model/access"

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
  "guardian_review",
  "awaiting_veto",
  "released",
  "vetoed",
  "locked",
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
    await requireAdmin(ctx)

    const claims: Record<(typeof CLAIM_STATUSES)[number], Tally> = {
      submitted: { count: 0, more: false },
      guardian_review: { count: 0, more: false },
      awaiting_veto: { count: 0, more: false },
      released: { count: 0, more: false },
      vetoed: { count: 0, more: false },
      locked: { count: 0, more: false },
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
    // the real answer. `guardianConfirm` always sets one, so this is a guard
    // against a future edit, not against today's data.
    const soonest = await ctx.db
      .query("claims")
      .withIndex("by_status_and_vetoDeadline", (q) =>
        q.eq("status", "awaiting_veto")
      )
      .take(8)
    const nextReleaseAt =
      soonest.find((row) => row.vetoDeadline !== undefined)?.vetoDeadline ?? null

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
 * direction. `keyring` is read once and answers three questions (vault created,
 * sheet printed, guardian share sealed), which is why it is not read again.
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
    await requireAdmin(ctx)

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
      const rows = raw.filter((row) => row.role !== "admin")
      identity[status] = tallyWith(rows, SCAN_CAP)
      if (status === "rejected") {
        attemptsExhausted = rows
          .slice(0, SCAN_CAP)
          .filter((row) => (row.identityAttempts ?? 0) >= MAX_IDENTITY_ATTEMPTS)
          .length
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

    // A guardian counts only when the invitation was accepted **and** they have
    // published an X25519 key — the key is what an heir bundle gets sealed to,
    // so an accepted guardian without one can help with nothing.
    // `apps/mobile/lib/guardian.ts` exists so this answer is never computed
    // twice; keep the two in step.
    const accepted = await ctx.db
      .query("guardians")
      .withIndex("by_status", (q) => q.eq("status", "accepted"))
      .take(SCAN_CAP + 1)
    const guardianCapped = accepted.length > SCAN_CAP
    const guardianLive = new Set(
      accepted
        .slice(0, SCAN_CAP)
        .filter((row) => row.x25519PublicKey !== undefined)
        .map((row) => row.userId as string)
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
          key: "guardianLive",
          ...setTally(guardianLive, guardianCapped || keyringCapped),
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
    await requireAdmin(ctx)

    const raw = await ctx.db
      .query("users")
      .withIndex("by_creation_time", (q) =>
        q.gte("_creationTime", from).lt("_creationTime", to)
      )
      .take(SCAN_CAP + 1)
    // Staff excluded, same as the funnel: a sign-up trend that ticks up when a
    // reviewer is added is measuring the wrong thing.
    const rows = raw.filter((row) => row.role !== "admin")

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
  "guardian",
  "sheet",
  "heirs",
  "routing",
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
    await requireAdmin(ctx)

    const limit = Math.min(args.limit ?? RISK_LIMIT_DEFAULT, RISK_LIMIT_MAX)
    const owners = await ctx.db.query("users").take(limit + 1)
    const more = owners.length > limit

    const rows = []
    for (const owner of owners.slice(0, limit)) {
      // Admins are staff, not customers. Scoring the operator's own account as
      // an at-risk vault would put a permanent false row at the top of the one
      // table whose whole value is that every row means something.
      if (owner.role === "admin") continue

      const keyring = await ctx.db
        .query("keyring")
        .withIndex("by_userId", (q) => q.eq("userId", owner._id))
        .unique()

      const guardians = await ctx.db
        .query("guardians")
        .withIndex("by_userId", (q) => q.eq("userId", owner._id))
        .take(20)

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
        // Accepted AND has published a key. The rule used to be "accepted and
        // their recovery share is sealed"; that share no longer exists, so what
        // makes a guardian usable is the X25519 key an heir bundle can be
        // sealed to. Kept in step with `apps/mobile/lib/guardian.ts`.
        guardian: guardians.some(
          (row) => row.status === "accepted" && row.x25519PublicKey !== undefined
        ),
        sheet: keyring?.paperPrintedAt !== undefined,
        heirs: heirs.length > 0,
        routing: routed,
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
 * `subscription.storageBytesUsed` is a hand-maintained counter — `assets.ts`
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
 * Nothing in this deployment writes `subscription.renewsAt`; `plan` is only ever
 * the literal "free", set as a side effect of the storage counter. There is no
 * billing component, no payment webhook, and no plan catalogue. Reporting what
 * is actually stored, and saying plainly that billing is unwired, is the honest
 * answer — an empty revenue chart would read as "no customers are paying"
 * rather than "nobody has been asked to".
 */
export const storage = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx)

    const limit = Math.min(args.limit ?? 10, 50)

    const all = await ctx.db.query("users").take(SCAN_CAP + 1)
    const capped = all.length > SCAN_CAP
    // Staff excluded here too, so "owners on the free plan" is a count of
    // customers and not of everyone with a login.
    const counted = all.slice(0, SCAN_CAP).filter((row) => row.role !== "admin")

    let totalBytes = 0
    const plans = new Map<string, number>()
    const consumers: {
      userId: string
      name: string | null
      bytes: number
    }[] = []
    for (const owner of counted) {
      const bytes = owner.subscription?.storageBytesUsed ?? 0
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
      /** True while no plan anywhere carries a renewal date — i.e. always, today. */
      billingUnwired: counted.every(
        (owner) => owner.subscription?.renewsAt === undefined
      ),
    }
  },
})

/** Claim statuses, as an argument validator the console can pass through. */
const claimStatusValidator = v.union(
  v.literal("submitted"),
  v.literal("guardian_review"),
  v.literal("awaiting_veto"),
  v.literal("released"),
  v.literal("vetoed"),
  v.literal("locked")
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
  heirLinked: v.optional(v.boolean()),
  /** Trimmed by the caller. Empty means no search. */
  search: v.string(),
  sort: claimSortValidator,
}

type ClaimFilters = {
  statuses: string[]
  identity: string[]
  heirLinked?: boolean | undefined
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
    if (filters.heirLinked === true) {
      clauses.push(q.neq(q.field("heirId"), undefined))
    }
    if (filters.heirLinked === false) {
      clauses.push(q.eq(q.field("heirId"), undefined))
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
    await requireAdmin(ctx)

    const result = await claimsQuery(ctx, filters).paginate(paginationOpts)

    const subjects = new Map<string, Doc<"users"> | null>()
    for (const row of result.page) {
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
          heirLinked: row.heirId !== undefined,
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
    await requireAdmin(ctx)
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
              q.eq("identityStatus", filters.statuses[0] as Doc<"users">["identityStatus"])
            )
            .order(filters.sort === "oldest" ? "asc" : "desc")
        : ctx.db
            .query("users")
            .order(filters.sort === "oldest" ? "asc" : "desc")

  return base.filter((q) => {
    const clauses = [
      // Staff are not owners and do not belong in the owners' queue — the same
      // exclusion `risk` and `activation` apply.
      q.neq(q.field("role"), "admin"),
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
      clauses.push(
        q.gte(q.field("identityAttempts"), MAX_IDENTITY_ATTEMPTS)
      )
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
    await requireAdmin(ctx)
    const result = await identityQuery(ctx, filters).paginate(paginationOpts)
    return { ...result, page: result.page.map(identityRow) }
  },
})

/** Bounded count for the identity queue's filters. See `claimsTally`. */
export const identityTally = query({
  args: identityFilterArgs,
  handler: async (ctx, filters) => {
    await requireAdmin(ctx)
    const rows = await identityQuery(ctx, filters).take(CLAIMS_TALLY_CAP + 1)
    return {
      count: Math.min(rows.length, CLAIMS_TALLY_CAP),
      more: rows.length > CLAIMS_TALLY_CAP,
    }
  },
})


// ---------------------------------------------------------------------------
// The guardians list — Review's fourth screen.
// ---------------------------------------------------------------------------

/**
 * What a guardian appointment actually *is*, as opposed to what it stores.
 *
 * The raw `status` hides the two conditions worth acting on. An `invited` row
 * whose window has closed still reads `invited`, so an owner believes they have
 * a guardian and does not. An `accepted` row with no published key cannot be
 * sealed an heir's share, so it protects delivery no more than an empty seat.
 *
 * Derived here rather than in the browser so the filter and the badge cannot
 * disagree, and so filtering by `expired` narrows the query rather than the
 * page.
 */
const guardianStateValidator = v.union(
  v.literal("live"),
  v.literal("accepted"),
  v.literal("invited"),
  v.literal("expired"),
  v.literal("revoked")
)

type GuardianState = "live" | "accepted" | "invited" | "expired" | "revoked"

function guardianState(row: Doc<"guardians">, now: number): GuardianState {
  if (row.status === "revoked") return "revoked"
  if (row.status === "accepted") {
    // `isGuardianLive`, server-side: accepted alone seals nothing.
    return row.x25519PublicKey !== undefined ? "live" : "accepted"
  }
  return row.inviteExpiresAt < now ? "expired" : "invited"
}

const guardianFilterArgs = {
  states: v.array(guardianStateValidator),
  /** Passed in: a query may not read the wall clock. */
  now: v.number(),
  sort: v.union(v.literal("newest"), v.literal("expiring")),
}

type GuardianFilters = {
  states: GuardianState[]
  now: number
  sort: "newest" | "expiring"
}

/**
 * Guardian rows for the console.
 *
 * The derived state is not indexable — it reads three columns and the clock —
 * so the raw statuses it could possibly come from are pushed into the query and
 * the rest is settled per row. `live` and `accepted` both live under the
 * `accepted` status; `invited` and `expired` both under `invited`.
 */
async function guardianRows(
  ctx: QueryCtx,
  filters: GuardianFilters,
  limit: number
): Promise<Doc<"guardians">[]> {
  const wanted = new Set(filters.states)
  const statuses =
    wanted.size === 0
      ? null
      : [
          ...new Set(
            [...wanted].map((state) =>
              state === "live" || state === "accepted"
                ? "accepted"
                : state === "revoked"
                  ? "revoked"
                  : "invited"
            )
          ),
        ]

  const base =
    statuses !== null && statuses.length === 1
      ? ctx.db
          .query("guardians")
          .withIndex("by_status", (q) =>
            q.eq("status", statuses[0] as Doc<"guardians">["status"])
          )
      : ctx.db.query("guardians").order("desc")

  const rows = await base.take(limit)
  const matched =
    wanted.size === 0
      ? rows
      : rows.filter((row) => wanted.has(guardianState(row, filters.now)))

  return filters.sort === "expiring"
    ? matched.sort((a, b) => a.inviteExpiresAt - b.inviteExpiresAt)
    : matched.sort((a, b) => b._creationTime - a._creationTime)
}

/**
 * How many guardian rows one console read scans.
 *
 * Not paginated, unlike claims and identity, and the reason is the derived
 * state: `expired` cannot be expressed as an index range, so a cursor page
 * would come back arbitrarily short after filtering and "another page follows"
 * would stop meaning anything. Guardians are bounded by owners rather than by
 * traffic — one or two per vault — so a capped read is the honest shape. The
 * console says when it hits the cap.
 */
const GUARDIANS_SCAN = 1000

/**
 * The guardians list, and the count of what was scanned.
 *
 * **Never selects `inviteToken`.** That token is the whole capability of an
 * invitation: `guardians.accept` takes nothing else, so a console that could
 * read one could enrol itself as any owner's guardian. `guardians.ts` returns
 * it from `invite` alone, to the owner, exactly so the deployment cannot choose
 * a guardian — and this query would be the hole in that. Nothing here may
 * select it, now or later.
 */
export const guardiansList = query({
  args: guardianFilterArgs,
  handler: async (ctx, filters) => {
    await requireAdmin(ctx)
    const rows = await guardianRows(ctx, filters, GUARDIANS_SCAN + 1)
    const capped = rows.length > GUARDIANS_SCAN
    const page = rows.slice(0, GUARDIANS_SCAN)

    const owners = new Map<string, Doc<"users"> | null>()
    for (const row of page) {
      const key = row.userId as string
      if (!owners.has(key)) {
        owners.set(key, await ctx.db.get("users", row.userId))
      }
    }

    return {
      rows: page.map((row) => {
        const owner = owners.get(row.userId as string) ?? null
        return {
          id: row._id,
          ownerName: owner?.name ?? null,
          ownerEmail: owner?.email ?? null,
          guardianName: row.name,
          relation: row.relation,
          state: guardianState(row, filters.now),
          hasPublicKey: row.x25519PublicKey !== undefined,
          /** Whether an account was ever bound — `accept` is what writes it. */
          claimed: row.guardianUserId !== undefined,
          inviteExpiresAt: row.inviteExpiresAt,
          invitedAt: row._creationTime,
        }
      }),
      capped,
      scanCap: GUARDIANS_SCAN,
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
      : ctx.db
          .query("users")
          .order(filters.sort === "oldest" ? "asc" : "desc")

  return base.filter((q) => {
    const clauses = [q.neq(q.field("role"), "admin")]
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
          ...filters.plans.map((plan) => q.eq(q.field("subscription.plan"), plan))
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
    plan: user.subscription?.plan ?? null,
    storageBytesUsed: user.subscription?.storageBytesUsed ?? 0,
    joinedAt: user._creationTime,
  }
}

/** One page of owners. Mirrors `claimsPage`; see there for the cursor's limits. */
export const ownersPage = query({
  args: { paginationOpts: paginationOptsValidator, ...ownerFilterArgs },
  handler: async (ctx, { paginationOpts, ...filters }) => {
    await requireAdmin(ctx)
    const result = await ownersQuery(ctx, filters).paginate(paginationOpts)
    return { ...result, page: result.page.map(ownerRow) }
  },
})

/** Bounded count for the owner filters. See `claimsTally`. */
export const ownersTally = query({
  args: ownerFilterArgs,
  handler: async (ctx, filters) => {
    await requireAdmin(ctx)
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
 * as dates and a version, never as `mkWrappedByRecovery`; the guardians carry
 * no `inviteToken`. Both are the same rule stated in `guardiansList`.
 */
export const ownerDetail = query({
  args: { userId: v.id("users") },
  handler: async (ctx, { userId }) => {
    await requireAdmin(ctx)
    const user = await ctx.db.get("users", userId)
    if (user === null) {
      throw new Error("Not found")
    }

    const devices = await ctx.db
      .query("devices")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50)
    const heirs = await ctx.db
      .query("heirs")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(50)
    const guardians = await ctx.db
      .query("guardians")
      .withIndex("by_userId", (q) => q.eq("userId", userId))
      .take(20)
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
      })),
      guardians: guardians.map((row) => ({
        id: row._id,
        name: row.name,
        relation: row.relation,
        status: row.status,
        hasPublicKey: row.x25519PublicKey !== undefined,
        inviteExpiresAt: row.inviteExpiresAt,
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

const heirFilterArgs = {
  /** `true` narrows to heirs who would receive nothing today. */
  unroutedOnly: v.boolean(),
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
  handler: async (ctx, { paginationOpts, sort, unroutedOnly }) => {
    await requireAdmin(ctx)

    const result = await ctx.db
      .query("heirs")
      .order(sort === "oldest" ? "asc" : "desc")
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
    await requireAdmin(ctx)
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
  sort: v.union(v.literal("newest"), v.literal("oldest")),
}

type DeviceFilters = {
  platforms: string[]
  revoked?: boolean | undefined
  sort: "newest" | "oldest"
}

function devicesQuery(ctx: QueryCtx, filters: DeviceFilters) {
  return ctx.db
    .query("devices")
    .order(filters.sort === "oldest" ? "asc" : "desc")
    .filter((q) => {
      const clauses = []
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
  handler: async (ctx, { paginationOpts, ...filters }) => {
    await requireAdmin(ctx)
    const result = await devicesQuery(ctx, filters).paginate(paginationOpts)

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
  handler: async (ctx, filters) => {
    await requireAdmin(ctx)
    const rows = await devicesQuery(ctx, filters).take(CLAIMS_TALLY_CAP + 1)
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
export const claimDetail = query({
  args: { claimId: v.id("claims") },
  handler: async (ctx, { claimId }) => {
    await requireAdmin(ctx)

    const claim = await ctx.db.get("claims", claimId)
    if (claim === null) return null

    const subject = await ctx.db.get("users", claim.subjectUserId)
    const claimant =
      claim.claimantUserId === undefined
        ? null
        : await ctx.db.get("users", claim.claimantUserId)
    const liveIdentityStatus = claimant?.identityStatus ?? "unverified"

    const heirRows = await ctx.db
      .query("heirs")
      .withIndex("by_userId", (q) => q.eq("userId", claim.subjectUserId))
      .take(100)

    // Assets routed to each heir, folding in the "all heirs" bucket — the same
    // arithmetic `heirs.list` does for the owner, so the console and the app
    // cannot report a different number for the same heir.
    const direct = new Map<string, number>()
    const named = await ctx.db
      .query("assetRecipients")
      .withIndex("by_userId_and_recipientKind", (q) =>
        q.eq("userId", claim.subjectUserId).eq("recipientKind", "heir")
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
        q.eq("userId", claim.subjectUserId).eq("recipientKind", "allHeirs")
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
      .withIndex("by_userId_and_at", (q) => q.eq("userId", claim.subjectUserId))
      .order("desc")
      .take(HISTORY_SCAN)
    const history = auditRows
      .filter((row) => row.meta.claimId === (claim._id as string))
      .map((row) => ({ event: row.event, at: row.at }))

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
        nameMatch: claim.nameMatch ?? null,
        heirId: claim.heirId ?? null,
        vetoDeadline: claim.vetoDeadline ?? null,
        lockedUntil: claim.lockedUntil ?? null,
        guardianConfirmedAt: claim.guardianConfirmedAt ?? null,
        submittedAt: claim._creationTime,
      },
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
      /** Stated on the page: approving parks the claim, it does not complete it. */
      guardianStepUnbuilt: true,
    }
  },
})
