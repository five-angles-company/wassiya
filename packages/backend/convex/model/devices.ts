// Enrolling a handset in the owner's device inventory. Shared by
// `devices.register` (setup) and `keyring.markPaperUsed` (recovery), because a
// recovered phone must appear in `devices` in the same transaction that raises
// the alarm — never one without the other.
import { v, type Infer } from "convex/values"

import type { Doc, Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"
import { writeAudit } from "../audit"

export const devicePlatform = v.union(
  v.literal("ios"),
  v.literal("android"),
  v.literal("web")
)

export const deviceArgs = v.object({
  installId: v.string(),
  name: v.string(),
  platform: devicePlatform,
})

export type DeviceArgs = Infer<typeof deviceArgs>

/**
 * Enrol the device, or return the row it already has.
 *
 * Keyed on `installId` — a random string the client writes to its keystore
 * *before* calling — so this is idempotent: a crash between the write and the
 * call just means the retry finds the same row, where a server-minted id would
 * have enrolled the same phone twice.
 *
 * Re-enrolling an install that was revoked deliberately does **not** clear
 * `revoked`. Coming back from a revocation is not something re-opening the
 * app should silently undo.
 */
export async function enrolDevice(
  ctx: MutationCtx,
  user: Doc<"users">,
  args: DeviceArgs
): Promise<{ deviceId: Id<"devices">; created: boolean }> {
  const existing = await deviceByInstallId(ctx, user._id, args.installId)

  if (existing !== null) {
    if (existing.name !== args.name || existing.platform !== args.platform) {
      await ctx.db.patch("devices", existing._id, {
        name: args.name,
        platform: args.platform,
      })
    }
    return { deviceId: existing._id, created: false }
  }
  // A closed vault takes no new device: after a verified death, a phone set
  // up with the owner's sheet must not become a way in.
  if (user.vaultClosedAt !== undefined) {
    throw new Error("This vault was closed after a verified death")
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
}

export async function deviceByInstallId(
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
