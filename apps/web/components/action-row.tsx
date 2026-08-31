import type { ReactNode } from "react"
import Link from "next/link"
import { ChevronLeftIcon, type LucideIcon } from "lucide-react"

/**
 * One thing you can go and do: an icon, a title, a sentence, a chevron.
 *
 * The app's main repeated element. Four screens list things — what needs you,
 * your reports, your ready boxes, the vaults you guard — and they are all the
 * same shape, so they are all this component. A list that changes proportions
 * between screens reads as four half-finished products.
 *
 * `tone` says whether the row is asking for something. `now` gives it the
 * terracotta accent ground; everything else sits on the card tone. At most one
 * kind of row per screen should be `now`, or the accent stops meaning anything.
 *
 * The chevron points along the reading direction — `rtl:` is the exception here
 * because Arabic is the default, so the LTR case is the one that rotates.
 */
export function ActionRow({
  href,
  icon: Icon,
  title,
  body,
  meta,
  tone = "quiet",
}: {
  href: string
  icon: LucideIcon
  title: string
  body?: string
  /** A pill, a date — anything that belongs on the row's far side. */
  meta?: ReactNode
  tone?: "now" | "quiet"
}) {
  return (
    <Link
      href={href}
      className={`group lift rounded-card flex items-start gap-4 p-4 transition-colors md:p-5 ${
        tone === "now"
          ? "bg-accent text-accent-foreground hover:bg-terracotta-200"
          : "bg-card hover:bg-sand-200"
      }`}
    >
      <span
        aria-hidden
        className={`grid size-9 shrink-0 place-items-center rounded-full ${
          tone === "now"
            ? "bg-primary text-primary-foreground"
            : "bg-background text-muted-foreground"
        }`}
      >
        <Icon className="size-[17px]" strokeWidth={2.3} />
      </span>

      <div className="min-w-0 flex-1">
        <div className="font-heading text-[16px] font-extrabold">{title}</div>
        {body !== undefined && (
          <p
            className={`mt-1.5 text-[14px] leading-[1.65] ${
              tone === "now" ? "opacity-80" : "text-muted-foreground"
            }`}
          >
            {body}
          </p>
        )}
      </div>

      {meta !== undefined && <div className="shrink-0">{meta}</div>}

      <ChevronLeftIcon
        aria-hidden
        className="nudge mt-2.5 size-4 shrink-0 opacity-40 ltr:rotate-180"
        strokeWidth={2.6}
      />
    </Link>
  )
}
