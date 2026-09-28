// `identityLookup` mirrors `users.identityDocHashes` so a death report can
// find a vault by the ID number on the certificate. Every writer of
// `identityDocHashes` calls `syncIdentityLookup` in the same mutation —
// `scripts/verify-invariants.mjs` fails the build otherwise — or a report
// filed by number silently stops finding the vault.

import type { Id } from "../_generated/dataModel"
import type { MutationCtx, QueryCtx } from "../_generated/server"

/** Make this user's rows equal `hashes`. `[]` removes them all. */
export async function syncIdentityLookup(
  ctx: MutationCtx,
  userId: Id<"users">,
  hashes: readonly string[]
): Promise<void> {
  const wanted = new Set(hashes)
  const rows = await ctx.db
    .query("identityLookup")
    .withIndex("by_userId", (q) => q.eq("userId", userId))
    .take(50)
  for (const row of rows) {
    if (wanted.has(row.hash)) wanted.delete(row.hash)
    else await ctx.db.delete("identityLookup", row._id)
  }
  for (const hash of wanted) {
    await ctx.db.insert("identityLookup", { hash, userId })
  }
}

/** Every account whose verified document carries this number. */
export async function usersWithIdentityHash(
  ctx: QueryCtx,
  hash: string
): Promise<Id<"users">[]> {
  const rows = await ctx.db
    .query("identityLookup")
    .withIndex("by_hash", (q) => q.eq("hash", hash))
    .take(10)
  return [...new Set(rows.map((row) => row.userId))]
}
