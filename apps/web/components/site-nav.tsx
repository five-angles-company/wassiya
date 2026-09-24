"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

import { cn } from "@workspace/ui/lib/utils"

/**
 * The header's destinations. Plain links, so they work before hydration; below
 * `md` they live in the account menu and the footer instead of a JS drawer.
 */
export function SiteNav({ items, label }: { items: { href: string; label: string }[]; label: string }) {
  const pathname = usePathname()

  return (
    <nav aria-label={label} className="ms-6 hidden items-center gap-0.5 md:flex">
      {items.map((item) => {
        const current = item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              "rounded-full px-4 py-2 text-[15px] font-semibold transition-colors",
              current
                ? "bg-foreground/[0.06] text-foreground"
                : "text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04]"
            )}
          >
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
