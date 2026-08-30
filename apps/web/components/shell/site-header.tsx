import Link from "next/link"
import { auth } from "@clerk/nextjs/server"

import { LanguageToggle } from "@/components/language-toggle"
import { BrandMark } from "@/components/shell/brand-mark"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { NAV } from "@/lib/i18n/strings/nav"

/**
 * The bar, matched to the design board.
 *
 * ## Three things here reverse what was built before, on purpose
 *
 * It sits on `--background`, not the card tone, and carries **no border and no
 * shadow** — it is flush with the page. It is **not sticky**. And it holds
 * **two** links rather than four. All three were "make it look like an app"
 * moves, and the board answers them differently: the page is type-led and
 * single-column, and a separated, pinned bar with a row of destinations fights
 * that. The separation comes from the hero's own 72px of air.
 *
 * ## Server-rendered, auth and all
 *
 * `await auth()` rather than Convex's `<Authenticated>` — the repo rule is for
 * anything that *reads data*, and this is one word of chrome. Answering on the
 * server keeps the header out of the client bundle, which is what lets the
 * landing page underneath it work with JavaScript disabled.
 */
export async function SiteHeader({
  variant = "full",
}: {
  variant?: "full" | "focused"
}) {
  const locale = await getLocale()
  const labels = t(NAV, locale)
  const { isAuthenticated } = await auth()

  return (
    <header className="bg-background">
      <div className="mx-auto flex max-w-[1280px] items-center gap-3 px-[22px] py-[18px] md:gap-4 md:px-11 md:py-[22px]">
        <Link href="/" className="flex flex-1 items-center gap-[11px] rounded-xl">
          <span className="md:hidden">
            <BrandMark size="sm" />
          </span>
          <span className="hidden md:inline-flex">
            <BrandMark />
          </span>
          <span className="font-heading text-[17px] font-extrabold md:text-[19px]">
            وصيّة
          </span>
        </Link>

        {variant === "full" && (
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/legal/encryption"
              className="hover:text-terracotta-700 text-[14px] opacity-70 transition-colors hover:opacity-100"
            >
              {labels.encryption}
            </Link>
            <Link
              href="/claim/contact"
              className="hover:text-terracotta-700 text-[14px] opacity-70 transition-colors hover:opacity-100"
            >
              {labels.help}
            </Link>
          </nav>
        )}

        <div className="flex items-center gap-3 md:gap-4">
          <LanguageToggle locale={locale} />
          <Link
            href={isAuthenticated ? "/claim" : "/sign-in"}
            className="hover:bg-sand-200 hidden rounded-full border-[1.5px] border-[color:var(--border)] px-[22px] py-[11px] text-[14px] font-semibold whitespace-nowrap transition-colors md:inline-flex"
          >
            {isAuthenticated ? labels.myAccount : labels.signIn}
          </Link>
          <Link
            href={isAuthenticated ? "/claim" : "/sign-in"}
            className="text-[13.5px] opacity-70 md:hidden"
          >
            {isAuthenticated ? labels.myAccount : labels.signInShort}
          </Link>
        </div>
      </div>
    </header>
  )
}
