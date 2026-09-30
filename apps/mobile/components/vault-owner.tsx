import { useEffect } from "react"
import { useAuth } from "@clerk/expo"

import { useVault } from "@/stores/vault"

/**
 * Binds the in-memory vault to the signed-in Clerk user. Signing out, or
 * signing into another account, locks it — the key never outlives the session
 * it was opened in. Renders nothing; lives inside `ClerkProvider`.
 */
export function VaultOwner() {
  const { isLoaded, userId } = useAuth()
  useEffect(() => {
    if (isLoaded) useVault.getState().bindOwner(userId ?? null)
  }, [isLoaded, userId])
  return null
}
