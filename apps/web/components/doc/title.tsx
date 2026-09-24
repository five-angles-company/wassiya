import type { CSSProperties, ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

import { Eyebrow } from "@/components/eyebrow"

/**
 * The page's own heading: an optional eyebrow, the title, a lead paragraph and
 * a quiet line of provenance.
 *
 * - The eyebrow sits **above** the title and carries only what changes whether
 *   somebody starts ("about ten minutes"); `meta` is provenance (who filed,
 *   when) and is read after the title or not at all.
 * - There is no status badge beside the title. Status is a sentence
 *   (`StatusBanner`, `StatusLine`), never a chip.
 * - The brand gradient is never used on words about death or loss.
 */
export function DocTitle({
  title,
  meta,
  eyebrow,
  eyebrowIcon,
  lead,
}: {
  title: string
  meta?: ReactNode
  eyebrow?: string
  eyebrowIcon?: LucideIcon
  lead?: ReactNode
}) {
  const delay = (ms: number) => ({ "--rise-delay": `${ms}ms` }) as CSSProperties

  return (
    <header className="flex flex-col items-start">
      {eyebrow !== undefined && (
        <Eyebrow icon={eyebrowIcon} className="rise">
          {eyebrow}
        </Eyebrow>
      )}
      <h1
        className={`font-heading rise text-[32px] leading-[1.3] font-black text-balance md:text-[44px] md:leading-[1.2] ${
          eyebrow !== undefined ? "mt-5" : ""
        }`}
        style={delay(60)}
      >
        {title}
      </h1>
      {lead !== undefined && (
        <div className="rise text-foreground/75 mt-4 max-w-[62ch] space-y-3 text-[17px] leading-[1.9]" style={delay(120)}>
          {lead}
        </div>
      )}
      {meta !== undefined && (
        <p className="rise text-muted-foreground mt-3 text-[13.5px]" style={delay(160)}>
          {meta}
        </p>
      )}
    </header>
  )
}
