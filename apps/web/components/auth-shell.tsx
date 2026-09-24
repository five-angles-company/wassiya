import type { ReactNode } from "react"

import { PageColumn } from "@/components/page-column"

/**
 * Sign-in and sign-up. Clerk renders with `elevation: "flush"` (no card of its
 * own — see the root layout), so the card here is ours and matches every other
 * surface.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <PageColumn narrow>
      <div className="bg-card border-border rounded-panel border p-6 shadow-[var(--shadow-overlay)] md:p-8 [&_.cl-rootBox]:w-full">
        {children}
      </div>
    </PageColumn>
  )
}
