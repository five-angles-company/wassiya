import { toArabicDigits } from "@workspace/ui/lib/format-ar"
import { siteCopy, type SiteHrefs, type SiteLocale } from "@workspace/ui/lib/site"

/**
 * The footer of wassiya.app and of the web app — one component, for the same
 * reason as `SiteHeader`. "أبلغ عن وفاة" is the one link in terracotta: someone
 * who has lost a person must find it without reading the rest.
 */
export function SiteFooter({
  locale,
  hrefs,
  markSrc,
  cookieSettings = false,
}: {
  locale: SiteLocale
  hrefs: SiteHrefs
  markSrc: string
  /** The landing's consent banner reopener, shown only where analytics runs. */
  cookieSettings?: boolean
}) {
  const copy = siteCopy(locale)
  const other = locale === "ar" ? "en" : "ar"
  const year = String(new Date().getFullYear())
  const columns = [
    {
      title: copy.footerProduct,
      links: [
        { href: hrefs.how, label: copy.navHow, accent: false },
        { href: hrefs.security, label: copy.navSecurity, accent: false },
        { href: hrefs.plans, label: copy.navPlans, accent: false },
        { href: hrefs.faq, label: copy.navFaq, accent: false },
      ],
    },
    {
      title: copy.footerFamilies,
      links: [
        { href: hrefs.reportDeath, label: copy.reportDeath, accent: true },
        { href: hrefs.help, label: copy.help, accent: false },
      ],
    },
    {
      title: copy.footerLegal,
      links: [
        { href: hrefs.terms, label: copy.terms, accent: false },
        { href: hrefs.privacy, label: copy.privacy, accent: false },
        { href: hrefs.encryption, label: copy.encryption, accent: false },
      ],
    },
  ]

  return (
    <footer className="grain text-sand-50 relative overflow-hidden rounded-t-[40px] bg-[#1c1a19]">
      <div className="mx-auto grid w-full max-w-[1200px] gap-10 px-4 pt-14 pb-10 md:px-8 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))] lg:gap-10 lg:pt-16">
        <div className="max-w-sm">
          <a href={hrefs.home} className="inline-flex items-center gap-2.5">
            <img src={markSrc} alt="" width={56} height={28} className="h-7 w-auto" />
            <span className="font-heading text-[19px] font-black">{copy.appName}</span>
          </a>
          <p className="text-sand-300 mt-5 text-[14.5px] leading-[1.85]">{copy.footerPromise}</p>
          <a
            href={hrefs.language}
            hrefLang={other}
            lang={other}
            className="mt-6 inline-flex h-9 items-center rounded-full border border-white/15 px-4 text-[13.5px] font-semibold transition-colors hover:bg-white/[0.08]"
          >
            {copy.switchLanguage}
          </a>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-10 sm:grid-cols-3 lg:col-span-3 lg:gap-10">
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <p className="text-sand-400 text-[13px] font-semibold">{column.title}</p>
              <ul className="mt-4 flex flex-col gap-3">
                {column.links.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className={
                        item.accent
                          ? "text-terracotta-300 hover:text-terracotta-200 text-[14.5px] font-semibold transition-colors"
                          : "text-sand-300 hover:text-sand-50 text-[14.5px] transition-colors"
                      }
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
      </div>

      <div className="mx-auto w-full max-w-[1200px] px-4 md:px-8">
        <div className="text-sand-400 flex flex-col gap-2 border-t border-white/10 py-6 text-[13px] leading-[1.8] md:flex-row md:items-center md:justify-between md:gap-8">
          <p>{copy.notLegal}</p>
          <div className="flex shrink-0 items-center gap-6">
            {cookieSettings && (
              <button type="button" data-consent-open className="hover:text-sand-50 cursor-pointer transition-colors">
                {copy.cookieSettings}
              </button>
            )}
            <p>{copy.copyright.replace("{year}", locale === "ar" ? toArabicDigits(year) : year)}</p>
          </div>
        </div>
      </div>
    </footer>
  )
}
