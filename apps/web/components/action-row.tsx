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
 * `tone` says whether the row is asking for something, and it tints the
 * **mark** — every card in this app is `--card`, so a row that painted its
 * whole surface terracotta was a third card colour competing with the two that
 * already existed. At most one kind of row per screen should be `now`, or the
 * accent stops meaning anything wherever it lands.
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
      className="group lift bg-card border-border rounded-card hover:bg-sand-200 flex items-start gap-4 border p-4 shadow-[var(--shadow-raised)] transition-colors md:p-5"
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
        <div className="font-heading text-[15.5px] font-extrabold">{title}</div>
        {body !== undefined && (
          <p className="text-muted-foreground mt-1.5 text-[14px] leading-[1.65]">
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
