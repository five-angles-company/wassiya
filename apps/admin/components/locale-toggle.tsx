"use client"

import { useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { LanguagesIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import {
  resolveLocale,
  t,
  writeLocaleCookie,
  type Locale,
} from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * The language switch: an icon in the top bar, a menu to pick from.
 *
 * Writing the cookie and calling `router.refresh()` is the whole mechanism. The
 * refresh re-runs the root layout on the server, which re-reads the cookie and
 * emits the new `dir`, `lang` and font stack. Nothing here touches
 * `document.documentElement` directly — that would move the source of truth to
 * the client and reintroduce exactly the mismatch the cookie exists to prevent.
 *
 * Each option is labelled in **its own** language — العربية stays العربية when
 * the console is in English. A language picker that translates its own options
 * is unreadable to the person most likely to need it: someone who cannot read
 * the language currently on screen.
 *
 * `useTransition` keeps the old console up during the round trip instead of
 * blanking it, which matters because the refresh re-renders every page.
 */
export function LocaleToggle() {
  const locale = useLocale()
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const labels = t(COMMON, locale)

  function choose(value: string) {
    const next: Locale = resolveLocale(value)
    if (next === locale) return
    writeLocaleCookie(next)
    startTransition(() => router.refresh())
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          size="icon-sm"
          variant="ghost"
          disabled={pending}
          aria-label={labels.language}
          title={labels.language}
        >
          <LanguagesIcon />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-36">
        <DropdownMenuRadioGroup value={locale} onValueChange={choose}>
          {/* `dir` per item, not per menu: each label is written in its own
              script, so the Arabic one needs RTL even while the console is in
              English, and vice versa. */}
          <DropdownMenuRadioItem value="ar" dir="rtl">
            {labels.arabic}
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value="en" dir="ltr">
            {labels.english}
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
