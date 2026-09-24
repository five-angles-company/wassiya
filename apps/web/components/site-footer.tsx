import Image from "next/image"
import Link from "next/link"

import { fmtStepNumber } from "@/lib/format"
import { t, type Locale } from "@/lib/i18n/locale"
import { NAV } from "@/lib/i18n/strings/nav"
import { landingUrl } from "@/lib/landing-url"

export function SiteFooter({ locale }: { locale: Locale }) {
  const nav = t(NAV, locale)
  const year = fmtStepNumber(new Date().getFullYear(), locale)
  const link = "text-muted-foreground hover:text-foreground text-[14.5px] transition-colors"

  const columns = [
    {
      title: nav.footerFamilies,
      links: [
        { href: "/file", label: nav.reportDeath, external: false },
        { href: "/help", label: nav.help, external: false },
        { href: "/help/chat", label: nav.writeToUs, external: false },
      ],
    },
    {
      title: nav.footerLegal,
      links: [
        { href: landingUrl(locale, "/legal/terms"), label: nav.terms, external: true },
        { href: landingUrl(locale, "/legal/privacy"), label: nav.privacy, external: true },
        { href: landingUrl(locale, "/legal/encryption"), label: nav.encryption, external: true },
      ],
    },
    {
      title: nav.footerAbout,
      links: [
        { href: landingUrl(locale, "/"), label: nav.aboutSite, external: true },
        { href: landingUrl(locale, "/#download"), label: nav.getApp, external: true },
      ],
    },
  ]

  return (
    <footer className="border-border mt-auto border-t">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 py-12 md:px-8 lg:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))] lg:py-14">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2.5">
            <Image src="/brand/mark.png" alt="" aria-hidden width={56} height={28} className="h-7 w-auto" />
            <span className="font-heading text-[19px] font-black">{nav.appName}</span>
          </Link>
          <p className="text-muted-foreground mt-5 text-[14px] leading-[1.85]">{nav.notLegal}</p>
        </div>

        {columns.map((column) => (
          <nav key={column.title} aria-label={column.title}>
            <p className="font-heading text-[15px] font-extrabold">{column.title}</p>
            <ul className="mt-4 flex flex-col gap-3">
              {column.links.map((item) => (
                <li key={item.href}>
                  {item.external ? (
                    <a href={item.href} className={link}>
                      {item.label}
                    </a>
                  ) : (
                    <Link href={item.href} className={link}>
                      {item.label}
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="border-border border-t">
        <p className="text-muted-foreground mx-auto w-full max-w-[1200px] px-4 py-6 text-[13.5px] md:px-8">
          {nav.copyright.replace("{year}", year)}
        </p>
      </div>
    </footer>
  )
}
