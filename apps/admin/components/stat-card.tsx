import Link from "next/link"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowLeftIcon, type LucideIcon } from "lucide-react"

/**
 * One number in a card: icon, label, figure.
 *
 * Deliberately short. There were once eleven of these carrying a full sentence
 * each, which put a wall of text between the top of the page and its first real
 * row. Four remain and the sentence moved to `title`, so it is a hover away and
 * costs no height — the number genuinely does not say what it means without it.
 *
 * `footer` is for a second *fact* (the next release date), never a second
 * sentence.
 *
 * ## `href` is the whole card, and it is optional on purpose
 *
 * A number with a screen behind it links to that screen **already filtered to
 * the rows it counts** — `/checkins?state=day7,day14,countdown` is the
 * escalation tile, exactly. That is what the search-param work bought: before
 * it, the destination existed but could not be pointed at, so the console kept
 * announcing totals nobody could open.
 *
 * A card with no such destination stays unlinked rather than getting a link to
 * an unfiltered list. Landing on a table whose row count does not match the
 * number that was clicked is worse than no link — it reads as a broken filter
 * rather than as a missing screen.
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  footer,
  href,
  emphasis = false,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  footer?: string
  /** A screen filtered to exactly these rows, or nothing. */
  href?: string
  emphasis?: boolean
}) {
  const body = (
    <CardContent className="flex flex-col gap-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5 shrink-0" />
        <span className="truncate">{label}</span>
        {/* Points along the reading direction — flipped for LTR, since the
            console is Arabic-first. */}
        {href !== undefined && (
          <ArrowLeftIcon className="ms-auto size-3.5 shrink-0 opacity-0 transition-opacity ltr:rotate-180 group-hover:opacity-100" />
        )}
      </div>
      <span className="font-heading text-2xl leading-none tabular-nums">
        {value}
      </span>
      {footer !== undefined && (
        <p className="text-xs text-muted-foreground">{footer}</p>
      )}
    </CardContent>
  )

  const card = (
    <Card
      size="sm"
      title={hint}
      className={cn(
        "group gap-0",
        // A card only draws attention when its number is non-zero. A row where
        // every card has an accent border has no accent at all.
        emphasis && "border-primary/50",
        href !== undefined && "transition-colors hover:border-primary"
      )}
    >
      {body}
    </Card>
  )

  if (href === undefined) return card

  return (
    <Link href={href} className="rounded-xl focus-visible:ring-[3px]">
      {card}
    </Link>
  )
}
