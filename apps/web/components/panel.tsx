import type { ReactNode } from "react"
import type { LucideIcon } from "lucide-react"

/**
 * A titled block of content on a surface.
 *
 * Three tones, and they mean the same thing everywhere in the app: `card` is
 * ordinary content, `now` is the one thing the screen is asking for, `settled`
 * is a finished state. Nothing else may carry the accent — a screen with two
 * terracotta panels has told the reader nothing about which one to look at.
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
      className={`rounded-card p-5 md:p-6 ${
        tone === "now"
          ? "bg-accent text-accent-foreground"
          : tone === "settled"
            ? "bg-secondary text-secondary-foreground"
            : tone === "plain"
              ? "border-border border"
              : "bg-card"
      }`}
    >
      {title !== undefined && (
        <h2 className="font-heading mb-3 flex items-center gap-2.5 text-[17px] font-extrabold">
          {Icon !== undefined && (
            <Icon className="size-[18px] shrink-0" strokeWidth={2.4} aria-hidden />
          )}
          {title}
        </h2>
      )}
      {children}
    </section>
  )
}
