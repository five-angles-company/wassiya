"use client"

import { type ReactNode, useState } from "react"
import { useAuth } from "@clerk/nextjs"
import { ConvexReactClient } from "convex/react"
import { ConvexProviderWithClerk } from "convex/react-clerk"

// Must render *inside* <ClerkProvider> — it reads Clerk's context to mint the
// Convex access token. ConvexProviderWithClerk handles the token lifecycle
// (including refresh), so there is no fetchAccessToken bridge to write.
export function ConvexClientProvider({ children }: { children: ReactNode }) {
  const [convex] = useState(
    () => new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!),
  )

  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
      {children}
    </ConvexProviderWithClerk>
  )
}
