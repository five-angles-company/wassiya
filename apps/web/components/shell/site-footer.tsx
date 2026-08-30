import Link from "next/link"

import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * One quiet line, and a deliberate departure from the board.
 *
 * **The board has no footer at all**, and says why: *"The no-legal-authority
 * line is on the entry page rather than buried in a footer."* That call is
 * right and is honoured — the disclaimer now sits on `/claim`, in the reader's
 * path, not down here.
 *
 * What the board does not solve is that terms and privacy then have no route
 * to them from anywhere, which an app store or a payment processor will ask
 * about. So this is the minimum that keeps them reachable: three links and no
 * columns, no headings, no disclaimer — nothing that reintroduces the weight
 * the board removed.
 */
export async function SiteFooter() {
  const labels = t(NAV, await getLocale())

  const links = [
    { href: "/legal/terms", label: labels.terms },
    { href: "/legal/privacy", label: labels.privacy },
    { href: "/legal/encryption", label: labels.encryption },
  ]

  return (
    <footer className="mx-auto w-full max-w-[1280px] px-[22px] pt-10 pb-12 md:px-11">
      <nav className="flex flex-wrap items-center gap-x-6 gap-y-2">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="hover:text-terracotta-700 text-[13px] opacity-55 transition-colors hover:opacity-100"
          >
            {link.label}
          </Link>
        ))}
      </nav>
    </footer>
  )
}
