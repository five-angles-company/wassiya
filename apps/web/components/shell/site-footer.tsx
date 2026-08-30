import Link from "next/link"

import { t, type Locale } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The footer: documents, support, and the disclaimer.
 *
 * The disclaimer — *"وصيّة ليست جهة قانونية ولا تقسّم التركات"* — used to appear
 * on exactly two screens, which is two fewer than the number of screens where
 * someone might form the belief it corrects. The commonest misunderstanding
 * about this product is that it divides an estate. It does not, and saying so
 * once per page is cheap.
 */
export async function SiteFooter() {
  const locale = await getLocale()
  const labels = t(NAV, locale)

  const columns: { title: string; links: { href: string; label: string }[] }[] =
    [
      {
        title: labels.footerService,
        links: [
          { href: "/claim", label: labels.fileClaim },
          { href: "/claim/resume", label: labels.resume },
          { href: "/claim/guardian", label: labels.guardian },
        ],
      },
      {
        title: labels.footerLegal,
        links: [
          { href: "/legal/terms", label: labels.terms },
          { href: "/legal/privacy", label: labels.privacy },
          { href: "/legal/encryption", label: labels.encryption },
        ],
      },
      {
        title: labels.footerSupport,
        links: [{ href: "/claim/contact", label: labels.contact }],
      },
    ]

  return (
    <footer className="border-border mt-20 border-t">
      <div className="mx-auto max-w-5xl px-5 py-12 md:px-8">
        <div className="grid gap-8 sm:grid-cols-3">
          {columns.map((column) => (
            <nav key={column.title} className="flex flex-col gap-2.5">
              <h2 className="text-sand-600 text-[12px] font-semibold tracking-wide uppercase">
                {column.title}
              </h2>
              {column.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sand-700 hover:text-terracotta-700 text-[14px] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>

        <p className="text-sand-600 border-border mt-10 border-t pt-6 text-[13px]">
          {labels.disclaimer}
        </p>
      </div>
    </footer>
  )
}

/** Exported for the pages that need the locale without re-reading the cookie. */
export type FooterLocale = Locale
