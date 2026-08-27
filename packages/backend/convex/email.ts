// The one thing this deployment says to a human.
//
// Until now nothing here could reach anyone: the only outbound call in the
// whole backend went to Didit. That mattered most for the dead man's switch,
// whose entire premise is that the owner has stopped opening the app — so
// escalating by writing an in-app notification escalated into silence, and an
// owner who was merely travelling was walked toward release without ever being
// asked.
//
// This module is that ask.
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

export const resend: Resend = new Resend(components.resend, {
  // On unless explicitly turned off, so the safe state is the default one.
  testMode: process.env.RESEND_TEST_MODE !== "false",
})

/**
 * The escalation ladder, in the owner's own language.
 *
 * Copy lives here rather than in the app because the app is exactly what the
 * recipient is not looking at. It is kept plain on purpose: a message that
 * reads like a marketing send is one a worried person distrusts, and this is
 * the message that has to be believed.
 *
 * `countdown` is not merely louder — it is the step where the veto window is
 * running, so it says what will happen and by when.
 */
const COPY = {
  day0: {
    ar: {
      subject: "حان وقت تأكيد الحياة",
      body: "مرّ موعد تأكيدك. افتح وصيّة وأكّد ببصمتك — لا شيء يتحرّك قبل ذلك.",
    },
    en: {
      subject: "Your check-in is due",
      body: "Your check-in date has passed. Open Wassiya and confirm with your fingerprint — nothing moves before that.",
    },
  },
  day7: {
    ar: {
      subject: "أسبوع على موعد تأكيدك",
      body: "لم نسمع منك منذ أسبوع. افتح وصيّة وأكّد ببصمتك.",
    },
    en: {
      subject: "A week since your check-in was due",
      body: "We have not heard from you in a week. Open Wassiya and confirm with your fingerprint.",
    },
  },
  day14: {
    ar: {
      subject: "أسبوعان — سنبدأ بالتواصل مع وصيّك",
      body: "لم نسمع منك منذ أسبوعين. إن لم تؤكّد، ستبدأ إجراءات التحقّق مع وصيّك.",
    },
    en: {
      subject: "Two weeks — we will start contacting your guardian",
      body: "We have not heard from you in two weeks. If you do not confirm, verification with your guardian begins.",
    },
  },
  countdown: {
    ar: {
      subject: "مهم: بدأت مهلة الاعتراض على خزنتك",
      body: "بدأت المهلة التي تسبق تسليم خزنتك إلى ورثتك. تأكيدك الآن يوقف ذلك فوراً.",
    },
    en: {
      subject: "Important: the veto window on your vault has started",
      body: "The window before your vault is handed to your heirs has begun. Confirming now stops it immediately.",
    },
  },
} as const

/**
 * The notice a guardian gets when a death claim reaches them.
 *
 * Deliberately says almost nothing. It names no claimant, no deceased and no
 * vault: an email is the least controlled surface this product touches, and a
 * guardian's inbox is not a place to disclose that a particular person has died
 * or that a particular person filed about it. It says only that something is
 * waiting and that the app is where it lives — which is all the recipient needs
 * to take the next step, and all an interceptor learns.
 */
const GUARDIAN_CLAIM_COPY = {
  ar: {
    subject: "طلب ينتظر تأكيدك",
    body: "هناك طلب على خزنة أنت وصيٌّ عليها ينتظر تأكيدك. افتح وصيّة لمراجعته — لا يمكن تأكيده من البريد.",
  },
  en: {
    subject: "Something is waiting for your confirmation",
    body: "A claim on a vault you guard is waiting for you. Open Wassiya to review it — it cannot be confirmed from email.",
  },
} as const

type Copy = { subject: string; body: string }

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
  copy: { ar: Copy; en: Copy },
  what: string
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

  const text = copy[user.locale?.startsWith("en") === true ? "en" : "ar"]

  await resend.sendEmail(ctx, {
    from,
    to: user.email,
    subject: text.subject,
    text: text.body,
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
  state: keyof typeof COPY
): Promise<void> {
  await send(ctx, userId, COPY[state], "escalation")
}

/**
 * Tell a guardian a claim is waiting on them.
 *
 * Sent from `claims.adminSetNameMatch`, in the same transaction that moves the
 * claim into `guardian_review`. Until this existed, that transition notified
 * **nobody**: it wrote an audit line and stopped, so a guardian could only learn
 * a claim was waiting by opening the app speculatively. Every other transition
 * in `claims.ts` notifies someone; this one was the gap.
 */
export async function sendGuardianClaimNotice(
  ctx: MutationCtx,
  guardianUserId: Id<"users">
): Promise<void> {
  await send(ctx, guardianUserId, GUARDIAN_CLAIM_COPY, "guardian claim notice")
}
