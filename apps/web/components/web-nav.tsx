"use client"

import { useAuth } from "@clerk/nextjs"
import Link from "next/link"
import { usePathname } from "next/navigation"

import { SITE_NAV_LINK, siteCopy } from "@workspace/ui/lib/site"
import { cn } from "@workspace/ui/lib/utils"

import { useLocale } from "@/components/locale-provider"

/**
 * The web app's own header menu. "بلاغاتي" (`/`, a person's reports and
 * deliveries) is there only once signed in; `useAuth` rather than a server
 * check because the layout does not re-render after a client-side sign-in.
 */
export function WebNav() {
  const copy = siteCopy(useLocale())
  const { isSignedIn } = useAuth()
  const pathname = usePathname()

  const items = [
    ...(isSignedIn
      ? [
          {
            href: "/",
            label: copy.myReports,
            current: pathname === "/" || pathname.startsWith("/case/") || pathname.startsWith("/delivery/"),
          },
        ]
      : []),
    { href: "/file", label: copy.reportDeath, current: pathname.startsWith("/file") },
    { href: "/help", label: copy.help, current: pathname.startsWith("/help") },
  ]

  return items.map((item) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={item.current ? "page" : undefined}
      className={cn(SITE_NAV_LINK, item.current && "bg-foreground/[0.06] text-foreground")}
    >
      {item.label}
    </Link>
  ))
}
