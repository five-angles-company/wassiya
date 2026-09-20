// Deployment settings, from the console.
//
// What lives here is what an operator tunes: who mail comes from, whether it is
// live, whether heir outreach sends, and where the app is. What does not live
// here is every credential — see `model/settings.ts` for why, and `status`
// below for how the console reports them without ever returning one.
import { v } from "convex/values"

import { internalQuery, mutation, query } from "./_generated/server"
import { writeStaffAudit } from "./audit"
import { ESCALATION_STEPS, SNOOZE_DAYS } from "./checkin"
import { sendTest } from "./email"
import { MAX_IDENTITY_ATTEMPTS } from "./identity"
import { requirePermission } from "./model/access"
import {
  CLAIM_RATE_LIMIT,
  DELIVERY_WINDOW_DAYS,
  VETO_LOCKOUT_DAYS,
  VETO_WINDOW_DAYS,
} from "./model/claimFlow"
import {
  credentialStatus,
  resolve,
  settingsFor,
  settingsRow,
} from "./model/settings"

const provider = v.union(v.literal("off"), v.literal("twilio"))

/**
 * What the console edits, and what it would resolve to.
 *
 * Both halves, deliberately: `stored` is what the row holds and is what the
 * form renders, `effective` is what the deployment actually runs on. An empty
 * field that falls back to an environment variable looks identical to an empty
 * field that falls back to nothing, and the difference is whether mail is
 * going out.
 */
export const current = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "settings.read")
    const row = await settingsRow(ctx)
    return {
      stored: {
        emailFrom: row?.emailFrom ?? null,
        emailTestMode: row?.emailTestMode ?? null,
        outreachProvider: row?.outreachProvider ?? null,
        twilioFrom: row?.twilioFrom ?? null,
        appUrl: row?.appUrl ?? null,
        consoleUrl: row?.consoleUrl ?? null,
      },
      effective: resolve(row),
      updatedAt: row?.updatedAt ?? null,
      // Booleans only. These are the values the console cannot set and must
      // never show — but "no mail is going out" and "the sender is wrong" look
      // the same from outside, and this is what tells them apart.
      credentials: credentialStatus(),
    }
  },
})

/** The resolved pair the outreach action needs; an action cannot read the db. */
export const outreachConfig = internalQuery({
  args: {},
  handler: async (ctx) => {
    const { outreachProvider, twilioFrom } = await settingsFor(ctx)
    return { provider: outreachProvider, from: twilioFrom }
  },
})

/**
 * Save the settings.
 *
 * Validated here rather than in the form, because the form is not the only
 * thing that could call this and because a malformed sender is how mail stops
 * silently — Resend rejects it, the send path logs, and nobody is watching the
 * logs. Empty strings clear a field back to its environment fallback; they are
 * not values.
 */
export const adminSave = mutation({
  args: {
    emailFrom: v.string(),
    emailTestMode: v.boolean(),
    outreachProvider: provider,
    twilioFrom: v.string(),
    appUrl: v.string(),
    consoleUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const actor = await requirePermission(ctx, "settings.manage")

    const emailFrom = args.emailFrom.trim()
    const twilioFrom = args.twilioFrom.trim()
    const appUrl = args.appUrl.trim().replace(/\/+$/, "")
    const consoleUrl = args.consoleUrl.trim().replace(/\/+$/, "")

    if (emailFrom !== "" && !isSender(emailFrom)) {
      throw new Error(
        "The sender must be an email address, or a name with one in angle brackets"
      )
    }
    if (appUrl !== "" && !isHttpUrl(appUrl)) {
      throw new Error("The app URL must start with http:// or https://")
    }
    if (consoleUrl !== "" && !isHttpUrl(consoleUrl)) {
      throw new Error("The console URL must start with http:// or https://")
    }
    if (twilioFrom !== "" && !isTwilioSender(twilioFrom)) {
      throw new Error(
        "The SMS sender must be a number in +E.164 form, or a Messaging Service SID starting MG"
      )
    }
    // Refused rather than saved-and-ignored: a provider set to twilio with no
    // sender sends nothing, and the console would have shown it as on.
    if (args.outreachProvider === "twilio" && twilioFrom === "") {
      throw new Error("Heir outreach needs an SMS sender before it can be on")
    }

    const next = {
      emailFrom,
      emailTestMode: args.emailTestMode,
      outreachProvider: args.outreachProvider,
      twilioFrom,
      appUrl,
      consoleUrl,
      updatedAt: Date.now(),
    }

    const row = await settingsRow(ctx)
    if (row === null) {
      await ctx.db.insert("settings", next)
    } else {
      await ctx.db.replace("settings", row._id, next)
    }

    // The subject is the deployment, not a person, so the admin is both actor
    // and subject. No value is recorded beyond the two that are switches: the
    // rest are addresses, and the audit log is not the place to keep a second
    // copy of them.
    await writeStaffAudit(ctx, {
      actor,
      subject: actor._id,
      event: "settings.saved",
      meta: {
        emailTestMode: next.emailTestMode,
        outreachProvider: next.outreachProvider,
      },
    })
    return null
  },
})

