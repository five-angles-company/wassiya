import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * An object on the page: something to act on, or a state that has happened.
 *
 * ## A border means something now
 *
 * There were four tones and ten of the thirty uses were `plain` — a note, a
 * caveat, a list, a second fact, each in a bordered box. Stacking three or four
 * of those is what made a page read as busy however carefully each one was set,
 * because the border stopped carrying any information: everything had one.
 *
 * So `plain` is gone and the quiet half of the system is `Section`, which has
 * no box at all. What is left here is genuinely object-shaped, and a border
 * around it now means what it says.
 *
 * ## The three tones mean the same thing on every screen
 *
 * `card` is a thing. `now` is the one thing the screen is asking for. `settled`
 * is a state that has completed. Nothing but `now` may carry the accent — a
 * screen with two terracotta panels has told the reader nothing about which one
 * to look at.
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
  tone = "card",
  children,
}: {
  title?: string
  icon?: LucideIcon
  tone?: "card" | "now" | "settled"
  children: ReactNode
}) {
  return (
    <section
      className={`rounded-sheet border p-6 shadow-[var(--shadow-raised)] md:p-7 ${
        tone === "now"
          ? "bg-accent text-accent-foreground border-terracotta-200"
          : tone === "settled"
            ? "bg-secondary text-secondary-foreground border-olive-600"
            : "bg-card border-border"
      }`}
    >
      {title !== undefined && (
        <h2 className="font-heading mb-3 flex items-center gap-2.5 text-[17px] font-extrabold">
          {Icon !== undefined && (
            <Icon
              className="size-[18px] shrink-0"
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
