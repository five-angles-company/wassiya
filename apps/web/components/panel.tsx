import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * An object on the page: something to act on, or a state that has happened.
 *
 * **One surface, everywhere — every card in this app is `--card`, `#ebddc5`.**
 * There were three (sand, a peach for the thing being asked for, olive for a
 * completed state), and three card colours on one screen is three claims on the
 * reader's attention.
 *
 * So emphasis moved to the mark: `accent` tints the heading's icon and nothing
 * else — terracotta for the one thing a screen asks for, olive for something
 * finished. An 18px glyph carries that, and it lets a screen hold four blocks
 * without shouting, which the three-fill system could not.
 *
 * The shadow is not decoration. The Organic ground and its surface are four
 * percent of lightness apart, which is the mechanical reason a flat fill reads
 * as a discoloured patch rather than a card. `--shadow-raised` is deep brown
 * rather than black, so it stays in the ink's family.
 */
export function Panel({
  title,
  icon: Icon,
  accent,
  children,
}: {
  title?: string
  icon?: LucideIcon
  /** Tints the heading icon only. The surface never changes. */
  accent?: "primary" | "secondary"
  children: ReactNode
}) {
  return (
    <section className="bg-card border-border rounded-sheet border p-6 shadow-[var(--shadow-raised)] md:p-7">
      {title !== undefined && (
        <h2 className="font-heading mb-3 flex items-center gap-2.5 text-[17px] font-extrabold">
          {Icon !== undefined && (
            <Icon
              className={`size-[18px] shrink-0 ${
                accent === "primary"
                  ? "text-primary"
                  : accent === "secondary"
                    ? "text-secondary"
                    : "text-muted-foreground"
              }`}
              strokeWidth={2.4}
              aria-hidden
            />
          )}
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}
