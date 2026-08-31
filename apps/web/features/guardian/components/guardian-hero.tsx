"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import { ShieldCheckIcon } from "lucide-react"

import { useLocale } from "@/components/locale-provider"
import { fmtNumber } from "@/lib/format"
import { t } from "@/lib/i18n/locale"
import { GUARDIAN_DUTIES } from "@/features/guardian/strings/guardian-duties"

/**
 * The top of the guardian's screen.
 *
 * ## Why it is not `PageHeader`
 *
 * It was — a title and one grey sentence, the same block every other screen
 * gets. That is right for a list you visit weekly and wrong here: this reader
 * may not have opened the app since they accepted, and the first thing they
 * need is *standing*. Who they are to this product, how many vaults depend on
 * them, and whether anything is waiting.
 *
 * So the two figures come up into the hero, where they answer the question the
 * reader arrived with before they have read a word of prose. `pendingApprovals`
 * and `guardianFor` are both already in flight for the bar, so the numbers cost
 * nothing.
 *
 * ## The mark is olive, and that is the whole visual argument
 *
 * Olive means settled and safe everywhere else in this product — a completed
 * step, a released box. A guardian is not being asked to hurry, and a screen
 * that opened in terracotta would say the opposite before any copy loaded. The
 * one thing allowed to be terracotta here is the count of things that need
 * them, and only when it is not zero.
 */
export function GuardianHero() {
  const locale = useLocale()
  const labels = t(GUARDIAN_DUTIES, locale)
  const duties = useQuery(api.guardians.pendingApprovals, {})
  const vaults = useQuery(api.guardians.guardianFor, {})

  const asks = duties?.length ?? 0

  return (
    <header className="bg-card rounded-sheet border-border relative overflow-hidden border p-6 shadow-[var(--shadow-raised)] md:p-8">
      {/* A single wash of olive behind the mark. It is the only decoration in
          the app and it earns its place by making the guardian's screen
          recognisably *not* the heir's at a glance. */}
      <span
        aria-hidden
        className="bg-secondary/12 pointer-events-none absolute -top-24 -end-16 size-64 rounded-full blur-2xl"
      />

      <div className="relative flex flex-wrap items-start gap-5">
        <span
          aria-hidden
          className="bg-secondary text-secondary-foreground grid size-14 shrink-0 place-items-center rounded-full shadow-[var(--shadow-raised)]"
        >
          <ShieldCheckIcon className="size-6" strokeWidth={2.2} />
        </span>

        <div className="min-w-0 flex-1">
          <p className="text-olive-700 text-[13px] font-semibold">
            {labels.heroEyebrow}
          </p>
          <h1 className="font-heading mt-1.5 text-[26px] leading-tight font-extrabold md:text-[30px]">
            {labels.title}
          </h1>
          <p className="text-muted-foreground mt-3 max-w-[58ch] text-[14.5px] leading-[1.75]">
            {labels.body}
          </p>
        </div>
      </div>

      <dl className="border-border relative mt-6 grid grid-cols-2 gap-4 border-t pt-5 sm:max-w-md">
        <Figure
          label={labels.heroVaults}
          value={vaults === undefined ? "—" : fmtNumber(vaults.length, locale)}
        />
        <Figure
          label={labels.heroAsks}
          value={duties === undefined ? "—" : fmtNumber(asks, locale)}
          emphasis={asks > 0}
        />
      </dl>
    </header>
  )
}

/**
 * One figure.
 *
 * The number is set in the heading face at 26px and the label recedes to 13px
 * muted — a stat where the label and the figure share a weight is two things
 * competing rather than one being read.
 */
function Figure({
  label,
  value,
  emphasis = false,
}: {
  label: string
  value: string
  emphasis?: boolean
}) {
  return (
    <div>
      <dt className="text-muted-foreground text-[12.5px] font-semibold">
        {label}
      </dt>
      <dd
        className={`font-heading mt-1 text-[26px] leading-none font-black tabular-nums ${
          emphasis ? "text-primary" : ""
        }`}
      >
        {value}
      </dd>
    </div>
  )
}
