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

## Code style (durable)

**Comments earn their place or go.** A comment is justified only when deleting
it would let someone break something — an invariant, a trap, a decision whose
reasoning is not recoverable from the code. Four categories, and only the first
survives:

1. **Invariants and traps** — *keep, always.* "A tap alone can never say still
   alive"; "`wrapperVersion` absent means the pre-AAD v1"; "these two writers
   must stay in step". These are what stop a future session from undoing a
   locked decision. `packages/crypto` and `packages/backend` are deliberately
   comment-heavy for this reason and are **exempt from the budget below**: a
   comment that prevents a security regression is cheap at any length.
2. **Design or refactor history** — *delete.* "This was a hero card, then a
   grid, neither worked." Git has it, and it becomes a lie the day the code
   changes. State what the code does now and why; never what it used to be.
3. **Restating the code** — *delete*, and rename until the code reads. If a
   comment is needed to explain *what* a block does, that is the bug.
4. **Rhetoric and voice** — *delete.* "It did not survive contact with its
   reader." Nothing is lost.

**File headers** carry only category 1, and only what is load-bearing for
*this* file. Keep them short — a few sentences, or a short list of rules where a
file really does encode several. A header longer than about twenty lines is an
architecture note: put it in this file or in a `docs/` note and leave a one-line
pointer. Prose formatting inside comments (`##` headings, essay sections) is a
sign the budget has already been blown.

**File size.** One exported component or hook per file, except compound
families (`Card`/`CardHeader`/…) and vendored shadcn primitives, which belong
together. Split a module when it has **more than one reason to change**, not
when it crosses a line count — a 300-line cohesive table component is fine, a
2,500-line module serving seventeen unrelated screens is not. Convex modules
mirror the API path, so grow a directory (`convex/admin/devices.ts` →
`api.admin.devices.page`) rather than one module. Note that adding or moving a
Convex module needs `npx convex codegen`, which contacts the deployment — so
call-site renames and codegen land together or not at all.

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

## Design rules (mobile)

**The design is owned here.** There is no external board, no Claude Design
project and no `DesignSync` read in this workflow — if you find a reference to
one, in a comment or anywhere else, it is history rather than an instruction.
Design questions are settled in this repo, and the answer is recorded in the
component that implements it.

Implementation state — every primitive, its props, its states — is in
`packages/ui-native/README.md`.

### The vault's grammar (sections ٤.١–٤.٩)

Read this before touching a vault screen:

> Fields are label-over-value rows separated by hairlines — no boxed inputs, no
> cards, except around a secret or the recipient set. One accent per screen.
> Titles 28px Cairo 800, labels 12px/50%, values 16px/600, prose 14.5–15.5px.
> Chips are pills on `--color-surface`; the selected one is solid terracotta.
> Primary CTA 56px; a disabled CTA is surface-toned, never a faded primary.
> Status is carried by faces and one line of olive or terracotta text — no
> badges, no bars, no scores.

### Tokens

The "Organic" palette is the token authority and both apps share it:
`--color-accent` → `primary`, `--color-accent-2-*` → `olive-*`,
`--color-neutral-*` → `sand-*`, `--color-divider` → `border`, `--color-bg` →
`background`, `--color-surface` → `card`.

Two traps worth stating:

