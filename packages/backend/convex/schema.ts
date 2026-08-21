import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"

// Define your tables here, e.g.
//   tasks: defineTable({ text: v.string(), isCompleted: v.boolean() }),
// See https://docs.convex.dev/database/schemas
export default defineSchema({
  // Clerk users, synced by the webhook in http.ts. Clerk owns the profile; this
  // table exists so functions can join user data without a network call and so
  // other tables have a stable `Id<"users">` to reference.
  users: defineTable({
    // The Clerk user id — the `sub` claim of the JWT Convex validates.
    externalId: v.string(),
    name: v.union(v.string(), v.null()),
    email: v.union(v.string(), v.null()),
  }).index("by_externalId", ["externalId"]),
})
