# Legal drafts — notes for review

Not published (the collection only loads `ar/*.md` and `en/*.md`). The drafts
describe what the code does as of 2026-09-26. Every `[…]` in them is a blank
for the reviewer. Setting `draft: false` removes the public "pending legal
review" banner and should be done only after sign-off.

## What changed on 2026-09-26: heirs became executors, and Wassiya holds no key

All three drafts were rewritten for this. If you read an earlier version, these
are the points to re-read:

1. **Heirs (ورثة) are now executors (الوصي / الأوصياء).** The owner names one
   or more executors. Each receives *everything* the owner marked "handed over"
   (يُسلَّم) and carries out the will. There is no longer a per-person choice
   of who gets what, and no separate heir messages — a personal message is an
   ordinary note, handed over like any item.
2. **Per item, the owner chooses handed over or private (خاص).** New items
   default to handed over. A private item is never delivered and is deleted
   with the vault.
3. **Wassiya holds no key, before or after death.** The delivery key held in
   our server environment is gone. An executor opens what was handed over with
   their printed **executor sheet**; the owner's **recovery sheet** works as a
   fallback. Both are typed in the executor's own browser. The drafts now state
   the consequence plainly: **if every executor sheet and the recovery sheet
   are lost, nothing can be delivered, and we cannot help.** Please confirm the
   terms' wording on this (Terms → "What we cannot do", "Limitation of
   liability") is adequate.
4. **The executor sheet is a bearer document.** Whoever holds it can, after
   release and after passing identity verification *as that executor*, open
   what was handed over. It opens nothing while the owner lives. The owner is
   told to keep it like a will.
5. **The recovery sheet after death.** Before, it stopped working at release.
   Now it can no longer restore the vault or add a device, but it can open the
   handed-over items for a verified executor (never the private ones).
6. **Executor identity.** An ID number is now **required** when naming an
   executor (it was optional for heirs). It is stored only as a keyed hash, as
   before. The executor's verified document (Didit) must match it; otherwise
   staff compare the verified name to the record and decide. Relationship and
   date of birth are no longer collected for this role — the privacy policy's
   list was shortened accordingly.
7. **Unchanged, now stated explicitly:** the person who reports a death is never
   asked to verify and receives nothing; missed check-ins release nothing; a
   delivery stays open one year from release, then the whole vault is deleted.

## Questions for counsel raised by this change

- **"الوصي" is a legal term.** In Saudi law a وصي is appointed under a will or
  by a court, with duties the app does not create. The terms now say that
  naming an executor in Wassiya appoints no one under any law, and leave a blank
  for how this relates to an executor or guardian appointed under law. Please
  confirm the wording, and whether "executor" overstates the role in English.
- **Liability for what an executor does.** The terms exclude liability for what
  an executor does with what they receive. Please confirm this is enforceable
  and sufficient.
- **The executor's own data.** The owner registers the executor's name, phone,
  email and ID number without the executor's involvement, and we contact the
  executor only after release. The owner confirms they have the right to share
  these details; please confirm that basis under the PDPL, and whether the
  executor must be told anything at first contact.

## Blanks to fill in the drafts

- Legal entity name, commercial registration, address, privacy and contact emails.
- Minimum age (drafted as 18).
- Cross-border transfer safeguards under PDPL, and hosting locations. The
  development Convex deployment is in eu-west-1 (Ireland); the production
  region is not decided in the repo. Clerk, Didit, Resend and Twilio regions are
  not in the code.
- Retention periods for death reports and certificates, support text, sent
  emails, and executors' details after a vault is deleted (see gaps below).
- How a Wassiya executor relates to one appointed under law.
- Effect of account termination; liability wording; governing law.

## Places where the product does not yet match what a policy would promise

These are code gaps, not wording problems. The drafts avoid promising any of them.

1. **No account deletion.** There is no in-app delete (Apple requires one for
   apps that create accounts). Deleting a user in Clerk removes only the `users`
   row; executors, assets, files, keyring, devices, claims, deliveries and
   support threads remain, orphaned.
2. **Death certificates are never deleted.** `claims.ts` says a failed claim's
   certificate should be deleted on a schedule; no job does it.
3. **Sent emails are kept indefinitely** in the Resend component's tables
   (`cleanupOldEmails` is never scheduled). Executor emails contain the
   delivery link.
4. **No data export** for the right of access / copy.
5. **Executors' details outlive the vault.** When the last delivery closes,
   `vault.purge` deletes items, files, the keyring and the copies locked under
   the executors' sheets, but keeps each executor's record (name, phone, email,
   ID-number fingerprint) and the delivery records. The privacy draft leaves
   their retention blank.
6. **The apps' own copy must match these drafts.** The web and mobile apps are
   being moved to the executor model alongside these drafts; before publishing,
   check that nothing in them still says Wassiya can open a delivery (for
   example `apps/web/features/account/strings/account.ts`).
7. SMS to executors (Twilio) is off unless `OUTREACH_PROVIDER=twilio`, and push
   notifications are wired on the server but no client registers a token.
   Billing (RevenueCat / stores) is not built. The drafts name these providers
   as the intended ones.
