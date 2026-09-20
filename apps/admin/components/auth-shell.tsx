"use client"

import type { ReactNode } from "react"

import { BrandMark } from "@/components/brand-mark"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * The frame around sign-in and sign-up.
 *
 * These two routes render outside the shell, so without this the only screens
 * in the console carrying no mark at all were its doorway — a reviewer arriving
 * from an emailed invitation saw a bare Clerk card and nothing saying what they
 * were signing in to.
 *
 * A Client Component for the locale alone: the cookie is already resolved in
 * the root layout and handed down, so reading it from context here beats
 * parsing it a second time server-side.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const common = t(COMMON, useLocale())

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-8 p-6">
      <div className="flex flex-col items-center gap-3">
        <div className="w-[52px]">
          <BrandMark />
        </div>
        <div className="flex flex-col items-center gap-0.5">
          <span className="font-heading text-lg font-semibold">
            {common.appName}
          </span>
          <span className="text-sm text-muted-foreground">
            {common.consoleName}
          </span>
        </div>
      </div>

      {children}
    </div>
  )
}
