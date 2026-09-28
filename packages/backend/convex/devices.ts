// The device inventory behind the settings screen and, later, revocation.
//
// Nothing cryptographic lives here. Each enrolled device holds its own copy of
// MK sealed by a hardware-backed key its OS keystore controls, and that wrap
// never leaves the handset — so a row in this table is a *record* that a
// device was enrolled, not a means of unlocking anything. Revoking one is a UX
// and audit act; what actually stops that phone is its own keystore.
import { v } from "convex/values"

import { mutation, query } from "./_generated/server"
import { writeAudit } from "./audit"
import { requireUser } from "./model/access"
import { deviceArgs, deviceByInstallId, enrolDevice } from "./model/devices"

/** Enrol the calling device, or return the row it already has. */
export const register = mutation({
  args: deviceArgs.fields,
  handler: async (ctx, args) => {
    const user = await requireUser(ctx)
    return await enrolDevice(ctx, user, args)
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

/**
 * Revoke a device.
 *
 * The schema's own note explains what this does and does not do: *"The enclave
 * wrap of MK never leaves the device, so there is no ciphertext column here —
 * revoking a row is a UX and audit act, and the device's local copy of MK is
 * what its own OS keystore controls."*
 *
 * That is worth restating on the screen rather than hiding, because the
 * intuition is wrong in a dangerous direction: revoking here does **not** reach
 * into a lost phone and erase its key. What it does is remove the device from
 * the owner's own inventory and leave an audit line, so a device the owner does
 * not recognise stops being quietly listed as theirs. A phone genuinely out of
 * the owner's hands is answered by rotating the recovery sheet and the
 * guardian's share, which is what invalidates the material it holds.
 *
 * Kept revocable rather than deletable so the audit trail keeps its subject.
 */
export const revoke = mutation({
  args: { deviceId: v.id("devices") },
  handler: async (ctx, { deviceId }) => {
    const user = await requireUser(ctx)
    const device = await ctx.db.get("devices", deviceId)
    if (device === null || device.userId !== user._id) {
      throw new Error("Not found")
    }
    if (device.revoked) return null

    await ctx.db.patch("devices", deviceId, { revoked: true })
    await writeAudit(ctx, {
      userId: user._id,
      event: "device.revoked",
      deviceId,
      meta: { name: device.name, platform: device.platform },
    })
    return null
  },
})

/**
 * This install's Expo push token, or `null` to stop pushes to it (permission
 * withdrawn, signed out). Only for a device the caller owns and has not
 * revoked — a revoked phone must stop hearing about the account.
 */
export const setPushToken = mutation({
  args: { installId: v.string(), token: v.union(v.string(), v.null()) },
  handler: async (ctx, { installId, token }) => {
    const user = await requireUser(ctx)
    const device = await deviceByInstallId(ctx, user._id, installId)
    if (device === null || device.revoked) throw new Error("Not found")
    if (token !== null && !/^Expo(nent)?PushToken\[[^\]]+\]$/.test(token)) {
      throw new Error("Not an Expo push token")
    }
    if (device.pushToken !== (token ?? undefined)) {
      await ctx.db.patch("devices", device._id, {
        pushToken: token ?? undefined,
      })
    }
    return null
  },
})
