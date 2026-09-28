"use client"

import { createContext, use, type ReactNode } from "react"
import { DirectionProvider } from "@workspace/ui/components/direction"

import { DEFAULT_LOCALE, dirFor, type Locale } from "@/lib/i18n/locale"

/**
 * Carries the server-resolved locale down to Client Components.
 *
 * The cookie is parsed exactly once, in the root layout, and the answer is
 * handed down as a prop. A client that re-read `document.cookie` for itself
 * could disagree with the `dir` already on `<html>` for one render, which is
 * the flash this whole arrangement exists to prevent.
 *
 * Radix does not read `dir` from the document. Without `DirectionProvider` it
 * writes `dir="ltr"` onto every Select, menu and Tabs it renders, so those lay
 * out left-to-right inside the Arabic console.
 */
const LocaleContext = createContext<Locale>(DEFAULT_LOCALE)

export function LocaleProvider({
  locale,
  children,
}: {
  locale: Locale
  children: ReactNode
}) {
  return (
    <LocaleContext value={locale}>
      <DirectionProvider dir={dirFor(locale)}>{children}</DirectionProvider>
    </LocaleContext>
  )
}

export function useLocale(): Locale {
  return use(LocaleContext)
}
