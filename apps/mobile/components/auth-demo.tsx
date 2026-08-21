import { ActivityIndicator, View } from "react-native"
import { useClerk, useUser } from "@clerk/expo"
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui-native/components/ui/button"
import { Text } from "@workspace/ui-native/components/ui/text"
import { SignInCard } from "@/components/sign-in-card"

export function AuthDemo() {
  return (
    <>
      {/* These track *Convex's* auth state, not Clerk's — that is what decides
          whether a query will succeed. */}
      <AuthLoading>
        <ActivityIndicator />
      </AuthLoading>
      <Unauthenticated>
        <SignInCard />
      </Unauthenticated>
      <Authenticated>
        <SignedIn />
      </Authenticated>
    </>
  )
}

function SignedIn() {
  const { user } = useUser()
  const { signOut } = useClerk()
  // Runs against Convex with the Clerk token attached. A non-null result is the
  // end-to-end proof that Convex authenticated the request (same as web).
  const me = useQuery(api.users.currentUser)

  return (
    <View className="w-full gap-3">
      <Text variant="muted">
        Signed in as {user?.primaryEmailAddress?.emailAddress}
      </Text>
      <Text variant="muted">Convex sees this identity:</Text>
      <Text variant="code" selectable>
        {me === undefined ? "loading…" : JSON.stringify(me, null, 2)}
      </Text>
      <Button variant="outline" onPress={() => void signOut()}>
        <Text>Sign out</Text>
      </Button>
    </View>
  )
}
