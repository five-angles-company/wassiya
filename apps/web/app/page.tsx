import type { Metadata } from "next"
import Link from "next/link"

import { LanguageToggle } from "@/components/language-toggle"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { HOME } from "@/lib/i18n/strings/common"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(HOME, await getLocale())
  return { title: labels.metaTitle, description: labels.metaDescription }
}

/**
 * `/` — the two questions anyone arriving at the bare domain is here to ask.
 *
 * It replaces the starter template's auth demo, which rendered sign-in state on
 * a public page and told nobody anything.
 *
 * **An owner is told to leave.** That is not a gap: owners are mobile-only, on
 * purpose, because MK, the biometric gate, the veto and the check-in all need a
 * hardware keystore that a browser does not have. The funnel's header links
 * here with "this is my account", so this page owes that person a real answer
 * rather than a sign-in box that would strand them.
 */
export default async function Page() {
  const labels = t(HOME, await getLocale())

  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-3xl items-center gap-3 px-5 pt-6 md:px-8">
        <span
          aria-hidden
          className="bg-terracotta-200 text-terracotta-700 flex size-9 items-center justify-center rounded-full text-[19px] font-black"
        >
          و
        </span>
        <span className="text-[17px] font-bold">{labels.title}</span>
        <span className="ms-auto">
          <LanguageToggle />
        </span>
      </header>

      <main className="mx-auto flex max-w-3xl flex-col gap-4 px-5 pt-10 md:px-8 md:pt-16">
        <section className="bg-card rounded-card p-6">
          <h1 className="text-[22px] leading-[1.3]">{labels.ownerTitle}</h1>
          <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
            {labels.ownerBody}
          </p>
        </section>

        <section className="border-border rounded-card border p-6">
          <h2 className="text-[18px] leading-[1.3]">{labels.claimTitle}</h2>
          <p className="text-sand-700 mt-3 text-[15px] leading-[1.75]">
            {labels.claimBody}
          </p>
          <Link
            href="/claim"
            className="bg-primary text-primary-foreground hover:bg-terracotta-600 mt-5 inline-flex rounded-full px-6 py-3 text-[15px] font-semibold transition-colors"
          >
            {labels.claimAction}
          </Link>
        </section>
      </main>
    </div>
  )
}
