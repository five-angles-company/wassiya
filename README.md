# convex-starter

A Turborepo + pnpm template for bootstrapping apps on **Convex** with **Clerk** auth, across **web (Next.js)** and **mobile (Expo)**.

```
apps/
  web/            Next.js 16 app (Convex + Clerk)
  admin/          Next.js 16 app, near-mirror of web
  landing/        Astro marketing site (static)
  mobile/         Expo (React Native) app (Convex + Clerk)
packages/
  backend/        Convex deployment: schema, functions, auth config (@workspace/backend)
  ui/             Shared shadcn/ui components (@workspace/ui)
  ui-native/      Shared React Native Reusables components (@workspace/ui-native)
  eslint-config/  Shared ESLint config
  typescript-config/ Shared tsconfig presets
```

Every app talks to the **same** Convex deployment and the **same** Clerk instance. The backend's `convex/auth.config.ts` validates Clerk JWTs, so any client (web or native) authenticates against it unchanged.

## Prerequisites

- Node 20+, `pnpm` 10+
- A Convex account (`npx convex dev` will prompt login)
- A Clerk account — [sign up](https://dashboard.clerk.com/sign-up), then [create an application](https://dashboard.clerk.com/apps/new)
- For the **native app**: a **development build** — Expo Go will NOT work (the app uses native modules and the `@clerk/expo` config plugin). On Windows use Android (`expo run:android`); iOS needs macOS.

## Bootstrapping a new app from this template

### 1. Install
```bash
pnpm install
```

### 2. Provision Convex
```bash
pnpm --filter @workspace/backend dev      # = npx convex dev
```
First run is interactive: it logs you into Convex, creates the deployment, and writes `packages/backend/.env.local`. Leave it running (it also serves the backend). The first push fails until step 3 sets `CLERK_FRONTEND_API_URL` — that is expected.

### 3. Activate the Clerk ⇄ Convex integration
Open [dashboard.clerk.com/apps/setup/convex](https://dashboard.clerk.com/apps/setup/convex) and click **Activate Convex integration**. It reveals your **Frontend API URL**; no custom JWT template is needed (Clerk pre-maps the `aud: "convex"` claim that Convex requires). Put it on the **deployment**, not in a `.env.local`:
```bash
cd packages/backend && npx convex env set CLERK_FRONTEND_API_URL https://<your-instance>.clerk.accounts.dev
```
Re-run `convex dev` so it picks up `auth.config.ts`.

### 4. Wire the Clerk webhook (user sync)
`convex/http.ts` serves the webhook that keeps the `users` table in sync. In the Clerk dashboard add an endpoint pointing at `https://<your-deployment>.convex.site/clerk-users-webhook`, subscribed to `user.created`, `user.updated`, `user.deleted`. Then:
```bash
cd packages/backend && npx convex env set CLERK_WEBHOOK_SIGNING_SECRET whsec_...
```
Without it the handler rejects every delivery, and `currentUser` reports `synced: false`.

### 5. Web + admin env
```bash
cp apps/web/.env.example apps/web/.env.local
cp apps/admin/.env.example apps/admin/.env.local
```
Fill `NEXT_PUBLIC_CONVEX_URL` (the deployment URL from `packages/backend/.env.local`), plus the publishable and secret keys from [the Clerk API keys page](https://dashboard.clerk.com/last-active?path=api-keys).

### 6. Native app env + dev build
```bash
cp apps/mobile/.env.example apps/mobile/.env.local   # EXPO_PUBLIC_CONVEX_URL + EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY
```
Two Clerk dashboard prerequisites — both fail at **runtime**, not build time:
- **Email code**: under **User & authentication → Email, phone, username**, enable the email verification code as a sign-in strategy and make sure **password is not a required sign-up field**. The screen is email-code-only, so a required password leaves sign-up stuck at `missing_requirements` (the app surfaces which fields are missing rather than hanging).
- **Google**: enable it under **User & authentication → Social connections**, or the **Continue with Google** button errors.

Then build a dev client:
```bash
cd apps/mobile
npx expo prebuild --clean
npx expo run:android          # or run:ios on macOS
```

### 7. Run everything
```bash
pnpm dev                      # turbo: web + admin + convex dev (+ native if started)
```

## ⚠️ The env-var trap: three separate stores

`convex/auth.config.ts` runs on the **Convex deployment**, whose env is a *separate store* from any `.env.local`. A var in the wrong place fails **silently** (`getUserIdentity()` returns `null` while the client looks signed in). Map:

| Var | Convex deployment | apps/{web,admin}/.env.local | apps/mobile/.env.local |
| --- | :---: | :---: | :---: |
| `CLERK_FRONTEND_API_URL` | ✅ (auth.config) | — | — |
| `CLERK_WEBHOOK_SIGNING_SECRET` | ✅ (http.ts) | — | — |
| `*_CLERK_PUBLISHABLE_KEY` | — | ✅ (`NEXT_PUBLIC_`) | ✅ (`EXPO_PUBLIC_`) |
| `CLERK_SECRET_KEY` | — | ✅ | ❌ never (public bundle) |
| `*_CONVEX_URL` | — | ✅ (`NEXT_PUBLIC_`) | ✅ (`EXPO_PUBLIC_`) |
| `NEXT_PUBLIC_CLERK_SIGN_{IN,UP}_URL` | — | ✅ `/sign-in`, `/sign-up` | — |
| `RESEND_FROM`, `RESEND_TEST_MODE` | ✅ (email.ts) | — | — |
| `APP_URL` | ✅ (email.ts, deliveries) | — | — |
| `ESCROW_BACKEND`, `ESCROW_KEY_ID`, `ESCROW_DEV_PRIVATE_KEY`, `GCP_SERVICE_ACCOUNT`, `WASSIYA_ENV` | ✅ (escrow.ts) | — | — |
| `IDENTITY_HASH_SECRET` | ✅ (identityHash) | — | — |
| `OUTREACH_PROVIDER`, `TWILIO_*` | ✅ (outreach.ts) | — | — |
| `EXPO_PUBLIC_WASSIYA_ENV` | — | — | ✅ (escrow-key.ts) |

`APP_URL` is where `apps/web` lives (`http://localhost:3001` in dev). Outbound mail appends a link built from it; unset, the mail still sends without one. It is **not** `CONVEX_SITE_URL`, which is this deployment's own origin — using that would mail people a link to the backend. And `RESEND_TEST_MODE` keeps test mode **on** unless it is exactly `"false"`, so a deployment that has never set it delivers nothing.

`convex dev` only writes `packages/backend/.env.local` — mirror the needed values into each app's `.env.local` yourself. Verify deployment vars with `npx convex env list`.

## Adding shadcn/ui components

```bash
pnpm dlx shadcn@latest add button -c apps/web
```
Components land in `packages/ui/src/components` and import as `@workspace/ui/components/button`.

## Auth model notes

- Web and admin use `@clerk/nextjs`: `<ClerkProvider>` wraps `<ConvexProviderWithClerk>` (that order — Convex reads Clerk's context), with `<SignIn />` / `<SignUp />` mounted at optional catch-all routes.
- `proxy.ts` (Next.js 16 renamed `middleware.ts`) runs `clerkMiddleware()`, which attaches auth but gates nothing. Clerk deprecated matcher-based gating: protect **resources** instead — `await auth()` in the page/route that reads the data, and `ctx.auth.getUserIdentity()` in the Convex function.
- Native uses `@clerk/expo` with `tokenCache` (sessions persist in the device keychain via `expo-secure-store`). Sign-in is a combined email-code flow plus browser SSO (`useSSO`); Clerk owns token refresh, so there is no `fetchAccessToken` bridge to maintain.
- Clerk's default session token carries no email or name. Users sync into Convex through the webhook in `convex/http.ts`; read the caller with the helpers in `convex/users.ts` (`getCurrentUser` / `getCurrentUserOrThrow`), never by accepting a user id as an argument.
- In the UI, gate on **Convex's** auth state (`<Authenticated>` / `<Unauthenticated>` / `useConvexAuth()`), not Clerk's — that is the state that decides whether a query succeeds.
