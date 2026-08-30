import { SignUp } from "@clerk/nextjs"

import { SiteShell } from "@/components/shell/site-shell"

/** See `/sign-in` — same reasoning, same shell. */
export default function Page() {
  return (
    <SiteShell width="narrow" className="flex justify-center">
      <SignUp />
    </SiteShell>
  )
}
