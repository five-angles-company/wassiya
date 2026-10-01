import type { ReactNode } from "react"

import { siteCopy, type SiteHrefs, type SiteLocale } from "@workspace/ui/lib/site"

/**
 * The header frame of wassiya.app and of the web app: the same logo, height,
 * glass and language link on both, so crossing between them never changes the
 * chrome. Each app supplies its own menu (`nav`, styled with `SITE_NAV_LINK`)
 * and its own buttons (`actions`).
 */
export function SiteHeader({
  locale,
  hrefs,
  markSrc,
  nav,
  actions,
}: {
  locale: SiteLocale
  hrefs: Pick<SiteHrefs, "home" | "language">
  markSrc: string
  nav?: ReactNode
  actions?: ReactNode
}) {
  const copy = siteCopy(locale)
  const other = locale === "ar" ? "en" : "ar"

  return (
    <header className="site-header sticky top-0 z-40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center gap-2 px-4 md:h-[72px] md:px-8">
        <a href={hrefs.home} className="group -ms-1.5 flex min-h-11 shrink-0 items-center gap-2.5 rounded-full px-1.5">
          <img
            src={markSrc}
            alt=""
            width={56}
            height={28}
            className="h-7 w-auto transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
          />
          <span className="font-heading text-[19px] font-black">{copy.appName}</span>
        </a>

        <nav aria-label={copy.mainNav} className="ms-8 hidden items-center gap-0.5 lg:flex">
          {nav}
        </nav>

        <div className="ms-auto flex items-center gap-1.5">
          <a
            href={hrefs.language}
            hrefLang={other}
            lang={other}
            className="text-muted-foreground hover:text-foreground hover:bg-foreground/[0.04] flex h-10 items-center rounded-full px-4 text-[14.5px] font-semibold transition-colors"
            data-track="language_switch"
            data-track-label={other}
          >
            {copy.switchLanguage}
          </a>
          {actions}
        </div>
      </div>
    </header>
  )
}
