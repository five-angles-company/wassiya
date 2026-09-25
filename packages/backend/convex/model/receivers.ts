// Who receives what at release — one definition, read by the release gate,
// by delivery creation and by the console.
//
// An heir receives every asset routed to them by name, every asset routed to
// all heirs jointly, and their personal message. "allHeirs" is folded in at read
// time rather than expanded at write time, so an heir added after a shared
// route still receives it.
import type { Doc, Id } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"

/**
 * The routing rows that reach one heir. Two indexed reads rather than one
 * filtered scan: an owner with hundreds of executor rows would otherwise push
 * an "allHeirs" row past the window and silently drop an asset out of an
 * heir's inheritance.
 */
export async function routesForHeir(
  ctx: QueryCtx,
  ownerId: Id<"users">,
  heirId: Id<"heirs">
): Promise<Doc<"assetRecipients">[]> {
  const direct = await ctx.db
    .query("assetRecipients")
    .withIndex("by_userId_and_recipientHeirId", (q) =>
      q.eq("userId", ownerId).eq("recipientHeirId", heirId)
    )
    .take(500)
  const shared = await ctx.db
    .query("assetRecipients")
    .withIndex("by_userId_and_recipientKind", (q) =>
      q.eq("userId", ownerId).eq("recipientKind", "allHeirs")
    )
    .take(500)
  return [...direct, ...shared]
}

/** The heirs among `heirs` who would receive anything if released today. */
export async function heirsWhoReceive(
  ctx: QueryCtx,
  ownerId: Id<"users">,
  heirs: Doc<"heirs">[]
): Promise<Set<Id<"heirs">>> {
  const shared = await ctx.db
    .query("assetRecipients")
    .withIndex("by_userId_and_recipientKind", (q) =>
      q.eq("userId", ownerId).eq("recipientKind", "allHeirs")
    )
    .take(1)
  if (shared.length > 0) return new Set(heirs.map((heir) => heir._id))

  const named = await ctx.db
    .query("assetRecipients")
    .withIndex("by_userId_and_recipientKind", (q) =>
      q.eq("userId", ownerId).eq("recipientKind", "heir")
    )
    .take(2000)
  const routed = new Set<string>()
  for (const row of named) {
    if (row.recipientHeirId !== undefined) routed.add(row.recipientHeirId)
  }
  return new Set(
    heirs
      .filter((heir) => routed.has(heir._id) || heir.messageMeta !== undefined)
      .map((heir) => heir._id)
  )
}