/**
 * Send a test message to the operator's own address.
 *
 * A settings page you cannot verify from is a settings page you do not trust:
 * a good sender and a typo look identical until an escalation fails, which is
 * the one moment nobody is watching. This goes only to the signed-in admin, so
 * it cannot be used to mail anyone else.
 */
export const adminSendTestEmail = mutation({
  args: {},
  handler: async (ctx) => {
    const actor = await requirePermission(ctx, "settings.manage")
    if (actor.email === null || actor.email === undefined) {
      throw new Error("Your account has no email address on record")
    }
    const { emailFrom } = await settingsFor(ctx)
    if (emailFrom === null) {
      throw new Error("Set a sender address first")
    }

    await sendTest(ctx, actor._id)
    return { to: actor.email }
  },
})

function isSender(value: string): boolean {
  const address = value.includes("<")
    ? (value.match(/<([^>]+)>/)?.[1] ?? "")
    : value
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim())
}

function isHttpUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === "http:" || url.protocol === "https:"
  } catch {
    return false
  }
}

/** An E.164 number, or a Twilio Messaging Service SID. */
function isTwilioSender(value: string): boolean {
  return /^\+[1-9]\d{6,14}$/.test(value) || /^MG[0-9a-fA-F]{32}$/.test(value)
}

/**
 * The windows the product runs on, read-only.
 *
 * Served rather than restated in the console, for the reason the plan
 * catalogue is: a number copied into a component is wrong the day the code
 * changes, and nothing surfaces it. These are the answer to "how long until
 * this opens?", which staff are asked by families and could previously only
 * get by reading source.
 *
 * **Deliberately no writer.** Several of these are promises AGENTS.md marks
 * LOCKED — the veto window and the one-year delivery window in particular —
 * and a mistyped box is not the way to change how long a grieving family
 * waits, or when an heir's key is destroyed forever. Changing one stays a code
 * change and a review.
 */
export const policy = query({
  args: {},
  handler: async (ctx) => {
    await requirePermission(ctx, "settings.read")
    return {
      vetoWindowDays: VETO_WINDOW_DAYS,
      vetoLockoutDays: VETO_LOCKOUT_DAYS,
      deliveryWindowDays: DELIVERY_WINDOW_DAYS,
      claimRateLimitPerDay: CLAIM_RATE_LIMIT,
      snoozeDays: SNOOZE_DAYS,
      escalationDays: ESCALATION_STEPS.map((step) => step.afterDays),
      maxIdentityAttempts: MAX_IDENTITY_ATTEMPTS,
      diditWorkflowConfigured: (process.env.DIDIT_WORKFLOW_ID ?? "") !== "",
    }
  },
})

// Who works in the console is `staff.ts`, not a setting. It moved there with
// RBAC: the list and the roles beside it are one screen, and the query that
// serves them needs `staff.read` rather than the key that edits a sender
// address.
