/// <reference types="vite/client" />
import rateLimiter from "@convex-dev/rate-limiter/test"
import { convexTest } from "convex-test"
import { ConvexError } from "convex/values"
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest"

import { api, internal } from "../_generated/api"
import type { Id } from "../_generated/dataModel"
import { looksLikeRecoveryCode } from "../model/support"
import schema from "../schema"

const modules = import.meta.glob("/convex/**/*.*s")

const GUEST = "g".repeat(40)
const OTHER_GUEST = "h".repeat(40)

function setup() {
  const t = convexTest(schema, modules)
  rateLimiter.register(t)
  return t
}

async function addUser(
  t: ReturnType<typeof setup>,
  externalId: string,
  staffPermissions?: string[]
): Promise<Id<"users">> {
  return await t.run(async (ctx) =>
    ctx.db.insert("users", {
      externalId,
      name: externalId,
      email: `${externalId}@example.com`,
      role: staffPermissions === undefined ? "owner" : "admin",
      identityStatus: "verified",
      staffPermissions,
    })
  )
}

const as = (t: ReturnType<typeof setup>, externalId: string) =>
  t.withIdentity({ subject: externalId })

const startArgs = {
  surface: "web" as const,
  topic: "other" as const,
  locale: "ar" as const,
  body: "مرحباً، أحتاج مساعدة",
  attachments: [],
}

function supportReason(error: unknown): string | null {
  if (!(error instanceof ConvexError)) return null
  const data = error.data as { code?: string; reason?: string }
  return data.code === "support" ? (data.reason ?? null) : null
}

beforeEach(() => {
  vi.useFakeTimers()
})
afterEach(() => {
  vi.useRealTimers()
})

describe("requester access", () => {
  test("a user reads their own thread and nobody else can", async () => {
    const t = setup()
    await addUser(t, "alice")
    await addUser(t, "bob")
    const threadId = await as(t, "alice").mutation(
      api.support.threads.start,
      startArgs
    )

    const mine = await as(t, "alice").query(api.support.threads.thread, {
      threadId,
    })
    expect(mine?.status).toBe("open")

    expect(
      await as(t, "bob").query(api.support.threads.thread, { threadId })
    ).toBeNull()
    await expect(
      as(t, "bob").query(api.support.threads.messages, {
        threadId,
        paginationOpts: { numItems: 10, cursor: null },
      })
    ).rejects.toThrow("Not found")
    await expect(
      as(t, "bob").mutation(api.support.threads.send, {
        threadId,
        body: "hi",
        attachments: [],
      })
    ).rejects.toThrow("Not found")
    // A guest token cannot reach an account's thread either.
    expect(
      await t.query(api.support.threads.thread, {
        threadId,
        guestToken: GUEST,
      })
    ).toBeNull()
  })

  test("a guest needs the token that started the thread", async () => {
    const t = setup()
    const threadId = await t.mutation(api.support.threads.start, {
      ...startArgs,
      guestToken: GUEST,
      guestName: "Sara",
      guestEmail: "Sara@Example.com",
    })
    const own = await t.query(api.support.threads.thread, {
      threadId,
      guestToken: GUEST,
    })
    expect(own?.id).toBe(threadId)
    expect(
      await t.query(api.support.threads.thread, {
        threadId,
        guestToken: OTHER_GUEST,
      })
    ).toBeNull()
    expect(
      await t.query(api.support.threads.thread, { threadId })
    ).toBeNull()
  })

  test("a guest must give a name and a real email", async () => {
    const t = setup()
    const error = await t
      .mutation(api.support.threads.start, {
        ...startArgs,
        guestToken: GUEST,
        guestName: "Sara",
        guestEmail: "not-an-email",
      })
      .catch((cause: unknown) => cause)
    expect(supportReason(error)).toBe("guest_details")
  })

  test("a short guest token is no identity at all", async () => {
    const t = setup()
    await expect(
      t.mutation(api.support.threads.start, {
        ...startArgs,
        guestToken: "short",
        guestName: "Sara",
        guestEmail: "sara@example.com",
      })
    ).rejects.toThrow("Not authenticated")
  })

  test("a guest cannot open threads without limit", async () => {
    const t = setup()
    const guest = {
      ...startArgs,
      guestToken: GUEST,
      guestName: "Sara",
      guestEmail: "sara@example.com",
    }
    for (let i = 0; i < 3; i++) {
      await t.mutation(api.support.threads.start, guest)
    }
    await expect(
      t.mutation(api.support.threads.start, guest)
    ).rejects.toThrow()
  })

  test("a claim that is not the caller's cannot be named as context", async () => {
    const t = setup()
    const alice = await addUser(t, "alice")
    await addUser(t, "bob")
    const claimId = await t.run(async (ctx) =>
      ctx.db.insert("claims", {
        claimantName: "Alice",
        claimantContact: "alice@example.com",
        claimantUserId: alice,
        claimantIdentityStatus: "verified",
        status: "submitted",
      })
    )
    await as(t, "alice").mutation(api.support.threads.start, {
      ...startArgs,
      topic: "claim",
      claimId,
    })
    const error = await as(t, "bob")
      .mutation(api.support.threads.start, {
        ...startArgs,
        topic: "claim",
        claimId,
      })
      .catch((cause: unknown) => cause)
    expect(supportReason(error)).toBe("context")
  })
})

