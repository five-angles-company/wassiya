import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * A titled block of content on a surface.
 *
 * ## The four tones mean the same thing on every screen
 *
 * `card` is ordinary content. `now` is the one thing the screen is asking for.
 * `settled` is a finished state. `plain` is an aside — a note, a caveat, a
 * second fact — and is the only one without a fill, which is what stops a
 * screen of five panels reading as five equal claims on the reader's
 * attention.
 *
 * Nothing but `now` may carry the accent. A screen with two terracotta panels
 * has told the reader nothing about which one to look at.
 *
 * ## It has depth now, and that was the inconsistency
 *
 * This shipped with no border and no shadow while every card written after it
 * carried `--shadow-raised` and a hairline — so the screens built later looked
 * like a different product from the ones built on `Panel`, which is most of
 * them: the claim detail, all four guardian screens, the account, the box.
 * Fixing the primitive fixes all of them at once, which is the entire argument
 * for having one.
 *
 * The Organic ground and its surface are four percent of lightness apart. That
 * is the mechanical reason a flat fill here reads as a discoloured patch rather
 * than as a card, and why the shadow is not decoration — it is what separates
 * the two. Deep brown rather than black, so it stays in the ink's family.
 */
export function Panel({
  title,
  icon: Icon,
  tone = "card",
  children,
}: {
  title?: string
  icon?: LucideIcon
  tone?: "card" | "now" | "settled" | "plain"
  children: ReactNode
}) {
  return (
    <section
      className={`rounded-sheet border p-6 md:p-7 ${
        tone === "now"
          ? "bg-accent text-accent-foreground border-terracotta-200 shadow-[var(--shadow-raised)]"
          : tone === "settled"
            ? "bg-secondary text-secondary-foreground border-olive-600 shadow-[var(--shadow-raised)]"
            : tone === "plain"
              ? "border-border"
              : "bg-card border-border shadow-[var(--shadow-raised)]"
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
