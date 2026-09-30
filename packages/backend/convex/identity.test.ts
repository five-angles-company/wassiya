/// <reference types="vite/client" />
import { convexTest } from "convex-test"
import { describe, expect, test } from "vitest"

import { internal } from "./_generated/api"
import schema from "./schema"

const modules = import.meta.glob("/convex/**/*.*s")

process.env.IDENTITY_HASH_SECRET = "test-identity-hash-secret-0123456789abcdef"

async function setup(status: "verified" | "unverified", sessionId: string) {
  const t = convexTest(schema, modules)
  const userId = await t.run((ctx) =>
    ctx.db.insert("users", {
      externalId: "person",
      name: "person",
      email: "person@example.com",
      role: "owner",
      identityStatus: status,
      diditSessionId: sessionId,
    })
  )
  const user = () => t.run((ctx) => ctx.db.get("users", userId))
  const webhook = (
    session: string,
    result: "verified" | "rejected" | "pending",
    declined = false
  ) =>
    t.mutation(internal.identity.applyWebhookResult, {
      sessionId: session,
      vendorData: userId,
      status: result,
      declined,
    })
  return { user, webhook }
}

describe("Didit results that arrive late or out of order", () => {
  test("a superseded session's failure changes nothing", async () => {
    const { user, webhook } = await setup("unverified", "B")
    await webhook("A", "rejected", true)
    expect((await user())?.identityStatus).toBe("unverified")
    expect((await user())?.identityAttempts ?? 0).toBe(0)
  })

  test("nothing but an approval touches a verified person", async () => {
    const { user, webhook } = await setup("verified", "B")
    await webhook("A", "rejected", true)
    await webhook("B", "pending")
    await webhook("B", "rejected")
    expect((await user())?.identityStatus).toBe("verified")
  })

  test("an approval from an earlier session counts, and becomes the session on record", async () => {
    const { user, webhook } = await setup("unverified", "B")
    await webhook("A", "verified")
    const after = await user()
    expect(after?.identityStatus).toBe("verified")
    expect(after?.diditSessionId).toBe("A")
  })

  test("the current session's decline still counts as an attempt", async () => {
    const { user, webhook } = await setup("unverified", "B")
    await webhook("B", "rejected", true)
    expect((await user())?.identityStatus).toBe("rejected")
    expect((await user())?.identityAttempts).toBe(1)
  })
})
