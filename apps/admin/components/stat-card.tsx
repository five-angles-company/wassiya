import { Card, CardContent } from "@workspace/ui/components/card"
import { cn } from "@workspace/ui/lib/utils"
import type { LucideIcon } from "lucide-react"

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
 */
export function StatCard({
  label,
  value,
  hint,
  icon: Icon,
  footer,
  emphasis = false,
}: {
  label: string
  value: string
  hint?: string
  icon: LucideIcon
  footer?: string
  emphasis?: boolean
}) {
  return (
    <Card
      size="sm"
      title={hint}
      className={cn(
        "gap-0",
        // A card only draws attention when its number is non-zero. A row where
        // every card has an accent border has no accent at all.
        emphasis && "border-primary/50"
      )}
    >
      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Icon className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
        </div>
        <span className="font-heading text-2xl leading-none tabular-nums">
          {value}
        </span>
        {footer !== undefined && (
          <p className="text-xs text-muted-foreground">{footer}</p>
        )}
      </CardContent>
    </Card>
  )
}