describe("the recovery sheet never travels through support", () => {
  const code =
    "WSY1-ABCD-EFGH-JKLM-NPQR-STUV-WXYZ-2345-6789-ABCD-EFGH-JKLM-NPQR-STUV-WXYZ"

  test("the detector", () => {
    expect(looksLikeRecoveryCode(code)).toBe(true)
    expect(looksLikeRecoveryCode(code.slice(5).toLowerCase())).toBe(true)
    expect(
      looksLikeRecoveryCode("this will make some very good tree when done")
    ).toBe(false)
    expect(looksLikeRecoveryCode("رقم الطلب 12345")).toBe(false)
  })

  test("a pasted code is refused", async () => {
    const t = setup()
    await addUser(t, "alice")
    const error = await as(t, "alice")
      .mutation(api.support.threads.start, {
        ...startArgs,
        body: `here is my sheet ${code}`,
      })
      .catch((cause: unknown) => cause)
    expect(supportReason(error)).toBe("recovery_code")
  })
})

describe("staff", () => {
  test("only staff holding support.reply can answer", async () => {
    const t = setup()
    await addUser(t, "alice")
    await addUser(t, "reader", ["support.read"])
    await addUser(t, "agent", ["support.read", "support.reply"])
    const threadId = await as(t, "alice").mutation(
      api.support.threads.start,
      startArgs
    )

    await expect(
      as(t, "alice").mutation(api.support.admin.adminReply, {
        threadId,
        body: "x",
        attachments: [],
      })
    ).rejects.toThrow("Not authorised")
    await expect(
      as(t, "reader").mutation(api.support.admin.adminReply, {
        threadId,
        body: "x",
        attachments: [],
      })
    ).rejects.toThrow("needs support.reply")

    await as(t, "agent").mutation(api.support.admin.adminReply, {
      threadId,
      body: "أهلاً، كيف نساعدك؟",
      attachments: [],
    })
    const thread = await as(t, "alice").query(api.support.threads.thread, {
      threadId,
    })
    expect(thread?.status).toBe("waiting")
    expect(thread?.unread).toBe(true)
  })

  test("notes and staff identity never reach the requester", async () => {
    const t = setup()
    await addUser(t, "alice")
    await addUser(t, "agent", ["support.read", "support.reply"])
    const threadId = await as(t, "alice").mutation(
      api.support.threads.start,
      startArgs
    )
    await as(t, "agent").mutation(api.support.admin.adminNote, {
      threadId,
      body: "internal: checked the account",
    })
    await as(t, "agent").mutation(api.support.admin.adminReply, {
      threadId,
      body: "done",
      attachments: [],
    })

    const page = await as(t, "alice").query(api.support.threads.messages, {
      threadId,
      paginationOpts: { numItems: 50, cursor: null },
    })
    const serialised = JSON.stringify(page)
    expect(serialised).not.toContain("internal: checked")
    expect(serialised).not.toContain("agent")
    expect(page.page.map((message) => message.author)).toEqual([
      "staff",
      "requester",
    ])

    const staffView = await as(t, "agent").query(api.support.admin.adminThread, {
      threadId,
    })
    expect(staffView?.notes).toHaveLength(1)
  })

  test("moving someone else's thread needs support.manage", async () => {
    const t = setup()
    await addUser(t, "alice")
    const agent = await addUser(t, "agent", ["support.read", "support.reply"])
    const other = await addUser(t, "other", ["support.read", "support.reply"])
    await addUser(t, "lead", ["support.read", "support.reply", "support.manage"])
    const threadId = await as(t, "alice").mutation(
      api.support.threads.start,
      startArgs
    )

    await as(t, "agent").mutation(api.support.admin.adminAssign, {
      threadId,
      assigneeUserId: agent,
    })
    await expect(
      as(t, "other").mutation(api.support.admin.adminAssign, {
        threadId,
        assigneeUserId: other,
      })
    ).rejects.toThrow("support.manage")
    await as(t, "lead").mutation(api.support.admin.adminAssign, {
      threadId,
      assigneeUserId: other,
    })
    const row = await t.run(async (ctx) => ctx.db.get("supportThreads", threadId))
    expect(row?.assigneeUserId).toBe(other)
  })
})

