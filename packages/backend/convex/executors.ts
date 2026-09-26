// الأوصياء — the people who receive everything the owner hands over.
//
// Rules (AGENTS.md "Executors"):
//  - Each executor receives everything handed over, alone. Nothing here is per
//    asset: an asset is handed over or private (`assets.setHandover`).
//  - Silent in the app: no invitation, no account, nothing sent before release.
//  - The ID number arrives in plaintext exactly once and only its keyed hash is
//    stored. It is required: the executor's verified document is matched
//    against it before any delivery opens. Never log `args`.
//  - A sheet is saved only after the owner confirms the new code is printed
//    (mint → display → confirm → save), and its version must follow the stored
//    one, because the version is bound into the wrapper.
import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { writeAudit } from "./audit"
import { evaluateDeliveryIdentity } from "./deliveries"
import { requireUser } from "./model/access"
import { assertCanAddExecutor } from "./model/entitlements"
import { identityNumberHash } from "./model/identityHash"

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const YEAR_MS = 365 * 24 * 60 * 60 * 1000
/** nonce(24) ‖ key(32) ‖ tag(16) — a 32-byte key under `wrap`. */
const WRAPPED_KEY_BYTES = 72

function cleanEmail(value: string | undefined): string | undefined {
  const email = value?.trim().toLowerCase()
  if (email === undefined || email === "") return undefined
  if (!EMAIL.test(email)) throw new Error("That is not an email address")
  return email
}

export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const rows = await ctx.db
      .query("executors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(20)
    return rows.map((row) => ({
      id: row._id,
      name: row.name,
      phone: row.phone,
      email: row.email ?? null,
      sheetVersion: row.sheet?.version ?? null,
      sheetPrintedAt: row.sheet?.printedAt ?? null,
    }))
  },
})

export const add = mutation({
  args: {
    name: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    idNumber: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    await assertCanAddExecutor(ctx, user, Date.now())
    const executorId = await ctx.db.insert("executors", {
      userId: user._id,
      name: args.name.trim(),
      phone: args.phone.trim(),
      email: cleanEmail(args.email),
      idNumberHash: await identityNumberHash(args.idNumber),
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "executor.added",
      meta: { executorId },
    })
    return executorId
  },
})

export const update = mutation({
  args: {
    executorId: v.id("executors"),
    name: v.optional(v.string()),
    phone: v.optional(v.string()),
    /** Absent leaves it; "" clears it. */
    email: v.optional(v.string()),
    /** Absent leaves it; anything else replaces its hash. */
    idNumber: v.optional(v.string()),
  },
  handler: async (ctx, { executorId, name, phone, email, idNumber }) => {
    const user = await requireUser(ctx)
    const executor = await ctx.db.get("executors", executorId)
    if (executor === null || executor.userId !== user._id) {
      throw new Error("Not found")
    }
    await ctx.db.patch("executors", executorId, {
      ...(name === undefined ? {} : { name: name.trim() }),
      ...(phone === undefined ? {} : { phone: phone.trim() }),
      ...(email === undefined ? {} : { email: cleanEmail(email) }),
      ...(idNumber === undefined
        ? {}
        : { idNumberHash: await identityNumberHash(idNumber) }),
    })

    // A corrected number must be able to open a delivery already bound: the
    // match is otherwise re-checked only on bind and on a verdict.
    if (idNumber !== undefined) {
      const waiting = await ctx.db
        .query("deliveries")
        .withIndex("by_executorId", (q) => q.eq("executorId", executorId))
        .take(10)
      const now = Date.now()
      for (const delivery of waiting) {
        if (delivery.executorUserId === undefined) continue
        const bound = await ctx.db.get("users", delivery.executorUserId)
        if (bound !== null) {
          await evaluateDeliveryIdentity(ctx, delivery, bound, now)
        }
      }
    }

    const changed = [
      name === undefined ? null : "name",
      phone === undefined ? null : "phone",
      email === undefined ? null : "email",
      idNumber === undefined ? null : "idNumber",
    ].filter((field) => field !== null)
    await writeAudit(ctx, {
      userId: user._id,
      event: "executor.updated",
      meta: { executorId, fields: changed.join(",") },
    })
    return null
  },
})

/**
 * Save a printed sheet: the release key under this executor's new sheet
 * secret. Called only after the owner confirmed the code is printed — the old
 * sheet keeps working until this lands, and stops the moment it does.
 */
export const saveSheet = mutation({
  args: {
    executorId: v.id("executors"),
    releaseKeyWrapped: v.bytes(),
    version: v.number(),
  },
  handler: async (ctx, { executorId, releaseKeyWrapped, version }) => {
    const user = await requireUser(ctx)
    const executor = await ctx.db.get("executors", executorId)
    if (executor === null || executor.userId !== user._id) {
      throw new Error("Not found")
    }
    if (version !== (executor.sheet?.version ?? 0) + 1) {
      throw new Error("That sheet version does not follow the stored one")
    }
    if (releaseKeyWrapped.byteLength !== WRAPPED_KEY_BYTES) {
      throw new Error("Malformed sheet wrapper")
    }
    const now = Date.now()
    await ctx.db.patch("executors", executorId, {
      sheet: { releaseKeyWrapped, version, printedAt: now },
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "executor.sheet_printed",
      meta: { executorId, version },
      at: now,
    })
    return null
  },
})

export const remove = mutation({
  args: { executorId: v.id("executors") },
  handler: async (ctx, { executorId }) => {
    const user = await requireUser(ctx)
    const executor = await ctx.db.get("executors", executorId)
    if (executor === null || executor.userId !== user._id) {
      throw new Error("Not found")
    }
    await ctx.db.delete("executors", executorId)
    await writeAudit(ctx, {
      userId: user._id,
      event: "executor.removed",
      meta: { executorId },
    })
    return null
  },
})

/**
 * Once a year: are the executors' numbers still theirs, and does each still
 * have their sheet? Numbers get recycled and paper gets lost, and either
 * discovered after a death cannot be fixed.
 */
export const yearlyCheck = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const executors = await ctx.db
      .query("executors")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(20)
    if (executors.length === 0) return { due: false, confirmedAt: null }
    const since =
      user.executorsConfirmedAt ??
      Math.min(...executors.map((executor) => executor._creationTime))
    return {
      due: Date.now() - since > YEAR_MS,
      confirmedAt: user.executorsConfirmedAt ?? null,
    }
  },
})

export const confirmYearlyCheck = mutation({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const now = Date.now()
    await ctx.db.patch("users", user._id, { executorsConfirmedAt: now })
    await writeAudit(ctx, {
      userId: user._id,
      event: "executor.check_confirmed",
      meta: {},
      at: now,
    })
    return null
  },
})
