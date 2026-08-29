"use client"

import Link from "next/link"

import { LanguageToggle } from "@/components/language-toggle"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { CLAIM } from "@/lib/i18n/strings/claim"

/**
 * The funnel's only chrome: a mark, a language, and one quiet way out for a
 * living owner.
 *
 * No navigation, no sign-in, no app banner. The board is explicit — *"no tabs,
 * no vault chrome, no biometrics — nothing to install, nothing to remember"* —
 * and *"no app-install interstitial anywhere in this funnel"*. Someone arriving
 * here is not a prospect.
 *
 * A Client Component, and it has to be: the two step screens are client trees
 * and render this through `ClaimStepper`, so an async server version could not
 * be mounted from them at all. `useLocale()` reads what the root layout already
 * resolved, so there is no second cookie read and no flash.
 */
export function ClaimBrand() {
  const labels = t(CLAIM, useLocale())

  return (
    <header className="mx-auto flex max-w-5xl items-center gap-3 px-5 pt-6 md:px-8">
      {/* The Arabic initial stays Arabic in both languages: it is the mark,
          not a letter being read. */}
      <span
        aria-hidden
        className="bg-terracotta-200 text-terracotta-700 flex size-9 items-center justify-center rounded-full text-[19px] font-black"
      >
        و
      </span>
      <span className="text-[17px] font-bold">{labels.brand}</span>

      <div className="ms-auto flex items-center gap-4">
        <LanguageToggle />
        <Link
          href="/"
          className="text-sand-600 hover:text-terracotta-700 text-[13.5px]"
        >
          {labels.myAccount}
        </Link>
      </div>
    </header>
  )
}