describe("reply notices", () => {
  test("an unread reply leaves a notification; a read one does not", async () => {
    const t = setup()
    const alice = await addUser(t, "alice")
    await addUser(t, "agent", ["support.read", "support.reply"])

    const unreadThread = await as(t, "alice").mutation(
      api.support.threads.start,
      startArgs
    )
    const readThread = await as(t, "alice").mutation(
      api.support.threads.start,
      startArgs
    )
    for (const threadId of [unreadThread, readThread]) {
      await as(t, "agent").mutation(api.support.admin.adminReply, {
        threadId,
        body: "reply",
        attachments: [],
      })
    }
    await as(t, "alice").mutation(api.support.threads.markRead, {
      threadId: readThread,
    })

    await t.finishAllScheduledFunctions(vi.runAllTimers)

    const notices = await t.run(async (ctx) =>
      ctx.db
        .query("notifications")
        .withIndex("by_userId", (q) => q.eq("userId", alice))
        .collect()
    )
    expect(notices.map((row) => row.payload.threadId)).toEqual([unreadThread])
  })
})

describe("retention", () => {
  test("files go after the window; the text stays", async () => {
    const t = setup()
    await addUser(t, "alice")
    await addUser(t, "agent", ["support.read", "support.reply"])
    const storageId = await t.run(async (ctx) =>
      ctx.storage.store(new Blob(["png"], { type: "image/png" }))
    )
    const threadId = await as(t, "alice").mutation(
      api.support.threads.start,
      startArgs
    )
    // convex-test records no contentType on stored blobs, so the upload check
    // cannot pass here; attach the file as `resolveAttachments` would have.
    await t.run(async (ctx) => {
      const first = await ctx.db
        .query("supportMessages")
        .withIndex("by_threadId_and_at", (q) => q.eq("threadId", threadId))
        .first()
      await ctx.db.patch("supportMessages", first!._id, {
        attachments: [
          { storageId, name: "screen.png", contentType: "image/png", size: 3 },
        ],
      })
    })
    await as(t, "agent").mutation(api.support.admin.adminSetStatus, {
      threadId,
      status: "resolved",
    })

    await t.mutation(internal.support.retention.purgeFiles, {})
    expect(
      await t.run(async (ctx) => ctx.storage.getUrl(storageId))
    ).not.toBeNull()

    vi.advanceTimersByTime(181 * 24 * 60 * 60 * 1000)
    await t.mutation(internal.support.retention.purgeFiles, {})
    expect(await t.run(async (ctx) => ctx.storage.getUrl(storageId))).toBeNull()
    const messages = await t.run(async (ctx) =>
      ctx.db
        .query("supportMessages")
        .withIndex("by_threadId_and_at", (q) => q.eq("threadId", threadId))
        .collect()
    )
    expect(messages[0]?.attachments).toEqual([])
    expect(messages[0]?.body).toBe(startArgs.body)
  })
})
