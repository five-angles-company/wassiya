<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:convex-backend -->
# Convex backend

This repo uses [Convex](https://convex.dev) as its backend, in `packages/backend/`.

When working on Convex code, **read `packages/backend/convex/_generated/ai/guidelines.md` first** — it contains rules that override what you may have learned about Convex from training data.

Convex's agent skills and the guidelines file are managed in `packages/backend/` via `npx convex ai-files`. Don't hand-edit the generated files there.
<!-- END:convex-backend -->

<!-- BEGIN:template-guide -->
# This monorepo (read me)

Turborepo + pnpm template that bootstraps full-stack apps. Knowledge here is durable; for concrete, changeable values (env, ports) follow the source of truth noted below rather than memorising.

## Stack map
- `apps/web` — Next.js app (Convex + Clerk auth + shared UI).
- `apps/admin` — Next.js app, a near-mirror of `web`.
- `apps/landing` — Astro marketing site, **static**, reuses `@workspace/ui` tokens/components.
- `apps/mobile` — Expo (React Native) app (Convex + Clerk).
- `packages/backend` — Convex deployment: schema, functions, `auth.config.ts`, and the Clerk user-sync webhook (`@workspace/backend`).
- `packages/ui` — shared shadcn / Tailwind v4 components for web (`@workspace/ui`).
- `packages/ui-native` — shared React Native Reusables (shadcn-for-RN) components, styled with Uniwind / Tailwind v4 (`@workspace/ui-native`); consumed by Expo apps. See its README: the styling-engine config lives in the consuming app, and it intentionally supersedes the `expo-tailwind-setup` skill for the mobile UI layer.
- `packages/eslint-config`, `packages/typescript-config` — shared config.

## Conventions
- Package names are `@workspace/*`; depend on them with `workspace:*`.
- Shared packages export **source** (no build step) via their `exports` field.
- Cross-package relative paths assume **same depth** — every app sits at `apps/*`, so a new app inherits the same `../../packages/...` paths.
- `.env.local` is gitignored; `.env.example` is committed (documents required vars).
- Next.js apps must list shared workspace packages in `transpilePackages` (`next.config.ts`).
- Add a shadcn component with `pnpm dlx shadcn@latest add <component> -c apps/<app>` — it lands in `@workspace/ui`.

## ⚠️ The #1 trap: three separate env stores
A Clerk/Convex var can live in three unrelated places, and putting it in the wrong one fails **silently** (`getUserIdentity()` returns null while the client looks signed in):
1. **Convex deployment env** — where `convex/auth.config.ts` and `convex/http.ts` read `process.env.*` (`CLERK_FRONTEND_API_URL`, `CLERK_WEBHOOK_SIGNING_SECRET`). Separate from any `.env.local`; `convex dev` does **not** push `.env.local` into it. Set with `npx convex env set`; verify with `npx convex env list`.
2. **`packages/backend/.env.local`** — written by `convex dev` (deployment URL). No Clerk vars belong here.
3. **each app's `.env.local`** — the app's own client/server vars (publishable key everywhere, `CLERK_SECRET_KEY` on Next.js only).
See the **README "three env stores" table** for which var goes where — don't reproduce it from memory.

## Auth model (principle)
- **Web/admin**: `@clerk/nextjs`. `<ClerkProvider>` must wrap `<ConvexProviderWithClerk>` — Convex reads Clerk's context to mint its token, so the reverse order silently never authenticates.
- **Mobile**: `@clerk/expo` with `tokenCache` from `@clerk/expo/token-cache` (keychain-backed, survives restarts). Never AsyncStorage, never a hand-rolled token store.
- `auth.config.ts` runs **on the Convex deployment** and validates Clerk JWTs (`applicationID: "convex"`, no custom JWT template), so every client authenticates against it unchanged. Re-run `convex dev` after editing it.
- **Route gating is not middleware's job.** `clerkMiddleware()` in `proxy.ts` only attaches auth; `createRouteMatcher` is deprecated. Protect the resource: `await auth()` / `auth.protect()` in the page, layout, or route handler that reads the data, and `ctx.auth.getUserIdentity()` in the Convex function.
- In functions, derive identity server-side; **never** trust a client-passed user id. Use `getCurrentUser` / `getCurrentUserOrThrow` from `convex/users.ts` — the profile comes from the synced `users` table, because Clerk's default session token carries no email or name.
- In the UI, gate on **Convex's** auth state (`<Authenticated>`, `useConvexAuth()`), not Clerk's (`<Show when="signed-in">`) — Convex's state is what decides whether a query succeeds.

## Clerk API drift (check before writing)
Clerk Core 3 removed and renamed a lot; training-data patterns are usually wrong. Verify against the installed package (`node_modules/@clerk/*/dist/**/*.d.ts`) — it wins over any doc or memory:
- `<SignedIn>` / `<SignedOut>` are **removed** → `<Show when="signed-in">`.
- `useSignIn()` / `useSignUp()` return `{ signIn, errors, fetchStatus }` and use method-based flows (`signIn.emailCode.sendCode()`, `signIn.finalize()`), not `create()` + `prepareFirstFactor()` + `setActive()`.
- Method results are `{ error }` — check the field; `error.code` is flat, not `error.errors[0].code`.
- Expo SSO is the exception that still uses `setActive({ session: createdSessionId })`; `useOAuth()` is deprecated in favour of `useSSO()`.

## Ports & callbacks (procedure, not fixed values)
Each app's dev port is set in its own `package.json` (`next dev --port …`) or `astro.config.mjs` (`server.port`) — those scripts are the source of truth. Nothing in this repo registers callback URLs any more: Clerk owns allowed origins and redirect URLs in its dashboard, and the mobile deep link derives from `scheme` in `apps/mobile/app.json`. Enabling an auth strategy (a social provider, email codes) is also a dashboard action — code written for a disabled strategy fails at runtime, not at build time.

## Design source (mobile) — it is NOT in this repo

The Wassiya visual design lives in a **Claude Design** project, read through the
`DesignSync` MCP tool (`list_files` / `get_file`). Nothing in the tree mirrors
it, so a styling question that the tokens and `packages/ui-native/README.md`
cannot answer has to go back to the board.

- **Project id:** `b8016fce-5298-4262-bf2b-80f1501c73df`
- **URL form:** `https://claude.ai/design/p/<project-id>?file=Wassiya+Onboarding.dc.html` (spaces as `+`)

| Board file | Contents |
| --- | --- |
| `Wassiya Onboarding.dc.html` | The mobile app — its own header says "54 screens, sections 1–10" |
| `Wassiya Heir Claim (web).dc.html` | The heir claim funnel (web), incl. the 7.4 veto-period timeline |
| `_ds/organic-…/styles.css` + `readme.md` | The "Organic" design system — the token authority |

**Where the design file and a written brief disagree, the design file wins.**

⚠️ **The vault is built from `Wassiya Vault v2.dc.html`, not from the onboarding
board.** That file is the current source for sections ٤.١–٤.٩ and supersedes the
first vault board, which the designer kept only as history. It states its own
grammar in one paragraph at the bottom — read that before touching a vault
screen:

> Fields are label-over-value rows separated by hairlines — no boxed inputs, no
> cards, except around a secret or the recipient set. One accent per screen.
> Titles 28px Cairo 800, labels 12px/50%, values 16px/600, prose 14.5–15.5px.
> Chips are pills on `--color-surface`; the selected one is solid terracotta.
> Primary CTA 56px; a disabled CTA is surface-toned, never a faded primary.
> Status is carried by faces and one line of olive or terracotta text — no
> badges, no bars, no scores.

Its colours map 1:1 onto the app's theme: `--color-accent` → `primary`,
`--color-accent-2-*` → `olive-*`, `--color-neutral-*` → `sand-*`,
`--color-divider` → `border`, `--color-bg` → `background`, `--color-surface` →
`card`. Note that button text is `--color-bg` (#f5ead8), **not** the app's
`primary-foreground` (#fff2eb).

⚠️ **`get_file` hard-caps at 256 KiB** and sets `truncated: true`. The
onboarding board is roughly 500–550 KiB, so a read stops mid-section-5 and
returns exactly 262,144 bytes. **Sections ٦–١٠ have never been read** — the
board is complete, the read is not, and there are no per-section files. Getting
them requires splitting the board in Claude Design into sub-256 KiB files.

Known section map, from forward references inside sections 1–5: ٦ Protection
(6.1 Centre, 6.2 guardian, 6.4 check-in) · ٧ claim/escalation (7.4 waiting,
7.5 death claim) · ٨ security · ٩ Settings (9.2 auto-lock, 9.3 audit log,
9.4 subscription/storage, 9.5 legal) · ١٠ shared patterns.

Two board quirks to ignore: the tokens still declare **Caprasimo** as the
heading font (no Arabic glyphs — the heading face is Cairo 800/900), and the
`.dc.html` boards render section 1–5 only through the MCP.

Implementation state — every primitive, its props, states, and the board screen
it serves — is in `packages/ui-native/README.md`.

## Deeper procedures → skills
- Convex backend work: use the installed `convex` / `convex-setup-auth` skills + `packages/backend/convex/_generated/ai/guidelines.md`.
- Auth wiring, adding an app, Expo specifics, Astro specifics: see `.claude/skills/` (`auth-wiring`, `add-app`, `mobile-expo`, `astro-landing`).
<!-- END:template-guide -->

<!-- BEGIN:wassiya-product -->
# Wassiya product rules (durable)

Zero-knowledge digital-inheritance vault. Arabic-first RTL. Multi-country, Saudi-first; country is a parameter, never a branch.

## Security model — 1-of-1 recovery, 2-of-2 release (LOCKED, no session may drift from this)

> **Amended 2026-08-28, deliberately.** This section previously read "2-of-3"
> with `K_rec = S_paper XOR S_guardian`. The guardian was removed from recovery
> and kept for release. Rejected on the way: storing S_guardian server-side —
> raw XOR of two random 32-byte values with no KDF means a server holding one
> half is cryptographically identical to wrapping under the sheet alone, with
> extra liability. It also *repaired* the common case: `splitRecovery` minted
> S_guardian at setup but it lived only in the owner's own keystore until a
> guardian accepted, so a guardian-less vault could not be recovered at all.

- MK = 256-bit random master key, generated on the owner's device, never leaves it unencrypted. The server stores only ciphertext.
- Daily unlock: each enrolled device stores MK wrapped by a hardware-backed key gated by biometrics (client-side; not in this backend).
- Recovery (no enrolled device): MK also wrapped by **K_rec = S_paper**. S_paper lives only on the printed sheet (grouped Base32 + checksum). The wrapper is sealed under an AAD of `wassiya/recovery/v2 | userId | paperVersion`, and `paperVersion` is stored beside it — unwrapping recomputes the AAD from the **stored** version, wrapping uses the **new** one, and `keyring.save` refuses a version that does not follow, so the pair can never tear.
- **The sheet is a bearer token.** Whoever holds it can recover the vault, and with no guardian in the loop there is no second human who notices. Four things contain that and none is optional: the AAD above (a stolen wrapper is not portable to another account or an older sheet); `markPaperUsed` writes a notification *and* an email to the owner; the sheet must be reprinted after use; the recovered device appears in `devices`. **The user id is deliberately not printed on the sheet** — without it the AAD cannot be built, so a photograph alone is not enough. Do not print it.
- **`keyring.wrapperVersion` says which construction built a wrapper; absent means the pre-AAD v1, which this code cannot open.** It is not inferable from `paperVersion` (a v1 row can sit at paper version 3). `setup-flow` routes such a row to `recoveryKit` **ahead of** the `paperPrintedAt` check, because re-wrapping needs MK and a device that still holds it is the only window in which the sheet is fixable. Without that, an owner who had already printed would be routed to `done` and would discover the break on the one day they cannot recover from. Bump `RECOVERY_WRAPPER_VERSION` in `@workspace/crypto/recovery` and its two mirrors (`convex/keyring.ts`, `lib/setup-flow.ts`) together.
- **Reprint ordering is load-bearing: mint → display → confirm → save.** Nothing invalidates the old sheet until the new wrapper is written. Rotating as a side effect of recovery turns a theft mitigation into a total-loss bug — the wrapper would stand under a code printed nowhere, with no guardian to fall back on.
- Per-asset: random DEK (XChaCha20-Poly1305) wrapped by MK; content + thumbnails encrypted client-side before upload.
- Heir release: heirs NEVER receive MK. On every routing change the owner's device rebuilds per-heir bundles: Enc(K_h, routed DEKs + message keys), K_h = S_server_h XOR S_guardian_h. S_server_h is withheld until a claim reaches "released" (identity-verified heir + certificate name match + guardian confirmation + veto window elapsed).
- Rotation: a new paper sheet ⇒ regenerate S_paper, bump `paperVersion`, re-wrap. A new guardian ⇒ nothing to re-wrap for recovery (they hold no share of K_rec); re-seal each heir's S_guardian_h instead.
- **Guardians may be an heir or an outsider, and they are a set, not a singleton.** S_guardian_h is the same 32 bytes sealed *n* times, so any one of them can hand over — which also fixes the unreachable-guardian problem. Safe because the claim ceremony gates it; the same one-of-*n* on recovery would have been an *n*-fold weakening with nothing in front of it.
- Rule for all code: no plaintext key material in Convex functions, logs, or errors. OTP/Clerk auth proves identity only — it never touches keys.

## Actors and apps (LOCKED)
- **Owner → mobile only.** MK, biometrics, the veto and the check-in need a hardware keystore and a fingerprint. Never move any of them to a browser.
- **Guardian → web only. Heir → web only.** Never add a guardian or heir screen to `apps/mobile`; mobile is the owner's app. The guardian screens that once lived there (`guardian/accept`, `guardian/claim`, `recovery/approve`) were deleted, not moved — accepting on mobile would mint the guardian's X25519 secret into a keystore the web app can never reach.
- **The guardian authors the death claim** and supplies the certificate. That is the resolution to "every heir is silent": heirs do not know the vault exists, so they cannot plausibly be the ones who file.
  - **Not yet implemented, and not to be half-implemented.** Today `claims.submit` + `attachCertificate` are the *claimant's*, and `release.releasedBundleForHeir` asserts `claimantUserId === caller`. Make the guardian the filer without first separating a claim's **author** from its **recipient** and the heir can no longer open their own box. The inversion belongs with the web rework.
  - **A self-signing check is NOT the guard.** Refusing a confirmation when the confirmer is the claimant would block every claim once the guardian *is* the claimant. What holds the heir-guardian case is the certificate, the staff name-match, the veto window, and the heir's own Didit verification. Do not add one.
- **A guardian accepts on the web, at `/guardian/accept`, and only there.** The invited person mints their own X25519 sheet in their own browser — a key minted anywhere the owner can reach is a key the owner holds, which is the one thing the second party to a 2-of-2 may never be. `use-protection-score` still marks an outstanding invitation `blocked` so it is never the one amber row: the step is real but it is not the owner's to take, and a score that accuses an owner of somebody else's step is the failure mode to avoid. (This previously read "until the web rework ships, no guardian can accept an invitation." It has shipped; the `blocked` treatment stands on the reason above instead.)

## Product rules
- Routing, not shares: assets go to recipients whole; no inheritance-share math anywhere (الأنصبة يحدّدها القانون، لا التطبيق).
- **Every heir is silent** — they learn nothing until release. There is no notified/invited mode, no invitation and no notification: `mode` and `inviteStatus` are one-member unions in the schema, `heirs.add` does not take a mode, and ٥.٢ states the consequence instead of offering a choice. (This replaces an earlier silent-or-notified rule. Nothing ever sent an invite, so a "notified" heir sat at `pending` forever.) Heir preview = exactly what that heir would receive.
- Dead man's switch: cadence + grace + escalation (day 0/7/14/30) + veto window; owner veto locks the claimant out 90 days. Life check-in confirmation is ALWAYS biometric-gated and exists in exactly one place — **Home's `CheckInHero`**, via the single gate in `hooks/use-confirm-alive.ts` (`disableDeviceFallback: true`; the mutation runs only after `auth.success`). The affordance moved there from the check-in prompt at the owner's request; it was not duplicated, and `screens/protection/checkin` is now status + cadence settings only. No *second* confirm affordance may ever be added — rows, notifications and widgets report and navigate only. The protected property is that a tap alone can never say "still alive": an unlocked phone in the wrong hands must not be able to suppress delivery forever. It is the fingerprint that provides that, not the route.
- Subscription lapse: vault stays readable and heir delivery keeps working; only adding assets is blocked.
- Vault lock policy: the default is **`LOCK_WHILE_OPEN`** (`stores/preferences.ts`) — no session cap, and backgrounding does not lock. The session ends with the process, which is automatic (MK is process memory, `useVault` has no `persist`). This is the owner's explicit choice, made with the trade stated on ٩.٢: anyone holding the unlocked phone can reopen the app and read the vault. **Do not "fix" it back to a timeout.** Choosing a duration in ٩.٢ restores the cap *and* the background lock together.
- A masked field must never carry `keyboardType: "visible-password"`. On Android it and `secureTextEntry` set the same input-type variation bits, the keyboard wins, and the value renders in the clear while every prop claims it is hidden. Use `MASKED_SECRET_INPUT_PROPS` for masked fields, `SECRET_INPUT_PROPS` for secrets that are visible by design (seed phrase, 2FA note, recovery codes).
- Audit log is append-only. No update or delete path may exist.
- Identity verification (Didit) is mandatory and blocking for owners at onboarding, and for heirs at claim time; the death certificate name must match the owner's verified legal name.
<!-- END:wassiya-product -->
