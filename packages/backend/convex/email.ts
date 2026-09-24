// How this deployment reaches a human. The delivery funnel only — the words
// live in `model/emailCopy.ts`, because wording and mechanism change for
// different reasons and neither should put the other in its diff.
//
// The premise: an in-app notification escalates into silence for the one
// recipient who has stopped opening the app, which is precisely the person the
// dead man's switch is about.
//
// ## Why a component and not a `fetch`
//
// A dropped escalation notice is a safety failure, not a missed newsletter.
// `@convex-dev/resend` queues durably, retries through provider outages and
// manages Resend's idempotency keys, so a retry cannot double-send. A scheduled
// action wrapping `fetch` gets none of that: it throws once and the notice is
// gone.
//
// ## It is deliberately hard to send accidentally
//
// `testMode` is the component's own default and stays on unless the deployment
// says otherwise, so a dev environment cannot mail a real owner. Going live is
// `npx convex env set RESEND_TEST_MODE false` — on the **Convex deployment**,
// not in any `.env.local`; see the three-env-stores note in AGENTS.md.
import { Resend } from "@convex-dev/resend"

import { components } from "./_generated/api"
import type { Id } from "./_generated/dataModel"
import type { MutationCtx, QueryCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import {
  CLAIM_CLOSED_COPY,
  CLAIM_FILED_COPY,
  CLAIM_IN_REVIEW_COPY,
  CLAIM_RELEASED_COPY,
  CLAIM_REVIEW_FAILED_COPY,
  CLAIM_VETOED_COPY,
  DELIVERY_EXPIRING_COPY,
  DELIVERY_INVITE_COPY,
  DELIVERY_READY_COPY,
  ESCALATION_COPY,
  RECOVERY_COPY,
  STAFF_INVITE_COPY,
  SUPPORT_REPLY_COPY,
  SUPPORT_REPLY_GUEST_COPY,
  TEST_COPY,
  type LocalisedCopy,
} from "./model/emailCopy"
import { settingsFor } from "./model/settings"

/**
 * Built per send rather than once at module scope.
 *
 * `testMode` is a console toggle now, and module scope has no `ctx` with which
 * to read one — so the client is constructed where the setting can be resolved.
 * The component itself is still mounted once in `convex.config.ts`; this is
 * only the thin client over it.
 *
 * On unless explicitly turned off, so the safe state stays the default one.
 */
function mailer(testMode: boolean): Resend {
  return new Resend(components.resend, { testMode })
}

/**
 * Where `apps/web` is, so a notice can point at the thing it is about.
 *
 * Set in the admin console, falling back to the deployment's `APP_URL` — see
 * `model/settings.ts` for the precedence. Putting it in `apps/web/.env.local`
 * or `packages/backend/.env.local` does nothing at all, silently: neither is
 * read here. See the three-env-stores table in AGENTS.md.
 *
 * Not `CONVEX_SITE_URL`, which is on `env` already and looks like the answer.
 * That is the *deployment's* own HTTP origin — using it would mail people a
 * link to the backend.
 *
 * Unset degrades to a link-free email rather than a broken one. That is the
 * same shape as a missing `RESEND_FROM` and deliberate: a bare path, or an
 * origin guessed from anything, is worse than a message that names the site in
 * words and lets the reader find it — which is what every copy block here
 * already does.
 */
export async function appLink(
  // Reads only, so a query may build a link too — two delivery queries do.
  ctx: QueryCtx,
  path: string
): Promise<string | undefined> {
  const { appUrl } = await settingsFor(ctx)
  if (appUrl === null) {
    console.error(`No app URL is set — sending a link-free email for ${path}`)
    return undefined
  }
  return `${appUrl.replace(/\/+$/, "")}${path}`
}

/**
 * Deliver one notice, in the recipient's language.
 *
 * `resolveLocale`'s rule: the language subtag decides, the region is cosmetic.
 * Anything that is not English falls to Arabic, the default.
 *
 * Silently does nothing when the recipient has no email on record — every
 * account here is created from an email, so that is a broken row rather than a
 * case to design for, and a notice must never fail the transaction that
 * triggered it.
 */
async function send(
  ctx: MutationCtx,
  userId: Id<"users">,
  copy: LocalisedCopy,
  what: string,
  link?: string,
  date?: number
): Promise<void> {
  const { emailFrom, emailTestMode } = await settingsFor(ctx)
  if (emailFrom === null) {
    // Loud in the logs, harmless to the caller: the state change itself already
    // landed, and a missing sender is a configuration problem to fix, not a
    // reason to stall a claim or an escalation ladder.
    console.error(`No sender address is set — ${what} email not sent`)
    return
  }

  const user = await ctx.db.get("users", userId)
  if (user?.email == null) {
    console.error(`recipient has no email on record — ${what} email not sent`)
    return
  }
  await deliver(ctx, {
    from: emailFrom,
    testMode: emailTestMode,
    to: user.email,
    english: user.locale?.startsWith("en") === true,
    auditUserId: userId,
    copy,
    what,
    link,
    date,
  })
}

/**
 * The one place a message is formatted, enqueued and logged. `auditUserId`
 * is whose log records it — the recipient for account mail, the vault's owner
 * for a message to an heir, who has no account yet.
 */
async function deliver(
  ctx: MutationCtx,
  args: {
    from: string
    testMode: boolean
    to: string
    english: boolean
    auditUserId: Id<"users">
    copy: LocalisedCopy
    what: string
    link?: string
    date?: number
  }
): Promise<void> {
  const { from, english, copy, what, link, date } = args
  const text = copy[english ? "en" : "ar"]

  // `{date}` is the one placeholder any copy uses, and it is formatted here
  // rather than by the caller because this is where the recipient's language
  // is decided — a caller would have to resolve it a second time to format a
  // date in it, and the two could then disagree.
  const withDate =
    date === undefined
      ? text.body
      : text.body.replaceAll(
          "{date}",
          new Intl.DateTimeFormat(english ? "en-GB" : "ar", {
            day: "numeric",
            month: "long",
            year: "numeric",
          }).format(new Date(date))
        )

  // The link on its own line, and only when there is one. Every body is
  // written to stand without it, so an unset `APP_URL` costs a click rather
  // than the message.
  const body = link === undefined ? withDate : `${withDate}\n\n${link}`

  await mailer(args.testMode).sendEmail(ctx, {
    from,
    to: args.to,
    subject: text.subject,
    text: body,
  })

  // Written here and only here, after the message is actually enqueued — the
  // single funnel every notice passes through, so one call covers the
  // escalation ladder, the report notices and the recovery alert at once.
  // Until this existed no outbound mail left any record at all, and "did this
  // owner get the day-14 warning?" had no answer short of the Resend dashboard.
  //
  // Deliberately *after* the two early returns above. A missing `RESEND_FROM`
  // or a user with no address means no mail went out, and the absence of a row
  // beside a `checkin.escalated` is exactly the diagnostic worth having: the
  // rung advanced and nothing reached anyone.
  //
  // The kind, never the body. An escalation notice is a fact about someone's
  // mortality, the log is append-only and staff-readable, and `userId` already
  // identifies the recipient — the address would be a second copy of something
  // the users table holds.
  await writeAudit(ctx, {
    userId: args.auditUserId,
    event: "email.sent",
    meta: { kind: what },
  })
}

/**
 * Send one escalation notice.
 *
 * A plain helper, like `writeAudit` — not a registered mutation. The component
 * enqueues *inside* the caller's transaction, so `checkin.sweep` calls this in
 * the same step that advanced the row and "the state changed" and "the owner
 * was told" are one fact rather than two that can disagree. A registered
 * mutation could not be reached from another mutation anyway.
 */
export async function sendEscalation(
  ctx: MutationCtx,
  userId: Id<"users">,
  state: keyof typeof ESCALATION_COPY
): Promise<void> {
  await send(ctx, userId, ESCALATION_COPY[state], "escalation")
}

/**
 * Tell an owner their vault was opened with the printed sheet. See
 * `RECOVERY_COPY` for why this message exists and why it names so little.
 */
export async function sendRecoveryNotice(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<void> {
  await send(ctx, userId, RECOVERY_COPY, "recovery notice")
}

// ── The claimant's side ──────────────────────────────────────────────────────
//
// Six notices across a claim's life. Before them the heir was told nothing at
// all: no mail, and two in-app rows at the very end.
//
// Each takes the claim id and links to that claim's own page — the id is the
// recipient's *own* case, and `claims.publicStatus` is written to be forwarded
// to a relative.

/** Filed — the receipt. */
export async function sendClaimFiled(
  ctx: MutationCtx,
  claimantUserId: Id<"users">,
  claimId: Id<"claims">
): Promise<void> {
  await send(
    ctx,
    claimantUserId,
    CLAIM_FILED_COPY,
    "claim filed",
    await appLink(ctx, `/claims/${claimId}`)
  )
}

/**
 * Approved, and the thirty-day objection period has started. `vetoDeadline`
 * fills `{date}`, so the message names the day the report is released.
 */
export async function sendClaimInReview(
  ctx: MutationCtx,
  claimantUserId: Id<"users">,
  claimId: Id<"claims">,
  vetoDeadline: number
): Promise<void> {
  await send(
    ctx,
    claimantUserId,
    CLAIM_IN_REVIEW_COPY,
    "claim in review",
    await appLink(ctx, `/claims/${claimId}`),
    vetoDeadline
  )
}

/**
 * Closed at review. Carries no reason — see `CLAIM_REVIEW_FAILED_COPY`, and
 * `claims.publicStatus` for why the name-match verdict never reaches a
 * claimant.
 */
export async function sendClaimReviewFailed(
  ctx: MutationCtx,
  claimantUserId: Id<"users">,
  claimId: Id<"claims">
): Promise<void> {
  await send(
    ctx,
    claimantUserId,
    CLAIM_REVIEW_FAILED_COPY,
    "claim review failed",
    await appLink(ctx, `/claims/${claimId}`)
  )
}

/** The owner objected, and the 90-day bar applies. */
export async function sendClaimVetoed(
  ctx: MutationCtx,
  claimantUserId: Id<"users">,
  claimId: Id<"claims">
): Promise<void> {
  await send(
    ctx,
    claimantUserId,
    CLAIM_VETOED_COPY,
    "claim vetoed",
    await appLink(ctx, `/claims/${claimId}`)
  )
}

/** Released — Wassiya now contacts each named heir directly. */
export async function sendClaimReleased(
  ctx: MutationCtx,
  claimantUserId: Id<"users">,
  claimId: Id<"claims">
): Promise<void> {
  await send(
    ctx,
    claimantUserId,
    CLAIM_RELEASED_COPY,
    "claim released",
    await appLink(ctx, `/claims/${claimId}`)
  )
}

/** No vault matched, and the grace window ran out. */
export async function sendClaimClosed(
  ctx: MutationCtx,
  claimantUserId: Id<"users">,
  claimId: Id<"claims">
): Promise<void> {
  await send(
    ctx,
    claimantUserId,
    CLAIM_CLOSED_COPY,
    "claim closed",
    await appLink(ctx, `/claims/${claimId}`)
  )
}

// ── The heir's side ──────────────────────────────────────────────────────────
//
// Both link to the delivery page, which requires sign-in, so an intercepted
// mail reveals no more than that something is waiting.

/** Identity matched; the delivery can be opened. */
export async function sendDeliveryReady(
  ctx: MutationCtx,
  heirUserId: Id<"users">,
  deliveryId: Id<"deliveries">,
  expiresAt: number
): Promise<void> {
  await send(
    ctx,
    heirUserId,
    DELIVERY_READY_COPY,
    "delivery ready",
    await appLink(ctx, `/delivery/${deliveryId}`),
    expiresAt
  )
}

/** Thirty days before the delivery's key is destroyed. */
export async function sendDeliveryExpiring(
  ctx: MutationCtx,
  heirUserId: Id<"users">,
  deliveryId: Id<"deliveries">,
  expiresAt: number
): Promise<void> {
  await send(
    ctx,
    heirUserId,
    DELIVERY_EXPIRING_COPY,
    "delivery expiring",
    await appLink(ctx, `/delivery/${deliveryId}`),
    expiresAt
  )
}

/**
 * The first message an heir ever gets, to the address the owner registered or
 * staff recorded. Names nobody — see `DELIVERY_INVITE_COPY`. Returns whether
 * it was enqueued, for the contact log.
 */
export async function sendDeliveryInvite(
  ctx: MutationCtx,
  args: {
    to: string
    english: boolean
    ownerUserId: Id<"users">
    link: string
  }
): Promise<boolean> {
  const { emailFrom, emailTestMode } = await settingsFor(ctx)
  if (emailFrom === null) {
    console.error("No sender address is set — delivery invite email not sent")
    return false
  }
  await deliver(ctx, {
    from: emailFrom,
    testMode: emailTestMode,
    to: args.to,
    english: args.english,
    auditUserId: args.ownerUserId,
    copy: DELIVERY_INVITE_COPY,
    what: "delivery invite",
    link: args.link,
  })
  return true
}

/**
 * The settings page test send.
 *
 * Routed through `send` like every other notice, so it exercises the same
 * sender resolution, the same test-mode switch and the same audit line. A test
 * that took its own path would prove only that the test works.
 */
export async function sendTest(
  ctx: MutationCtx,
  userId: Id<"users">
): Promise<void> {
  await send(ctx, userId, TEST_COPY, "settings test")
}

/**
 * The staff invitation.
 *
 * Addressed to someone who may have no account, so it cannot go through `send`
 * — there is no `users` row to read a locale from, and the audit line is filed
 * under the Owner who invited them. English when the console's own operators
 * asked for it; Arabic otherwise, like everything else.
 */
export async function sendStaffInvite(
  ctx: MutationCtx,
  args: {
    to: string
    english: boolean
    invitedByUserId: Id<"users">
    link: string
  }
): Promise<boolean> {
  const { emailFrom, emailTestMode } = await settingsFor(ctx)
  if (emailFrom === null) {
    console.error("No sender address is set — staff invitation not sent")
    return false
  }
  await deliver(ctx, {
    from: emailFrom,
    testMode: emailTestMode,
    to: args.to,
    english: args.english,
    auditUserId: args.invitedByUserId,
    copy: STAFF_INVITE_COPY,
    what: "staff invitation",
    link: args.link,
  })
  return true
}

// ── Support ──────────────────────────────────────────────────────────────────

/** A staff reply still unread by an account holder. See `SUPPORT_REPLY_COPY`. */
export async function sendSupportReply(
  ctx: MutationCtx,
  userId: Id<"users">,
  link: string | undefined
): Promise<void> {
  await send(ctx, userId, SUPPORT_REPLY_COPY, "support reply", link)
}

/**
 * A staff reply still unread by a guest. There is no account to log against,
 * so the audit line is filed under the staff member who replied — the same
 * choice `sendStaffInvite` makes for its inviter.
 */
export async function sendSupportGuestReply(
  ctx: MutationCtx,
  args: {
    to: string
    english: boolean
    staffUserId: Id<"users">
    link: string
  }
): Promise<boolean> {
  const { emailFrom, emailTestMode } = await settingsFor(ctx)
  if (emailFrom === null) {
    console.error("No sender address is set — support reply email not sent")
    return false
  }
  await deliver(ctx, {
    from: emailFrom,
    testMode: emailTestMode,
    to: args.to,
    english: args.english,
    auditUserId: args.staffUserId,
    copy: SUPPORT_REPLY_GUEST_COPY,
    what: "support guest reply",
    link: args.link,
  })
  return true
}
