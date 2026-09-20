import Link from "next/link"
import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import { ArrowLeftIcon, type LucideIcon } from "lucide-react"

/**
 * One number in a card: icon, label, figure. Deliberately short — there were
 * once eleven of these carrying a full sentence each, which put a wall of text
 * between the top of the page and its first real row. The sentence moved to
 * `title`, so it is a hover away and costs no height. `footer` is for a second
 * *fact* (the next release date), never a second sentence.
 *
 * ⚠️ **Both branches carry `h-full`, and the row falls apart without it.**
 * These sit in a grid, whose items stretch to the tallest in the row — but when
 * `href` is set the grid item is the `<Link>`, not the `Card` inside it. The
 * link stretched and the card kept its content height, so a linked tile came up
 * short against an unlinked one, and shorter still beside any tile carrying a
 * `footer`. One tile with a second fact was enough to leave the row ragged.
 *
 * **`href` is the whole card, and it is optional on purpose.** A number with a
 * screen behind it links to that screen already filtered to the rows it counts —
 * `/checkins?state=day7,day14,countdown` is the escalation tile exactly. A card
 * with no such destination stays unlinked rather than linking to an unfiltered
 * list: landing on a table whose row count does not match the number that was
 * clicked reads as a broken filter rather than a missing screen.
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
          <ArrowLeftIcon className="ms-auto size-3.5 shrink-0 opacity-0 transition-opacity group-hover:opacity-100 ltr:rotate-180" />
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
        "group h-full gap-0",
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
    <Link
      href={href}
      className="block h-full rounded-xl focus-visible:ring-[3px]"
    >
      {card}
    </Link>
  )
}
