"use client"

import { api } from "@workspace/backend/api"
import { usePaginatedQuery } from "convex/react"
import { ShieldCheckIcon } from "lucide-react"

import { Button } from "@/components/button"
import { Panel } from "@/components/panel"
import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

const PAGE = 8

/**
 * The vaults this person guards.
 *
 * ## Why it pages
 *
 * It rendered every row at once, and a guardian with fifteen vaults got a wall
 * of names below — and, on a laptop, *instead of* — the one thing actually
 * asking for them. Eight rows is about where the list stops being scannable,
 * and it is comfortably above the one or two most guardians will ever have.
 *
 * `guardianForPage` is a separate backend function rather than a flag on
 * `guardianFor`, because the nav, the home count and the key page all need the
 * whole list at once and none of them can unwrap a page. It also has no window
 * to fall out of: the unpaginated one caps at 50.
 *
 * ## The count is the loaded count, and says so
 *
 * `usePaginatedQuery` knows how many rows it has fetched, not how many exist —
 * so the heading counts what is on screen and the button says there is more.
 * A total would need a second query, and a number that silently meant
 * "the first fifty" is the kind of thing that is wrong for years.
 */
export function VaultsPanel() {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const { results, status, loadMore } = usePaginatedQuery(
    api.guardians.guardianForPage,
    {},
    { initialNumItems: PAGE }
  )

  return (
    <Panel icon={ShieldCheckIcon} title={labels.vaultsTitle}>
      {status === "LoadingFirstPage" ? (
        <div className="bg-background h-32 animate-pulse rounded-[18px]" aria-hidden />
      ) : results.length === 0 ? (
        <p className="text-muted-foreground text-[14px] leading-[1.7]">
          {labels.vaultsEmpty}
        </p>
      ) : (
        <>
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
                    className="bg-background text-muted-foreground font-heading grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-extrabold"
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

          <div className="border-border mt-4 flex flex-wrap items-center gap-4 border-t pt-4">
            <p className="text-muted-foreground text-[13px]">
              {labels.vaultsShown.replace(
                "{n}",
                fmtNumber(results.length, locale)
              )}
            </p>
            {status === "CanLoadMore" && (
              <Button
                variant="outline"
                size="sm"
                className="ms-auto"
                onClick={() => loadMore(PAGE)}
              >
                {labels.vaultsMore}
              </Button>
            )}
          </div>
        </>
      )}
    </Panel>
  )
}
