---
title: How the encryption works
description: What happens to your vault on your phone, who can open what and when, and why we hold no key — not even after you.
updated: 2026-09-26
draft: true
---

## In short

While you live, nobody opens your vault — not even us. After you, your executor receives only what you chose to hand over, once your death and their identity are verified, and opens it with their own sheet. We hold no key at any point.

That has a price, and we state it plainly: **if your executor's sheet and your recovery sheet are both lost, nobody can open what you left — us included.** There is nothing for us to reset, because there is no key on our side.

## Your vault's key

When you create your vault, your phone generates a random 256-bit **master key**. It never leaves your device unencrypted, and our servers hold only ciphertext they cannot read.

## Daily unlock: your fingerprint

Each enrolled device keeps a copy of the master key locked by a key inside the phone's secure hardware, which only your fingerprint or face releases. That is why your vault cannot be opened in a browser, or on a device you have not enrolled.

## The recovery sheet

If you lose your phone, a printed **recovery sheet** opens your vault. It carries a code that exists nowhere else. The copy of the master key locked by that code is bound to your account and to the sheet's version, so it is useless on another account or with an older sheet.

**Whoever holds the sheet can open the vault**, so four things surround it:

- The code alone is not enough: signing in to your account is needed too.
- Every time the sheet is used, we tell you with an in-app notification and an email.
- After it is used, the app asks you to print a new one.
- The device the vault was recovered on appears in your device list, where you can revoke it.

When you print a new sheet, the old one stops working only after you confirm the new one is saved — so there is never a day with no sheet that opens your vault.

Once your death is verified and your vault is released, the sheet can no longer restore your vault or add a device. It opens only what you chose to hand over, and only for an executor who has verified their identity — so whoever finds it cannot open what you kept private.

**We will never ask for your recovery sheet or an executor sheet** — not in chat, by phone or by email. If someone asks, it is not us.

## A key for every item

Every item you add — a file, a photo, a secret, a note or a voice message — is encrypted on your phone with its own random key (XChaCha20-Poly1305) before upload, thumbnails included. The item's key is then locked with the master key.

## Handed over, or private

For each item you choose one of two things:

- **Handed over** — the default for a new item. Your phone locks a second copy of the item's key with your **release key**: a random key made on your phone, never sent to us unlocked. The copy is bound to your account and to that item. Every executor receives every handed-over item.
- **Private** — no second copy exists. The item opens only with your master key, and it is deleted with your vault. It reaches no one.

## Your executors and their sheets

You name one or more **executors**: people you trust to receive what you hand over and to carry out your will. For each of them, your phone prints an **executor sheet**. Its code locks a copy of your release key, bound to your account, to that executor and to the sheet's version. The code exists only on paper; we store only the locked copy, which we cannot open.

- The sheet opens nothing while you are alive.
- How it reaches them is your choice: give it to them now, or keep it with your will.
- If a sheet is lost while you are alive, print a new one. The old one stops working once the new one is saved.
- **Whoever holds an executor sheet can, after release and after verifying as that executor, open what you handed over.** Keep it as you keep your will.

Your **recovery sheet** can do the same job: after release, it opens the same handed-over items for a verified executor. That is the fallback when an executor sheet cannot be found.

We do not contact your executors before release, and we send them nothing. Telling them is up to you.

## When the handover opens

Nothing opens until these conditions hold, in this order:

1. An official death certificate, whose name our team matches to your verified legal name.
2. The objection window ends without you stopping it — and you stop it with your fingerprint.
3. Your vault is closed, and we contact each executor on the number you registered for them.
4. The executor verifies their identity, and their document must match the ID number you registered for them. If it does not, or no number could be read, our team compares their verified name to your record by hand and decides. We never release on a name alone.
5. The executor types the code from their sheet — or from your recovery sheet — in their own browser.

A single path in our service re-checks every condition itself, records the opening, and gives the executor's browser the locked items and the locked copies of your release key. The code is used only in that browser: it unlocks the release key there, the release key unlocks each handed-over item, and nothing passes through our service in the clear. Private items are never sent.

## One year

A delivery stays available for one year from release. When the last executor's delivery closes, the whole vault is deleted for good — every item, file and locked key, including the copies under the executors' sheets — and nobody, us included, can open any of it again.

## What is not end-to-end encrypted

To run the service we keep, without end-to-end encryption: your account details (name, email, country), the result of your identity check, your executors' names and contact details, whether each item is handed over or private, death reports and their certificates, and support conversations. ID numbers — yours and your executors' — are never stored, only a keyed fingerprint of them. The details are in the [privacy policy](/en/legal/privacy).
