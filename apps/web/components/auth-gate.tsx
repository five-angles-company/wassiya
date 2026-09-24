"use client"

import type { ReactNode } from "react"
import { api } from "@workspace/backend/api"
import { AuthLoading, Authenticated, useQuery } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { Placeholder } from "@/components/placeholder"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * Renders the signed-in screens only once Convex holds the session **and** the
 * user row exists. The Clerk webhook that creates the row can land a moment
 * after sign-up; a screen rendered before it would query as nobody.
 */
export function AuthGate({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthLoading>
        <GatePlaceholder />
      </AuthLoading>
      <Authenticated>
        <SyncCheck>{children}</SyncCheck>
      </Authenticated>
    </>
  )
}

function SyncCheck({ children }: { children: ReactNode }) {
  const me = useQuery(api.users.me)

  if (me === undefined || me === null) return <GatePlaceholder />

  return <>{children}</>
}

function GatePlaceholder() {
  const label = t(COMMON, useLocale()).loading
  return (
    <div className="flex flex-col gap-5">
      <Placeholder label={label} className="h-12 w-2/3 rounded-full" />
      <Placeholder label={label} className="h-64" />
    </div>
  )
}
