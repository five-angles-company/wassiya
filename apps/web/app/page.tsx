import type { Metadata } from "next"
import Link from "next/link"
import { ArrowLeftIcon } from "lucide-react"

import { Band } from "@/components/shell/band"
import { SiteShell } from "@/components/shell/site-shell"
import { t } from "@/lib/i18n/locale"
import { getLocale } from "@/lib/i18n/server"
import { HOME } from "@/lib/i18n/strings/common"

export async function generateMetadata(): Promise<Metadata> {
  const labels = t(HOME, await getLocale())
  return { title: labels.metaTitle, description: labels.metaDescription }
}

/**
 * `/` — the front door.
 *
 * ## What changed, and why the palette did not
 *
 * The colours were never the problem; the *distribution* was. Cream everywhere
 * with terracotta rationed out to thumb-sized buttons reads as timid however
 * good the hex values are. The same tokens used as whole fields — a terracotta
 * hero, an olive band of reassurance, ink at the close — read as confident.
 * Nothing here is a new colour.
 *
 * ## Two questions, still
 *
 * An owner is told to leave: they are mobile-only on purpose, because MK, the
 * biometric gate and the check-in need a hardware keystore a browser does not
 * have. And the guardian's path is drawn as an equal, not a footnote — someone
 * arriving from an emailed invitation is not a lesser visitor than a bereaved
 * relative.
 */
export default async function Page() {
  const labels = t(HOME, await getLocale())

  return (
    <SiteShell bleed>
      {/* The one loud thing on the page. Everything after it is quieter, which
          is what stops the loudness reading as noise. */}
      <Band tone="primary" size="tall">
        <div className="flex flex-col items-start gap-7">
          <h1
            className="rise max-w-[15ch] text-[clamp(36px,8vw,72px)] leading-[1.08]"
            style={{ "--rise-delay": "60ms" } as React.CSSProperties}
          >
            {labels.heroTitle}
          </h1>
          <p
            className="rise max-w-[46ch] text-[17px] leading-[1.75] opacity-90 md:text-[19px]"
            style={{ "--rise-delay": "180ms" } as React.CSSProperties}
          >
            {labels.heroBody}
          </p>
          <div
            className="rise flex flex-wrap gap-3"
            style={{ "--rise-delay": "300ms" } as React.CSSProperties}
          >
            <Link
              href="/claim"
              className="group bg-background text-foreground hover:bg-card lift inline-flex items-center gap-2.5 rounded-full px-7 py-4 text-[16px] font-bold"
            >
              {labels.claimAction}
              <ArrowLeftIcon
                className="nudge size-4.5 ltr:rotate-180"
                aria-hidden
              />
            </Link>
            <Link
              href="/claim/guardian"
              className="hover:bg-primary-foreground/12 inline-flex items-center rounded-full border-2 border-[color:var(--primary-foreground)]/45 px-7 py-4 text-[16px] font-bold transition-colors"
            >
              {labels.guardianAction}
            </Link>
          </div>
        </div>
      </Band>

      {/* The two readers, as equals. */}
      <Band tone="page">
        <div className="grid gap-5 md:grid-cols-2">
          <Link
            href="/claim"
            className="group bg-card rounded-sheet lift shadow-raised rise-in flex flex-col gap-4 p-8"
          >
            <h2 className="text-[26px] leading-[1.15]">{labels.claimTitle}</h2>
            <p className="text-sand-700 text-[15px] leading-[1.75]">
              {labels.claimBody}
            </p>
            <span className="text-terracotta-700 mt-2 inline-flex items-center gap-2 text-[15px] font-bold">
              {labels.claimAction}
              <ArrowLeftIcon className="nudge size-4 ltr:rotate-180" aria-hidden />
            </span>
          </Link>

          <Link
            href="/claim/guardian"
            className="group rounded-sheet lift rise-in border-border flex flex-col gap-4 border-2 p-8"
          >
            <h2 className="text-[26px] leading-[1.15]">
              {labels.guardianTitle}
            </h2>
            <p className="text-sand-700 text-[15px] leading-[1.75]">
              {labels.guardianBody}
            </p>
            <span className="text-terracotta-700 mt-2 inline-flex items-center gap-2 text-[15px] font-bold">
              {labels.guardianAction}
              <ArrowLeftIcon className="nudge size-4 ltr:rotate-180" aria-hidden />
            </span>
          </Link>
        </div>
      </Band>

      {/* Olive, because in this product olive already means "settled". */}
      <Band tone="olive" size="tall">
        <div className="rise-in flex flex-col gap-8">
          <h2 className="max-w-[18ch] text-[clamp(28px,5vw,46px)] leading-[1.15]">
            {labels.sealedTitle}
          </h2>
          <div className="grid gap-8 sm:grid-cols-3">
            <Fact value={labels.factKeyValue} label={labels.factKeyLabel} />
            <Fact value={labels.factHoldValue} label={labels.factHoldLabel} />
            <Fact value={labels.factHalvesValue} label={labels.factHalvesLabel} />
          </div>
          <Link
            href="/legal/encryption"
            className="group bg-secondary-foreground text-secondary lift inline-flex items-center gap-2.5 self-start rounded-full px-6 py-3.5 text-[15px] font-bold"
          >
            {labels.sealedMore}
            <ArrowLeftIcon className="nudge size-4 ltr:rotate-180" aria-hidden />
          </Link>
        </div>
      </Band>

      {/* The owner, told plainly there is nothing here for them. */}
      <Band tone="ink" size="tight">
        <div className="flex flex-col gap-2">
          <h2 className="text-[20px] leading-[1.3]">{labels.ownerTitle}</h2>
          <p className="max-w-[62ch] text-[15px] leading-[1.75] opacity-75">
            {labels.ownerBody}
          </p>
        </div>
      </Band>
    </SiteShell>
  )
}

/**
 * One number-shaped claim.
 *
 * The value is set at display size because these are the three facts that
 * decide whether someone believes the product, and a fact set in body copy is
 * a fact nobody read.
 */
function Fact({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-[22px] leading-[1.25] font-bold">{value}</span>
      <span className="text-[14px] leading-[1.65] opacity-80">{label}</span>
    </div>
  )
}
