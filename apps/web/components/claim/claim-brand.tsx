import Link from "next/link"

import { CLAIM } from "@/lib/claim-copy"

/**
 * The funnel's only chrome: a mark, and one quiet way out for a living owner.
 *
 * No navigation, no sign-in, no app banner. The board is explicit — *"no tabs,
 * no vault chrome, no biometrics — nothing to install, nothing to remember"* —
 * and *"no app-install interstitial anywhere in this funnel"*. Someone arriving
 * here is not a prospect.
 */
export function ClaimBrand() {
  return (
    <header className="mx-auto flex max-w-5xl items-center gap-3 px-5 pt-6 md:px-8">
      <span
        aria-hidden
        className="bg-terracotta-200 text-terracotta-700 flex size-9 items-center justify-center rounded-full text-[19px] font-black"
      >
        و
      </span>
      <span className="text-[17px] font-bold">{CLAIM.brand}</span>
      <Link
        href="/"
        className="text-sand-600 hover:text-terracotta-700 ms-auto text-[13.5px]"
      >
        {CLAIM.myAccount}
      </Link>
    </header>
  )
}
