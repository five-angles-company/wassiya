"use client"

import { useState } from "react"
import { api } from "@workspace/backend/api"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@workspace/ui/components/table"
import { useQuery } from "convex/react"
import { ShieldCheckIcon } from "lucide-react"

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
    return <div className="bg-card rounded-sheet h-72 animate-pulse" aria-hidden />
  }

  if (rows.length === 0 && index === 0) {
    return (
      <section className="bg-card rounded-sheet border-border border p-6 shadow-[var(--shadow-raised)]">
        <h2 className="font-heading mb-3 flex items-center gap-2.5 text-[17px] font-extrabold">
          <ShieldCheckIcon className="size-[18px]" strokeWidth={2.4} aria-hidden />
          {labels.vaultsTitle}
        </h2>
        <p className="text-muted-foreground text-[14px] leading-[1.7]">
          {labels.vaultsEmpty}
        </p>
      </section>
    )
  }

  const first = index * PAGE + 1
  const last = index * PAGE + rows.length

  return (
    <section className="bg-card rounded-sheet border-border overflow-hidden border shadow-[var(--shadow-raised)]">
      <div className="flex items-center gap-2.5 px-5 pt-5 pb-4">
        <ShieldCheckIcon className="size-[18px] shrink-0" strokeWidth={2.4} aria-hidden />
        <h2 className="font-heading text-[17px] font-extrabold">
          {labels.vaultsTitle}
        </h2>
      </div>

      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            <TableHead className="ps-5 text-start">{labels.colVault}</TableHead>
            <TableHead className="pe-5 text-end">{labels.relation}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((vault) => {
            const name = vault.subjectName ?? "—"
            return (
              <TableRow key={vault.guardianId}>
                <TableCell className="ps-5">
                  <span className="flex items-center gap-3">
                    <span
                      aria-hidden
                      className="bg-background text-muted-foreground font-heading grid size-9 shrink-0 place-items-center rounded-full text-[14px] font-extrabold"
                    >
                      {name.slice(0, 1)}
                    </span>
                    <span className="truncate text-[14.5px] font-semibold">
                      {name}
                    </span>
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground pe-5 text-end text-[13.5px]">
                  {vault.relation}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>

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
    </section>
  )
}
