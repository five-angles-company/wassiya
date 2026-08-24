import { useConvexAuth } from "convex/react"
import { Redirect, Stack } from "expo-router"

/**
 * The signed-out half of the app.
 *
 * Gating happens here rather than in `proxy`-style middleware or a route
 * matcher: the resource decides. A user who already has a session has nothing
 * to do on these screens, so the layout bounces them to the splash, which
 * re-reads the evidence and routes them to whichever setup step they are on.
 *
 * The check is **Convex's** auth state, not Clerk's. Clerk can report a signed
 * in client a beat before Convex has minted its own token, and gating on the
 * earlier signal would bounce users into screens whose queries then fail.
 */
export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useConvexAuth()

  if (!isLoading && isAuthenticated) return <Redirect href="/" />

  return (
    <Stack
      screenOptions={{ headerShown: false, animation: "slide_from_right" }}
    />
  )
}
