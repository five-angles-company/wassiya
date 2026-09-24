"use client"

import { api } from "@workspace/backend/api"
import { SidebarMenuBadge } from "@workspace/ui/components/sidebar"
import { useQuery } from "convex/react"

import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"

/**
 * A live count beside a sidebar item. Only rendered for items the viewer may
 * open, so the query behind it is one they are allowed to run.
 */
export function NavBadge({ kind }: { kind: "supportUnassigned" }) {
  const locale = useLocale()
  const count = useQuery(
    api.support.admin.adminBadge,
    kind === "supportUnassigned" ? {} : "skip"
  )
  if (count === undefined || count === 0) return null
  return (
    <SidebarMenuBadge>
      {count >= 100 ? `${fmtNumber(99, locale)}+` : fmtNumber(count, locale)}
    </SidebarMenuBadge>
  )
}
