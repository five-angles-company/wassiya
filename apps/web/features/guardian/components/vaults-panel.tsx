"use client"

import { api } from "@workspace/backend/api"
import { usePaginatedQuery } from "convex/react"

import { Button } from "@/components/button"
import { Section } from "@/components/section"
import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

const PAGE = 8

/**
 * The vaults this person guards.
 *
 * ## Not a panel
 *
 * It was a bordered, shadowed card holding a list, with a footer strip carrying
 * a count and a button. A list is not an object — the rows are, and they have
 * their own hairlines — so the box was drawing a second frame around a thing
 * that already had structure, and the footer was the fussiest element on the
 * screen. A label, the rows, and a link is the whole of it.
 *
 * ## Why it pages
 *
 * It rendered every row at once, and a guardian with fifteen vaults got a wall
 * of names below — and on a laptop *instead of* — the one thing actually asking
 * for them. Eight is about where a list stops being scannable, and comfortably
 * above the one or two most guardians will ever have.
 *
 * `guardianForPage` is a separate backend function rather than a flag on
 * `guardianFor`, because the nav, the home count and the key page each need the
 * whole list at once and none of them can unwrap a page. It also has no window
 * to fall out of: the unpaginated one caps at 50.
 *
 * ## The count is what is loaded, and the label says so
 *
 * `usePaginatedQuery` knows how many rows it has fetched, not how many exist.
 * A total would need a second query, and a figure that quietly meant "the first
 * page" is the kind of thing that stays wrong for years — so it sits beside the
 * label, dimmed, next to a button that says there is more.
 */
export function VaultsPanel() {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const { results, status, loadMore } = usePaginatedQuery(
    api.guardians.guardianForPage,
    {},
    { initialNumItems: PAGE }
  )

  if (status === "LoadingFirstPage") {
    return (
      <Section title={labels.vaultsTitle}>
        <div className="bg-card h-40 animate-pulse rounded-[20px]" aria-hidden />
      </Section>
    )
  }

  if (results.length === 0) {
    return (
      <Section title={labels.vaultsTitle}>
        <p className="text-muted-foreground text-[14px] leading-[1.7]">
          {labels.vaultsEmpty}
        </p>
      </Section>
    )
  }

  return (
    <Section
      title={labels.vaultsTitle}
      count={fmtNumber(results.length, locale)}
      action={
        status === "CanLoadMore" ? (
          <Button variant="ghost" size="sm" onClick={() => loadMore(PAGE)}>
            {labels.vaultsMore}
          </Button>
        ) : undefined
      }
    >
      <ul className="flex flex-col">
        {results.map((vault, index) => {
          const name = vault.subjectName ?? "—"
          return (
            <li
              key={vault.guardianId}
              className={`flex items-center gap-3.5 py-3 ${
                index === 0 ? "" : "border-border border-t"
              }`}
            >
              <span
                aria-hidden
                className="bg-card text-muted-foreground font-heading grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-extrabold"
              >
                {name.slice(0, 1)}
              </span>
              <span className="min-w-0 flex-1 truncate text-[14.5px] font-semibold">
                {name}
              </span>
              <span className="text-muted-foreground shrink-0 text-[13px]">
                {vault.relation}
              </span>
            </li>
          )
        })}
      </ul>
    </Section>
  )
}
