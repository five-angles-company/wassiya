// Deployment settings, resolved.
//
// One function reads both sources, and everything else reads this. The
// precedence is **the row wins, the environment is the fallback**: the console
// is authoritative, and `process.env` seeds a deployment that has no row yet —
// which every deployment did before this table existed, and a fresh one still
// does.
//
// Field by field, not all-or-nothing. A row that sets only the sender address
// must not silently blank the app URL that env still supplies.
//
// ## Settings, never credentials
//
// Everything here is safe to read off a database export. The API keys, the
// webhook signing secrets, the identity HMAC and the escrow private key are
// deliberately absent: a table is the wrong place for a value whose leak is
// unrecoverable, and `IDENTITY_HASH_SECRET` in particular is the only thing
// standing between an ID-number hash and a ten-digit brute force.
import type { Doc } from "../_generated/dataModel"
import type { QueryCtx } from "../_generated/server"

export type Settings = {
  emailFrom: string | null
  /** Resend's guard. On unless something explicitly turned it off. */
  emailTestMode: boolean
  outreachProvider: "off" | "twilio"
  twilioFrom: string | null
  appUrl: string | null
  /** Where apps/admin is. Only a staff invitation links to it. */
  consoleUrl: string | null
}

export async function settingsRow(
  ctx: QueryCtx
): Promise<Doc<"settings"> | null> {
  return await ctx.db.query("settings").first()
}

export async function settingsFor(ctx: QueryCtx): Promise<Settings> {
  return resolve(await settingsRow(ctx))
}

/**
 * The merge, split out so the console can show what a saved row *would*
 * resolve to without a second copy of the precedence rule.
 */
export function resolve(row: Doc<"settings"> | null): Settings {
  return {
    emailFrom: pick(row?.emailFrom, process.env.RESEND_FROM),
    // The safe state is the default one, from both sources: only an explicit
    // `false` goes live. A missing row and a missing env var both mean "on".
    emailTestMode:
      row?.emailTestMode ?? process.env.RESEND_TEST_MODE !== "false",
    outreachProvider:
      row?.outreachProvider ??
      (process.env.OUTREACH_PROVIDER === "twilio" ? "twilio" : "off"),
    twilioFrom: pick(row?.twilioFrom, process.env.TWILIO_FROM),
    appUrl: pick(row?.appUrl, process.env.APP_URL),
    // A separate field rather than a path under `appUrl`: the console is a
    // different origin, and an invitation that landed on the owner app would
    // sign the new staff member into the wrong product.
    consoleUrl: pick(row?.consoleUrl, process.env.CONSOLE_URL),
  }
}

/**
 * An empty string is a cleared field, not a value.
 *
 * The console sends `""` when an operator empties a box, and treating that as a
 * sender address would produce mail from nobody rather than falling back to the
 * environment.
 */
function pick(row: string | undefined, env: string | undefined): string | null {
  const value = row === undefined || row.trim() === "" ? env : row
  return value === undefined || value.trim() === "" ? null : value.trim()
}

/**
 * Which credentials the deployment holds — as booleans, never as values.
 *
 * The console cannot set these and must never display them, but an operator
 * still has to know whether they are there: "no mail is going out" and "the
 * sender address is wrong" look identical from the outside, and this is what
 * tells them apart.
 *
 * The escrow private key is deliberately absent, even as a boolean:
 * `verify-invariants` allows its name in `escrow.ts` and nowhere else, and a
 * status row is not worth an exception to the rule that keeps the one key
 * capable of opening every heir bundle in a single file.
 */
export function credentialStatus(): Record<string, boolean> {
  return {
    resendApiKey: has("RESEND_API_KEY"),
    twilioAccountSid: has("TWILIO_ACCOUNT_SID"),
    twilioAuthToken: has("TWILIO_AUTH_TOKEN"),
    diditApiKey: has("DIDIT_API_KEY"),
    diditWebhookSecret: has("DIDIT_WEBHOOK_SECRET"),
    clerkWebhookSecret: has("CLERK_WEBHOOK_SIGNING_SECRET"),
    identityHashSecret: has("IDENTITY_HASH_SECRET"),
  }
}

function has(name: string): boolean {
  const value = process.env[name]
  return value !== undefined && value.length > 0
}
