import { SignIn } from "@clerk/nextjs"

// Optional catch-all so Clerk can own its sub-routes (SSO callback, factor
// steps) under /sign-in. Rendering <SignIn /> here keeps the flow in-app
// instead of bouncing to Clerk's hosted Account Portal.
export default function Page() {
  return (
    <div className="flex min-h-svh items-center justify-center p-6">
      <SignIn />
    </div>
  )
}
