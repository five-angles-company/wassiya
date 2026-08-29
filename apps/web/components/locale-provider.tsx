"use client"

import { createContext, use, type ReactNode } from "react"

import { DEFAULT_LOCALE, type Locale } from "@/lib/i18n/locale"

const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

/**
 * The locale, resolved once on the server and handed down.
 *
 * A client component cannot read the cookie before its first paint, so the
 * server does it and this carries the answer. The default is only ever reached
 * by a component rendered outside the provider, which would be a mistake — but
 * one that renders the Arabic-first site rather than throwing.
 */
export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  return <LocaleContext value={locale}>{children}</LocaleContext>
}

export function useLocale(): Locale {
  return use(LocaleContext)
}
