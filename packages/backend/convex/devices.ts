// The device inventory behind the settings screen and, later, revocation.
//
// Nothing cryptographic lives here. Each enrolled device holds its own copy of
// MK sealed by a hardware-backed key its OS keystore controls, and that wrap
// never leaves the handset — so a row in this table is a *record* that a
// device was enrolled, not a means of unlocking anything. Revoking one is a UX
// and audit act; what actually stops that phone is its own keystore.
import { v } from "convex/values"

import type { Doc, Id } from "./_generated/dataModel"
import { mutation, query, type QueryCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireUser } from "./model/access"

const platform = v.union(
  v.literal("ios"),
  v.literal("android"),
  v.literal("web")
)

/**
 * Enrol the calling device, or return the row it already has.
 *
 * Keyed on `installId` — a random string the client writes to its keystore
 * *before* the first call — so this is idempotent. That ordering matters: a
 * crash between the write and this mutation just means the retry finds the
 * same `installId` and updates the same row, where a server-minted id would
 * have left an orphan and enrolled the same phone twice.
 *
 * Re-registering an install that was revoked deliberately does **not** clear
 * `revoked`. Coming back from a revocation is a recovery flow with its own
 * checks, not something re-opening the app should silently undo.
 */
export const register = mutation({
  args: {
    installId: v.string(),
    name: v.string(),
    platform,
  },
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    const existing = await byInstallId(ctx, user._id, args.installId)

    if (existing !== null) {
      if (existing.name !== args.name || existing.platform !== args.platform) {
        await ctx.db.patch("devices", existing._id, {
          name: args.name,
          platform: args.platform,
        })
      }
      return { deviceId: existing._id, created: false }
    }

    const deviceId = await ctx.db.insert("devices", {
      userId: user._id,
      installId: args.installId,
      name: args.name,
      platform: args.platform,
      revoked: false,
    })
    await writeAudit(ctx, {
      userId: user._id,
      event: "device.registered",
      deviceId,
      meta: { platform: args.platform },
    })
    return { deviceId, created: true }
  },
})

/** The caller's own devices. `installId` is not returned — it is a local secret
 * of each handset and no other device has any use for it. */
export const list = query({
  args: {},
  handler: async (ctx) => {
    const user = await requireUser(ctx)
    const devices = await ctx.db
      .query("devices")
      .withIndex("by_userId", (q) => q.eq("userId", user._id))
      .take(100)
    return devices.map((device) => ({
      id: device._id,
      name: device.name,
      platform: device.platform,
      lastUnlockAt: device.lastUnlockAt ?? null,
      revoked: device.revoked,
    }))
  },
})

async function byInstallId(
  ctx: QueryCtx,
  userId: Id<"users">,
  installId: string
): Promise<Doc<"devices"> | null> {
  return await ctx.db
    .query("devices")
    .withIndex("by_userId_and_installId", (q) =>
      q.eq("userId", userId).eq("installId", installId)
    )
    .unique()
}
