---
name: auth-wiring
description: >-
  Wire or debug Clerk + Convex authentication in this monorepo. Use when adding
  or changing auth, sign-in/sign-out, protected Convex functions, the Clerk
  user-sync webhook, or when "the client is signed in but Convex sees no user"
  (getUserIdentity returns null). Covers web/admin (Next.js) and mobile (Expo).
---

# Auth wiring (Clerk + Convex)

Authentication spans **three separate env stores**, a Clerk dashboard step, and a webhook. Most "auth is broken" issues are an env var in the wrong store or a dashboard toggle — not code.

## When to use
- Adding/changing auth in any app, or adding a protected Convex function.
- A new app needs sign-in; the webhook isn't syncing users.
- Symptom: client looks authenticated but `ctx.auth.getUserIdentity()` is `null`.

## When NOT to use
- Pure Convex data modeling with no auth → use the `convex` / `convex-setup-auth` skills + `packages/backend/convex/_generated/ai/guidelines.md`.

## The mental model
- `convex/auth.config.ts` runs **on the Convex deployment** and validates Clerk JWTs (`domain: CLERK_FRONTEND_API_URL`, `applicationID: "convex"`). The deployment env is a **separate store** from any `.env.local`; `convex dev` does NOT copy `.env.local` into it.
- One Clerk instance issues tokens for web, admin, and mobile, so the backend validates all three unchanged.
- Three stores (see root `AGENTS.md` + the README table):
  1. Convex **deployment** env — `CLERK_FRONTEND_API_URL`, `CLERK_WEBHOOK_SIGNING_SECRET`. Set with `npx convex env set`; check `npx convex env list`.
  2. `packages/backend/.env.local` — written by `convex dev` (deployment URL only).
  3. each app's `.env.local` — publishable key everywhere, `CLERK_SECRET_KEY` on Next.js only.

## Steps
1. **Backend is already auth-ready** (`auth.config.ts`, the webhook route in `http.ts`, the `users` table, helpers in `users.ts`). Don't re-scaffold it; reuse it.
2. **Activate the Convex integration** at `https://dashboard.clerk.com/apps/setup/convex`, copy the Frontend API URL, then `npx convex env set CLERK_FRONTEND_API_URL <url>` and re-run `convex dev`. No custom JWT template is needed — Clerk pre-maps `aud: "convex"`.
3. **Webhook.** Add a Clerk endpoint at `https://<deployment>.convex.site/clerk-users-webhook` (events `user.created|updated|deleted`), then `npx convex env set CLERK_WEBHOOK_SIGNING_SECRET whsec_…`. Without it every delivery is rejected and `currentUser` reports `synced: false`.
4. **App env.** Copy `.env.example` → `.env.local` and fill it from the Clerk API keys page. Mobile ships only public `EXPO_PUBLIC_*` vars — **never** `CLERK_SECRET_KEY`.
5. **Client wiring.** `<ClerkProvider>` must wrap `<ConvexProviderWithClerk>`; the reverse order never authenticates.
   - Web/admin: `apps/web/components/convex-client-provider.tsx` + `<ClerkProvider>` in `app/layout.tsx`, `<SignIn />`/`<SignUp />` at the optional catch-all routes, `clerkMiddleware()` in `proxy.ts`.
   - Mobile: `ClerkProvider` + `tokenCache` in `app/_layout.tsx`, flows in `src/components/sign-in-card.tsx`. See the `mobile-expo` skill.
6. **Protected functions:** `const id = await ctx.auth.getUserIdentity(); if (!id) throw …`, or `getCurrentUserOrThrow(ctx)` from `convex/users.ts` for the synced profile. Never accept a `userId` arg for authorization.
7. **Protected pages/routes:** in the page, layout, or route handler — `const { isAuthenticated } = await auth()` or `await auth.protect()` from `@clerk/nextjs/server`. **Not** in `proxy.ts`: `clerkMiddleware()` gates nothing and `createRouteMatcher` is deprecated.

## Gotchas
- Var in the wrong store → silent `null` identity. **Always `npx convex env list`** to confirm `CLERK_FRONTEND_API_URL` is on the **deployment**.
- After activating the Convex integration, **sign out fully and back in**. A stale Clerk session keeps sending a token Convex rejects, which looks exactly like a misconfiguration.
- Clerk's default session token carries **no email or name** — those come from the synced `users` row, not the token. Add claims on Clerk's Sessions page only if you deliberately want them in the JWT.
- Enabling a strategy (social provider, email code) is a **dashboard** action. Code for a disabled strategy fails at runtime, not build time.
- Clerk Core 3 renamed a lot: `<SignedIn>`/`<SignedOut>` are removed (`<Show when="signed-in">`), and `useSignIn()` is method-based. Verify against `node_modules/@clerk/*/dist/**/*.d.ts` before writing.
- The webhook verifies with `svix` (what Convex documents). If a `convex dev` push ever rejects it in the V8 isolate, the drop-in replacement is `verifyWebhook(request, { signingSecret })` from `@clerk/backend/webhooks` — one import swap in `http.ts`, then drop the `svix` dep. Not a redesign.

## Verify
- `npx convex env list` shows `CLERK_FRONTEND_API_URL` (and the webhook secret).
- A query calling `ctx.auth.getUserIdentity()` returns **non-null** while signed in, `null` after sign-out.
- The auth demo shows `synced: true` — that only happens once the webhook has fired.
