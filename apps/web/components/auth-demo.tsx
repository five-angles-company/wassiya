"use client"

import { SignInButton, SignUpButton, useClerk, useUser } from "@clerk/nextjs"
import { Authenticated, AuthLoading, Unauthenticated, useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import { Button } from "@workspace/ui/components/button"

export function AuthDemo() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4">
      <h2 className="font-medium">Auth test</h2>
      {/* These reflect *Convex's* auth state, not Clerk's — that is the state
          that decides whether a query will succeed. Prefer them (or
          useConvexAuth()) over Clerk's <Show when="signed-in">. */}
      <AuthLoading>
        <p className="text-muted-foreground text-sm">Checking session…</p>
      </AuthLoading>
      <Unauthenticated>
        <SignedOut />
      </Unauthenticated>
      <Authenticated>
        <SignedIn />
      </Authenticated>
    </div>
  )
}

function SignedOut() {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-muted-foreground text-sm">You are signed out.</p>
      <div className="flex gap-2">
        <SignInButton>
          <Button>Sign in</Button>
        </SignInButton>
        <SignUpButton>
          <Button variant="outline">Sign up</Button>
        </SignUpButton>
      </div>
    </div>
  )
}

function SignedIn() {
  const { user } = useUser()
  const { signOut } = useClerk()
  // This query runs against Convex with the Clerk token attached. A non-null
  // result is the end-to-end proof that Convex authenticated the request;
  // `synced: true` additionally proves the Clerk webhook reached Convex.
  const me = useQuery(api.users.currentUser)

  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm">
        Signed in as{" "}
        <span className="font-medium">
          {user?.primaryEmailAddress?.emailAddress}
        </span>
      </p>
      <p className="text-muted-foreground text-xs">Convex sees this identity:</p>
      <pre className="bg-muted overflow-auto rounded p-2 text-xs">
        {me === undefined ? "loading…" : JSON.stringify(me, null, 2)}
      </pre>
      <Button variant="outline" className="self-start" onClick={() => signOut()}>
        Sign out
      </Button>
    </div>
  )
}
