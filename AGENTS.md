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
