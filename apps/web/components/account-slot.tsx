"use client"

import { useAuth } from "@clerk/nextjs"
import { usePathname } from "next/navigation"

import { ButtonLink } from "@/components/button"
import { UserMenu } from "@/components/user-menu"
import { safePath } from "@/lib/safe-path"

/**
 * The header's end: the account menu, or a way to sign in that returns here.
 *
 * A client component because the root layout does not re-render after a
 * client-side sign-in; `useAuth` does.
 */
export function AccountSlot({ signInLabel }: { signInLabel: string }) {
  const { isSignedIn } = useAuth()
  const pathname = usePathname()

  if (isSignedIn) return <UserMenu />
  if (pathname.startsWith("/sign-in") || pathname.startsWith("/sign-up")) return null

  return (
    <ButtonLink
      href={`/sign-in?redirect_url=${encodeURIComponent(safePath(pathname))}`}
      variant="outline"
      size="sm"
      className="h-10 px-5"
    >
      {signInLabel}
    </ButtonLink>
  )
}
