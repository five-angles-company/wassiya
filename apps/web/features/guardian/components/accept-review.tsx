"use client"

import { CheckIcon, XIcon } from "lucide-react"

import { Button, ButtonLink } from "@/components/button"
import { Prose } from "@/components/doc/prose"
import { Paper } from "@/components/doc/paper"
import { SetApart } from "@/components/doc/set-apart"
import { StatusLine } from "@/components/doc/status-line"
import { DocTitle } from "@/components/doc/title"
import { t } from "@/lib/i18n/locale"
import { useLocale } from "@/components/locale-provider"
import { COMMON } from "@/lib/i18n/strings/common"
import type { Resolved } from "@/lib/i18n/locale"
import type { GUARDIAN } from "@/features/guardian/strings/guardian"

/**
 * What you will do, beside what you will never be asked.
 *
 * The two lists are the screen's whole argument. A guardianship sounds like an
 * unbounded obligation until the second one bounds it — no liability, no
 * arbitration, no access to the vault, and no ability to start a release alone.
 * Reading the invitation without that list is what makes people decline.
 *
 * ## Shared tokens, and a structure of its own
 *
 * The head, the type scale and the decision block are the app's — `DocTitle`,
 * `StatusLine`, `Prose`, `SetApart` — so a guardian arriving from a case page
 * is not handed a different product.
 *
 * ⚠️ **The two lists stay side by side, and that is not a style choice.** They
 * are read *against* each other: the obligation sounds unbounded until the
 * second column bounds it. Stacked, the bounding half sits below the fold and
 * the page argues only one side of its own case. This is the one screen in the
 * product where the layout carries the meaning, so it keeps a grid nothing else
 * has — and collapses to one column on a phone, where side-by-side is not an
 * option anyway.
 *
 * The marks earn their place for the same reason: two lists of plain rows under
 * two headings read as one long list at a glance, which is exactly the glance
 * this page has to survive.
 *
 * ## One separator per job
 *
 * Each column is a sheet of `Paper` and nothing inside it is ruled. The lists
 * had a rule above and below, a line between every item, a mark on each row and
 * a coloured heading — four devices doing the work of one. The card boundary
 * separates the two sets from each other, the marks separate the rows, and the
 * hairlines are gone.
 */
export function AcceptReview({
  labels,
  ownerName,
  onAccept,
}: {
  labels: Resolved<typeof GUARDIAN>
  ownerName: string
  onAccept: () => void
}) {
  const common = t(COMMON, useLocale())

  const never = [
    labels.neverSee,
    labels.neverDivide,
    labels.neverPay,
    labels.neverStart,
  ]

  return (
    <article className="flex flex-col gap-11">
      <div className="flex flex-col gap-4">
        <DocTitle
          title={labels.titleOne.replace("{name}", ownerName)}
          meta={labels.eyebrow}
        />
        <StatusLine tone="settled">{labels.titleTwo}</StatusLine>
        <Prose>
          <p>{labels.lede}</p>
        </Prose>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        <Paper className="flex flex-col gap-4 p-6">
          <h2 className="text-tone-settled text-[12px] font-bold tracking-wide uppercase">
            {labels.willTitle}
          </h2>
          <dl className="flex flex-col gap-5">
            <Will title={labels.willConfirm} body={labels.willConfirmBody} />
            <Will title={labels.willHandover} body={labels.willHandoverBody} />
          </dl>
        </Paper>

        <Paper className="flex flex-col gap-4 p-6">
          <h2 className="text-tone-attention text-[12px] font-bold tracking-wide uppercase">
            {labels.neverTitle}
          </h2>
          <ul className="flex flex-col gap-3.5">
            {never.map((text) => (
              <li key={text} className="flex items-start gap-3">
                <XIcon
                  className="text-tone-attention mt-0.5 size-4 shrink-0"
                  strokeWidth={2.8}
                  aria-hidden
                />
                <span className="text-[15px] leading-[1.55]">{text}</span>
              </li>
            ))}
          </ul>
        </Paper>
      </div>

      {/* Two answers, two controls of the same kind.

          Declining is a real answer here, not a way out — the page's own note
          argues for it: declining today beats accepting and not being findable
          later. A plain link beside a solid button made it look like the
          escape hatch from the control rather than the other half of the
          question, so both are buttons and only the fill separates them.

          The note carries the whole row beneath, because it argues for the
          second button rather than describing either. */}
      <SetApart className="flex flex-col gap-5">
        <p className="text-surface-accent-ink text-[12px] font-bold tracking-wide uppercase">
          {common.askEyebrow}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="secondary" size="lg" onClick={onAccept}>
            {labels.accept}
          </Button>
          <ButtonLink href="/" variant="outline" size="lg">
            {labels.decline}
          </ButtonLink>
        </div>

        <p className="text-muted-foreground max-w-[66ch] text-[13.5px] leading-[1.6]">
          {labels.expiryNote}
        </p>
      </SetApart>
    </article>
  )
}

/** One duty: what it is, and what discharging it actually involves. */
function Will({ title, body }: { title: string; body: string }) {
  return (
    <div className="flex items-start gap-3">
      <CheckIcon
        className="text-tone-settled mt-0.5 size-4 shrink-0"
        strokeWidth={2.8}
        aria-hidden
      />
      <div className="min-w-0">
        <dt className="text-[15.5px] font-semibold">{title}</dt>
        <dd className="text-muted-foreground mt-1 text-[14px] leading-[1.65]">
          {body}
        </dd>
      </div>
    </div>
  )
}
