import type { AuthConfig } from "convex/server"

// Runs on the Convex deployment. `CLERK_FRONTEND_API_URL` lives in the
// *deployment* environment (`npx convex env set …`), NOT in any .env.local —
// copy it from https://dashboard.clerk.com/apps/setup/convex after activating
// the Convex integration there.
//
// `applicationID: "convex"` is checked against the JWT `aud` claim. Clerk's
// Convex integration pre-maps that audience, so no custom JWT template is
// needed. Re-run `convex dev` after editing this file.
export default {
  providers: [
    {
      domain: process.env.CLERK_FRONTEND_API_URL!,
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig
