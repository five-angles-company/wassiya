"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"

import { Paper } from "@/components/doc/paper"
import { DocSection } from "@/components/doc/section"
import { Pager } from "@/components/pager"
import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

const PAGE = 8

/**
 * The vaults this person guards, as a table that never grows.
 *
 * Next and previous rather than "load more": `usePaginatedQuery` only appends,
 * so every click makes the page taller and pushes the duty card — the thing the
 * reader came for — further off screen. Cursors go both ways; only the helper is
 * one-directional. So this holds the cursor for every page visited plus a
 * position in that stack, and asks `guardianForPage` for one page at a time.
 *
 * The previous page's rows are held while the next loads. A new cursor is a new
 * query, so `useQuery` returns `undefined` for a beat, and without this the rows
 * — and then the whole card — would collapse and reflow.
 */
export function VaultsPanel() {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)

  // One cursor per page visited. `null` is the first page — Convex's own
  // spelling for "start at the beginning".
  const [cursors, setCursors] = useState<(string | null)[]>([null])
  const [index, setIndex] = useState(0)
  const cursor = cursors[index] ?? null
  const [kept, setKept] = useState<{
    cursor: string | null
    rows: { guardianId: string; subjectName: string | null; relation: string }[]
  }>({ cursor: null, rows: [] })

  const result = useQuery(api.guardians.guardianForPage, {
    paginationOpts: { numItems: PAGE, cursor },
  })

  // Hold the previous page's rows while the next one loads, so the card keeps
  // its height instead of collapsing to a spinner and reflowing.
  //
  // The guard is the **cursor**, not the rows. A new cursor is a new query, so
  // `useQuery` returns `undefined` for a beat; comparing the arrays by identity
  // instead would depend on Convex handing back a stable reference, and a
  // render-phase `setState` that is wrong about that loops forever. A string
  // comparison cannot be wrong.
  if (result !== undefined && kept.cursor !== cursor) {
    setKept({ cursor, rows: result.page })
  }
  const rows = result?.page ?? kept.rows

  if (result === undefined && kept.rows.length === 0) {
    return (
      <div className="border-border h-60 animate-pulse border-t" aria-hidden />
    )
  }

  if (rows.length === 0 && index === 0) {
    return (
      <DocSection title={labels.vaultsTitle}>
        <p className="text-muted-foreground text-[14.5px] leading-[1.7]">
          {labels.vaultsEmpty}
        </p>
      </DocSection>
    )
  }

  const first = index * PAGE + 1
  const last = index * PAGE + rows.length

  return (
    <DocSection title={labels.vaultsTitle}>
      {/* Rows, not a table. Two columns of which one is a name and the other a
          word does not need a header, and at phone width a table either scrolls
          sideways or crushes the name it exists to show. */}
      <Paper>
        <dl className="divide-border divide-y">
          {rows.map((vault) => (
            <div
              key={vault.guardianId}
              className="flex items-baseline justify-between gap-4 px-5 py-3.5"
            >
              <dt className="truncate text-[15px] font-semibold">
                {vault.subjectName ?? "—"}
              </dt>
              <dd className="text-muted-foreground shrink-0 text-[13px]">
                {vault.relation}
              </dd>
            </div>
          ))}
        </dl>
      </Paper>

      <Pager
        from={fmtNumber(first, locale)}
        to={fmtNumber(last, locale)}
        hasPrevious={index > 0}
        hasNext={result !== undefined && !result.isDone}
        onPrevious={() => setIndex((current) => Math.max(0, current - 1))}
        onNext={() => {
          if (result === undefined || result.isDone) return
          setCursors((current) => {
            const next = current.slice(0, index + 1)
            next.push(result.continueCursor)
            return next
          })
          setIndex((current) => current + 1)
        }}
      />
    </DocSection>
  )
}
