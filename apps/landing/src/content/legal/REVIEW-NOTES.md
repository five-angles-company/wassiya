# Legal drafts — notes for review

Not published (the collection only loads `ar/*.md` and `en/*.md`). The drafts
describe what the code does as of 2026-09-23. Every `[…]` in them is a blank
for the reviewer. Setting `draft: false` removes the public "pending legal
review" banner and should be done only after sign-off.

## Blanks to fill in the drafts

- Legal entity name, commercial registration, address, privacy and contact emails.
- Minimum age (drafted as 18).
- Cross-border transfer safeguards under PDPL, and hosting locations. The
  development Convex deployment is in eu-west-1 (Ireland); the production
  region is not decided in the repo. Clerk, Didit, Resend and Twilio regions are
  not in the code.
- Retention periods for death reports and certificates, support text, and sent
  emails (see gaps below).
- Effect of account termination; liability wording; governing law.

## Places where the product does not yet match what a policy would promise

These are code gaps, not wording problems. The drafts avoid promising any of them.

1. **No account deletion.** There is no in-app delete (Apple requires one for
   apps that create accounts). Deleting a user in Clerk removes only the `users`
   row; heirs, assets, files, keyring, devices, bundles, claims, deliveries and
   support threads remain, orphaned.
2. **Death certificates are never deleted.** `claims.ts` says a failed claim's
   certificate should be deleted on a schedule; no job does it.
3. **Sent emails are kept indefinitely** in the Resend component's tables
   (`cleanupOldEmails` is never scheduled). Heir emails contain the delivery
   link.
4. **No data export** for the right of access / copy.
5. **Identity hash omits the country.** AGENTS.md says
   `HMAC(secret, country|number)`; `model/identityHash.ts` hashes the number
   alone. Not a policy issue as drafted, but the two should agree.
6. **Production escrow is not live.** The encryption page describes Google Cloud
   KMS in Saudi Arabia (me-central2, Dammam), per AGENTS.md; the production key
   is not configured yet. Confirm before publishing.
7. **The web account page contradicts the escrow model**
   (`apps/web/features/account/strings/account.ts` says Wassiya cannot open an
   heir's box on its own). The public pages state the trade; that string should
   be brought in line.
8. SMS to heirs (Twilio) is off unless `OUTREACH_PROVIDER=twilio`, and push
   notifications are wired on the server but no client registers a token.
   Billing (RevenueCat / stores) is not built. The drafts name these providers
   as the intended ones.