- **Button text is `--color-bg` (#f5ead8), not `primary-foreground` (#fff2eb).**
- **The heading face is Cairo 800/900.** Any token declaring Caprasimo is wrong
  — it has no Arabic glyphs.

## Design rules (web + landing)

`apps/web` shares the landing site's look: sticky glass header, cards with
soft shadows, pill eyebrows, lucide icons in tinted discs, the brand gradient,
a dot-grid ground. Most of its screens are read by someone who has just lost a
person, so four rules hold on top of that look:

- **Calm motion only on web.** Soft fade-ins (`rise`, `rise-in`). No floating,
  pulsing or shimmering — those live in `apps/landing` only, and loading
  placeholders are static (`components/placeholder.tsx`), never `animate-pulse`.
- **Dates, never countdowns.** A waiting period shows its end date; a timeline
  shows recorded dates only, never estimated ones.
- **One large button per screen**, inside the one `Ask`. Status is a sentence
  (`StatusBanner`), never a badge.
- **Tokens, not ramps.** Shared brand surfaces live in
  `packages/ui/src/styles/surface.css`, driven by tokens in `globals.css` so dark
  mode flips them. Never copy landing ramp classes (`text-sand-700`,
  `bg-terracotta-100`, …) into web — they don't flip.

`/dev/preview` (development only) renders the screens that need a session or
real data, from sample props.

## Deeper procedures → skills
- Convex backend work: use the installed `convex` / `convex-setup-auth` skills + `packages/backend/convex/_generated/ai/guidelines.md`.
- Auth wiring, adding an app, Expo specifics, Astro specifics: see `.claude/skills/` (`auth-wiring`, `add-app`, `mobile-expo`, `astro-landing`).
<!-- END:template-guide -->

<!-- BEGIN:wassiya-product -->
# Wassiya product rules (durable)

Zero-knowledge digital-inheritance vault. Arabic-first RTL. Multi-country, Saudi-first; country is a parameter, never a branch.

## Security model — 1-of-1 recovery, executor handover (LOCKED, no session may drift from this)

> **Amended 2026-09-26, deliberately: heirs became executors (الوصي), and
> Wassiya holds no key.** The owner names one or more executors; each receives
> everything handed over, alone, and passes it on as the will says. Per-heir
> routing, heir messages and the Convex-env escrow key are gone. An executor
> opens the handover with their **executor sheet**, printed on the owner's
> phone like the recovery sheet; the owner's own recovery sheet is the
> fallback. **The trade must not be hidden: if every executor sheet and the
> recovery sheet are lost, nothing can be delivered — nobody, Wassiya
> included, can open it.** That is the price of holding no key; the owner is
> told so on the executors screen and in the help centre, and the yearly check
> asks whether each executor still has their sheet. Superseded, do not bring
> back: the guardian and 2-of-2 language (removed 2026-09-19), the env-held
> escrow key and per-heir routing (removed 2026-09-26).
>
> **The promise:** ما دمت حيّاً، لا أحد يفتح خزنتك — ولا نحن. وبعد رحيلك، يستلم
> وصيّك ما اخترت تسليمه فقط، بعد التحقق من الوفاة ومن هويته، وبورقته هو — فنحن لا
> نملك أي مفتاح. Zero-knowledge now covers delivery too: the server stores
> wrappers, never a key.

- MK = 256-bit random master key, generated on the owner's device, never leaves it unencrypted. The server stores only ciphertext.
- Daily unlock: each enrolled device stores MK wrapped by a hardware-backed key gated by biometrics (client-side; not in this backend).
- Recovery (no enrolled device): MK also wrapped by **K_rec = S_paper**. S_paper lives only on the printed sheet (grouped Base32 + checksum). The wrapper is sealed under an AAD of `wassiya/recovery/v2 | userId | paperVersion`, and `paperVersion` is stored beside it — unwrapping recomputes the AAD from the **stored** version, wrapping uses the **new** one, and `keyring.save` refuses a version that does not follow, so the pair can never tear.
- **The sheet is a bearer token.** Whoever holds it can recover the vault, and there is no second human who notices. Four things contain that and none is optional: the AAD above (a stolen wrapper is not portable to another account or an older sheet); `markPaperUsed` writes a notification *and* an email to the owner; the sheet must be reprinted after use; the recovered device appears in `devices`. **The user id is deliberately not printed on the sheet** — without it the AAD cannot be built, so a photograph alone is not enough. Do not print it.
- **`keyring.wrapperVersion` says which construction built a wrapper; absent means the pre-AAD v1, which this code cannot open.** It is not inferable from `paperVersion` (a v1 row can sit at paper version 3). `setup-flow` routes such a row to `recoveryKit` **ahead of** the `paperPrintedAt` check, because re-wrapping needs MK and a device that still holds it is the only window in which the sheet is fixable. Without that, an owner who had already printed would be routed to `done` and would discover the break on the one day they cannot recover from. Bump `RECOVERY_WRAPPER_VERSION` in `@workspace/crypto/recovery` and its two mirrors (`convex/keyring.ts`, `lib/setup-flow.ts`) together.
- **Reprint ordering is load-bearing: mint → display → confirm → save.** Nothing invalidates the old sheet until the new wrapper is written. Rotating as a side effect of recovery turns a theft mitigation into a total-loss bug — the wrapper would stand under a code printed nowhere, with nothing to fall back on. The same holds for executor sheets.
- Per-asset: random DEK (XChaCha20-Poly1305) wrapped by MK. The label and the secret fields are sealed under it on the row (`labelSealed`, `secretSealed`); each file, and its thumbnail, is encrypted client-side as its own blob (`files`). An edit reuses the DEK — a new one would strand its handover wrapper.
- Rotation: a new paper sheet ⇒ regenerate S_paper, bump `paperVersion`, re-wrap.

### Handover
- **Executors NEVER receive MK, and nothing is sealed to Wassiya.** Each owner has one random **release key R** (`@workspace/crypto/release`). R is wrapped by MK (`keyring.releaseKeyWrappedByMk`, written once by `keyring.setReleaseKey`) and by each executor's sheet secret (`executors.sheet.releaseKeyWrapped`, AAD bound to `ownerId|executorId|sheetVersion`). A handed-over asset carries its DEK wrapped by R (`assets.dekWrappedByRelease`, AAD bound to `ownerId|assetId`), written by `assets.setHandover` after `create`; a private asset carries none and dies with the owner. A crash between the two leaves the asset private — the safe side.
- **Handover is binary, per asset: يُسلَّم / خاص.** New assets default to handed over. There is no per-person choice: every executor receives every handed-over asset.
- **The executor sheet is a bearer secret, like the recovery sheet.** Its code has the `WSE` prefix and its own CRC domain, so the two kinds can never be mistaken for each other (`paperCodeKind`). Same ordering: mint → display → confirm → `executors.saveSheet`, whose version must follow the stored one; saving replaces the wrapper, so the previous sheet stops working. What contains it: the sheet opens nothing while the owner lives, and after release only through the gate below, to a Didit-verified executor.
- **One serving path.** `handover.open` is the only function that hands a wrapper to anyone but its owner (`keyring.get` is the owner's own read). It is a mutation: it re-asserts every precondition (claim `released` with `nameMatch`, delivery `ready`, caller is the bound executor, caller Didit-verified, not expired), audits the open in the same transaction, and returns only handed-over items, that executor's sheet wrapper, and the fallback (the recovery wrapper with `releaseKeyWrappedByMk`). The executor's browser does all decryption. `pnpm --filter @workspace/backend verify` enforces this, and that no server code imports `@workspace/crypto`.
- **Release gates, in order:** death certificate + staff name match against the owner's verified legal name → veto window (the owner's fingerprint check-in stops it) → claim `released`, which closes the vault → one delivery per executor → executor Didit verification matched to the executor record → the executor enters their sheet (or the owner's recovery sheet) → their browser opens the items.
- **Executor identity match:** an ID number is **required** when naming an executor, and their verified document must match it (compared as keyed hashes). When it does not, or Didit read no number, staff compare the verified name to the executor record and decide. Never release on name alone without a staff decision.
- **ID numbers are stored only as `HMAC(IDENTITY_HASH_SECRET, normalised number)`** (`model/identityHash.ts`) — for executors and for verified users alike. Never the number, never in logs, never shown to staff.
- **A released vault is closed** (`users.vaultClosedAt`): `keyring.get` hands out neither the recovery wrapper nor `releaseKeyWrappedByMk`, and `keyring.save` and new-device `devices.register` refuse. Without that, whoever finds the recovery sheet after a death could recover everything, including what the owner kept private. After release the recovery sheet opens only handed-over items, through `handover.open`. The one way back, for an owner proven alive, is `npx convex run claims:reopenVault`, which also stops every open delivery.
- **Delivery window: one year from release.** When the owner's last delivery closes, the whole vault is deleted (`vault.purge`: assets, files, executors with their sheet wrappers, keyring) and nobody, Wassiya included, can open any of it again.
- Rule for all code: no key material in Convex functions, logs, or errors — the server never holds a key. OTP/Clerk auth proves identity only.

## Actors and apps (LOCKED)
- **Owner → mobile only.** MK, biometrics and the check-in (which is also the veto) need a hardware keystore and a fingerprint. Never move any of them to a browser. The owner names executors and prints their sheets on mobile.
- **Executor → web only. Death reporter → web only.** Never add an executor-facing screen to `apps/mobile`; mobile is the owner's app.
- **A death report (`claims`) is about the owner; a delivery (`deliveries`) is about one executor.** Anyone may file a report and attach the certificate. The filer receives nothing by filing. When a report reaches `released`, one delivery is created per executor, and **Wassiya contacts each executor** on the owner-registered phone with a link. Never re-merge the two: a report's author is not its recipient.

## Product rules
- **Handover, not shares:** handed-over assets go to every executor whole, and the executor carries out the will. No inheritance-share math anywhere (الأنصبة يحدّدها القانون، لا التطبيق). A personal message is an ordinary note, handed over like any asset.
- **Every executor is silent in the app** — Wassiya sends them nothing until release: no invitation, no account, no notification. The owner tells them and hands over the sheet, or leaves it with the paper will. The first thing Wassiya ever sends an executor is the outreach after the veto window.
- Dead man's switch: cadence + grace + escalation reminders (day 0/7/14/30). **Missed check-ins release nothing** — only a verified death report can, and no copy may say otherwise. **The check-in is the veto:** `checkin.confirm` also stops every open report against the owner (`stopOpenClaimsOf`) and bars its reporter for 90 days, and it works with the check-in turned off. Confirming is ALWAYS biometric-gated and exists in exactly one place — **Home's `CheckInHero`**, via the single gate in `hooks/use-confirm-alive.ts` (`disableDeviceFallback: true`; the mutation runs only after `auth.success`). While a report is open, Home shows it above the hero and the hero asks, whatever the check-in state. `screens/protection/checkin` is status + cadence settings only; there is no separate veto screen. No *second* confirm affordance may ever be added — rows, notifications and widgets report and navigate only. The protected property is that a tap alone can never say "still alive": an unlocked phone in the wrong hands must not be able to suppress delivery forever. It is the fingerprint that provides that, not the route.
- Subscription lapse: vault stays readable and executor delivery keeps working; only adding assets is blocked. There is **no grace period** — a `renewsAt` in the past blocks the next add and nothing else.
- **Plans: free, or one annual plan.** Free starts at 500 MB · 5 assets · 1 executor · no photos; the paid plan lifts all four. Limits resolve in three layers — `users.limitsOverride`, then the `plans` row, then `PLAN_DEFAULTS` in `convex/model/plans.ts`, which is what a deployment with no rows runs on. **No client may restate a limit**, in a component or in a string: they reach the app through `plans.current` and are interpolated. `DEFAULT_QUOTA_BYTES` on ٩.٤ was the first version of that mistake and a paywall sentence reading "٥٠٠ م.ب" would be the second, now that a tier can move without a deploy.
- **The paywall appears at the limit, never before.** Sign-up, identity verification and the recovery sheet are free, so nothing is sold before the vault has been proved. Paywall copy says what the plan unlocks, never what the owner risks losing — the same reason the lapse banner leads with what still works.
- **The price is never in this repo.** It is set per storefront (base USD, Saudi pinned by hand) and rendered from the RevenueCat offering's `priceString`. The backend never serves a price; no component may hardcode one.
- **Staff authority is a permission, never a role literal.** Three things are
  deliberately separate: **which permissions exist** is code
  (`convex/model/permissions.ts`, a deploy), **which keys a role holds** and
  **which roles a person holds** are data an Owner edits in the console, and
  **what one person may do** is the denormalised union on `users.staffPermissions`,
  which every gate reads. `requirePermission(ctx, key)` in `model/access.ts` is
  the only gate; `requireAdmin` is gone. Four rules hold it up, and
  `pnpm --filter @workspace/backend verify` enforces all of them: every exported
  `admin*` function names a key from the catalogue; **whatever edits a role
  recomputes its holders in the same mutation** (or open consoles keep rights
  that were revoked, invisibly); only `model/staff.ts` writes the denormalised
  columns; and `users.role` — which means *staff account*, not authority, and is
  what owner metrics exclude — is compared only through `isStaffAccount` /
  `excludeStaff`. Nobody edits their own roles, nobody grants a key they do not
  hold, the Owner role is immutable and holds `"*"` so a newly added key cannot
  lock out the administrator, and the last Owner cannot be removed; the way back
  is `npx convex run staff:bootstrapOwner`. Staff join by **email invitation**,
  which binds only to a **Clerk-verified** address — an unverified bind would be
  an account-takeover path straight into the console.
- **Entitlement is written in exactly one module, `convex/billing.ts`.** Three things decide who has paid and what they get: `subscription` (the plan), the `plans` table (what a plan allows) and `limitsOverride` (what one account allows). They are not equally loud — a grant is one account, a plan edit is everyone on that plan at once, and an override is the quietest of the three, because nothing about that account looks unusual while it silently stops matching the plan every screen says it is on. All three are gated on the single permission `billing.manage` and audited with their actor, and `pnpm --filter @workspace/backend verify` fails the build on a writer anywhere else.
- Vault lock policy: the default is **`LOCK_WHILE_OPEN`** (`stores/preferences.ts`) — no session cap, and backgrounding does not lock. The session ends with the process, which is automatic (MK is process memory, `useVault` has no `persist`). This is the owner's explicit choice, made with the trade stated on ٩.٢: anyone holding the unlocked phone can reopen the app and read the vault. **Do not "fix" it back to a timeout.** Choosing a duration in ٩.٢ restores the cap *and* the background lock together.
- A masked field must never carry `keyboardType: "visible-password"`. On Android it and `secureTextEntry` set the same input-type variation bits, the keyboard wins, and the value renders in the clear while every prop claims it is hidden. Use `MASKED_SECRET_INPUT_PROPS` for masked fields, `SECRET_INPUT_PROPS` for secrets that are visible by design (seed phrase, 2FA note, recovery codes).
- Audit log is append-only. No update or delete path may exist.
- **Support chat is not end-to-end encrypted, and never touches the vault.** Owners write from mobile ٩.٦, executors, reporters and guests from web `/help`, and staff answer from the console's `/support` (`support.read` / `support.reply` / `support.manage`). Five rules, and `pnpm --filter @workspace/backend verify` enforces the first three: nothing under `convex/support/` names a vault table or key column; `supportMessages` is inserted only by `appendMessage` in `model/support.ts`; staff notes live in their own table that only `support/admin.ts` reads, and the requester module never names the staff member who replied. **A body that looks like a recovery or executor sheet is refused** on both sides — `looksLikeRecoveryCode` in `@workspace/crypto/papercode` warns in the composers and its mirror in `model/support.ts` refuses on the server; change them together. **A guest is a browser token, not a person**: their name and email are unverified, never linked to an account, and staff must not confirm to anyone that a vault or an executor exists (every executor is silent, including in support). Replies notify by in-app row, email and push after a short delay, and none of them carries the message.
- Identity verification (Didit) is mandatory and blocking for owners at onboarding, and for executors before any delivery opens; the death certificate name must match the owner's verified legal name. **The person who reports a death is never asked to verify** — they receive nothing, and the certificate, the veto window and each executor's own verification guard the release.
- An executor's ID number is required at registration; when their verified document does not match it, delivery needs a staff identity decision.
<!-- END:wassiya-product -->
