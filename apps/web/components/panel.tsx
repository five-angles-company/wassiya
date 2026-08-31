import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * An object on the page: something to act on, or a state that has happened.
 *
 * ## One surface, everywhere
 *
 * There were three: sand `#ebddc5` for ordinary content, a peach `#ffe1d0` for
 * the thing being asked for, and olive for a completed state. Three card
 * colours on one screen is three claims on the reader's attention, and a page
 * that alternates between them reads as loud however carefully each block is
 * set. Every card in this app is now `--card`, `#ebddc5`.
 *
 * ## So emphasis moved to the mark
 *
 * `accent` tints the heading's icon and nothing else — terracotta for the one
 * thing a screen is asking for, olive for something finished. A 18px glyph is
 * enough to carry that: the reader is scanning for *which* block, and colour
 * over a whole surface answers a question they were not asking.
 *
 * It also means a screen can hold four blocks without shouting, which the
 * three-fill system could not.
 *
 * ## Why the shadow is not decoration
 *
 * The Organic ground and its surface are four percent of lightness apart. That
 * is the mechanical reason a flat fill here reads as a discoloured patch rather
 * than as a card, and why `--shadow-raised` is load-bearing. Deep brown rather
 * than black, so it stays in the ink's family.
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
