import { SignIn } from "@clerk/nextjs"

import { SiteShell } from "@/components/shell/site-shell"

// Optional catch-all so Clerk can own its sub-routes (SSO callback, factor
// steps) under /sign-in. Rendering <SignIn /> here keeps the flow in-app
// instead of bouncing to Clerk's hosted Account Portal.
//
// Inside the shell rather than floating in a centred div: these were the only
// two screens in the app with no header, no language toggle and no way back,
// which made signing in feel like leaving the site. Clerk's own card is themed
// through `appearance` on the provider in `app/layout.tsx`.
export default function Page() {
  return (
    <SiteShell width="narrow" className="flex justify-center">
      <SignIn />
    </SiteShell>
  )
}
