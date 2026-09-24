---
title: How the encryption works
description: What happens to your vault on your phone, and who can open what and when — including what we can do at delivery.
updated: 2026-09-23
draft: true
---

## In short

While you live, nobody opens your vault — not even us. After you, we deliver only what you chose, only to the people you named, once their identity and your death are verified.

"We can't see anything" describes your **vault**. **Delivery** is different, and we say so plainly: what you route to an heir waits for them in a locked box, and at delivery — after your death and the heir's identity are verified — we can open that box to hand it over. Anything you route to no one is kept for no one, and is never opened.

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

**We will never ask for your recovery sheet** — not in chat, by phone or by email. If someone asks, it is not us.

## A key for every item

Every item you add — a file, a photo, a secret, a message — is encrypted on your phone with its own random key (XChaCha20-Poly1305) before upload, thumbnails included. The item's key is then locked with the master key.

## What reaches your heirs

**Heirs never receive your vault's key.** Whenever you change what reaches an heir, your phone rebuilds that heir's box:

1. It generates a fresh random key for that heir.
2. It encrypts, with that key, the keys of the items you routed to them and your messages to them — and nothing else.
3. It locks that key, on your phone, to the key vault's public key (RSA-OAEP-SHA256), with your identity and the heir's inside the lock.

The public key is built into the app and never fetched from our servers, so a compromised server cannot swap in a key of its own. We store only the locked form of each heir's box.

The matching private key lives in a hardware key vault (Google Cloud KMS) in Saudi Arabia, and never leaves it.

## When a box opens

An heir's box opens only after these conditions hold, in this order:

1. An official death certificate, whose name our team matches to your verified legal name.
2. The veto window ends without you stopping it — and you stop it with your fingerprint.
3. We contact the heir on the number you registered for them.
4. The heir verifies their identity. If you registered their ID number, their document must match it; otherwise our team compares their verified name and birth date by hand. We never deliver on a name alone.

Then a single path in our service re-checks every condition itself, unlocks inside the key vault, confirms the box belongs to this heir, and hands the key over sealed again to a one-time key the heir's browser generates. The contents open on the heir's device and never pass through our service in the clear.

## One year

A delivery stays available for one year from release. Then the locked key and the box are destroyed for good, and nobody — us included — can open that delivery again.

## What is not end-to-end encrypted

To run the service we keep, without end-to-end encryption: your account details (name, email, country), the result of your identity check, the contact details you registered for your heirs, death reports and their certificates, and support conversations. ID numbers are never stored — only a keyed fingerprint of them. The details are in the [privacy policy](/en/legal/privacy).
