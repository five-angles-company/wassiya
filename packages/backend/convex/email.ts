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
import type { MutationCtx } from "./_generated/server"
import { writeAudit } from "./audit"
import {
  CLAIM_CLOSED_COPY,
  CLAIM_FILED_COPY,
  CLAIM_GUARDIAN_CONFIRMED_COPY,
  CLAIM_IN_REVIEW_COPY,
  CLAIM_RELEASED_COPY,
  CLAIM_REVIEW_FAILED_COPY,
  CLAIM_VETOED_COPY,
  ESCALATION_COPY,
  GUARDIAN_CLAIM_COPY,
  RECOVERY_COPY,
  type LocalisedCopy,
} from "./model/emailCopy"

export const resend: Resend = new Resend(components.resend, {
  // On unless explicitly turned off, so the safe state is the default one.
  testMode: process.env.RESEND_TEST_MODE !== "false",
})

/**
 * Where `apps/web` is, so a notice can point at the thing it is about.
 *
 * ⚠️ This is the **Convex deployment's** env, set with `npx convex env set
 * APP_URL …` — one value per deployment. Putting it in `apps/web/.env.local` or
 * `packages/backend/.env.local` does nothing at all, silently: neither is read
 * here. See the three-env-stores table in AGENTS.md.
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
function appLink(path: string): string | undefined {
  const base = process.env.APP_URL
  if (base === undefined || base.length === 0) {
    console.error(`APP_URL is not set — sending a link-free email for ${path}`)
    return undefined
  }
  return `${base.replace(/\/+$/, "")}${path}`
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
  const from = process.env.RESEND_FROM
  if (from === undefined) {
    // Loud in the logs, harmless to the caller: the state change itself already
    // landed, and a missing sender is a deployment problem to fix, not a reason
    // to stall a claim or an escalation ladder.
    console.error(`RESEND_FROM is not set — ${what} email not sent`)
    return
  }

  const user = await ctx.db.get("users", userId)
  if (user?.email == null) {
    console.error(`recipient has no email on record — ${what} email not sent`)
    return
  }

  const english = user.locale?.startsWith("en") === true
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

  await resend.sendEmail(ctx, {
    from,
    to: user.email,
    subject: text.subject,
    text: body,
  })

  // Written here and only here, after the message is actually enqueued — the
  // single funnel every notice passes through, so one call covers the
  // escalation ladder, the guardian notice and the recovery alert at once.
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
    userId,
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
 * Tell a guardian a claim is waiting on them.
 *
 * Sent from `claims.adminSetNameMatch`, in the same transaction that moves the
 * claim into `guardian_review`. Until this existed, that transition notified
 * **nobody**: it wrote an audit line and stopped, so a guardian could only learn
 * a claim was waiting by opening the app speculatively. Every other transition
 * in `claims.ts` notifies someone; this one was the gap.
 *
 * It was then suppressed for a further stretch by a `GUARDIAN_CAN_ACT` flag,
 * because the route it pointed at did not exist yet. It does now, and
 * `nameMatchBlockedReason`'s `no-guardian` block is what replaced the flag:
 * rather than approving and telling nobody, the approval is refused when there
 * is nobody to tell.
 */
export async function sendGuardianClaimNotice(
  ctx: MutationCtx,
  guardianUserId: Id<"users">
): Promise<void> {
  await send(
    ctx,
    guardianUserId,
    GUARDIAN_CLAIM_COPY,
    "guardian claim notice",
    appLink("/guardian")
  )
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
// Each takes the claim id and links to that claim's own page. That is safe in a
// way the guardian's notice is not — the id is the recipient's *own* case, and
// `claims.publicStatus` is written to be forwarded to a relative. The guardian's
// link stays at `/guardian` for the opposite reason.

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
    appLink(`/claims/${claimId}`)
  )
}

/** Approved, and now with the guardian. */
export async function sendClaimInReview(
  ctx: MutationCtx,
  claimantUserId: Id<"users">,
  claimId: Id<"claims">
): Promise<void> {
  await send(
    ctx,
    claimantUserId,
    CLAIM_IN_REVIEW_COPY,
    "claim in review",
    appLink(`/claims/${claimId}`)
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
    appLink(`/claims/${claimId}`)
  )
}

/**
 * The guardian confirmed, and the thirty-day clock has started.
 *
 * `vetoDeadline` is interpolated into `{date}` so the message names the day the
 * box opens on its own. That date is the difference between "wait" and "wait
 * until the twelfth" — and it is what makes "nothing is needed from you"
 * something a grieving person can actually act on.
 */
export async function sendClaimGuardianConfirmed(
  ctx: MutationCtx,
  claimantUserId: Id<"users">,
  claimId: Id<"claims">,
  vetoDeadline: number
): Promise<void> {
  await send(
    ctx,
    claimantUserId,
    CLAIM_GUARDIAN_CONFIRMED_COPY,
    "claim guardian confirmed",
    appLink(`/claims/${claimId}`),
    vetoDeadline
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
    appLink(`/claims/${claimId}`)
  )
}

/** Released — and the guardian still has to hand over their half. */
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
    appLink(`/box/${claimId}`)
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
    appLink(`/claims/${claimId}`)
  )
}
