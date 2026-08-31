"use client"

import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"

import { Button } from "@/components/button"
import { useLocale } from "@/components/locale-provider"
import { t } from "@/lib/i18n/locale"
import { COMMON } from "@/lib/i18n/strings/common"

/**
 * Next and previous, for a table that must not grow.
 *
 * ## Why not "load more"
 *
 * `usePaginatedQuery` only ever appends, so the page gets taller with every
 * click and the thing the reader came for slides further off the screen. On a
 * list that sits *below* the one item asking for attention, that is exactly
 * backwards. Cursors go both ways; only the helper was one-directional.
 *
 * So the caller holds a stack of cursors and a position in it, and this renders
 * the two ends of it. The table replaces its rows rather than accumulating
 * them, and the page is the same height on page five as on page one.
 *
 * ## The chevrons follow the reading direction
 *
 * "Next" points the way the eye travels — left in Arabic, right in English —
 * so the icons swap with the locale rather than being mirrored by a transform.
 * A transform would also flip the chevron's optical weight, and these are small
 * enough that it shows.
 */
export function Pager({
  from,
  to,
  hasPrevious,
  hasNext,
  onPrevious,
  onNext,
}: {
  /** 1-based position of the first row on screen, already localised. */
  from: string
  to: string
  hasPrevious: boolean
  hasNext: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  const locale = useLocale()
  const labels = t(COMMON, locale)
  const Back = locale === "ar" ? ChevronRightIcon : ChevronLeftIcon
  const Forward = locale === "ar" ? ChevronLeftIcon : ChevronRightIcon

  return (
    <div className="border-border flex items-center gap-3 border-t px-5 py-3.5">
      <p className="text-muted-foreground text-[13px] tabular-nums">
        {labels.range.replace("{from}", from).replace("{to}", to)}
      </p>

      <div className="ms-auto flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={onPrevious}
          disabled={!hasPrevious}
          aria-label={labels.previous}
        >
          <Back className="size-4" strokeWidth={2.6} aria-hidden />
          {labels.previous}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onNext}
          disabled={!hasNext}
          aria-label={labels.next}
        >
          {labels.next}
          <Forward className="size-4" strokeWidth={2.6} aria-hidden />
        </Button>
      </div>
    </div>
  )
}
