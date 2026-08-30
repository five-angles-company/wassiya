import { cn } from "@workspace/ui/lib/utils"

/**
 * A full-bleed band of colour.
 *
 * The Organic palette was being used timidly — cream everywhere, with
 * terracotta rationed out to buttons the size of a thumb. The same hex values
 * used as whole fields read completely differently, and that is the change:
 * not new colours, a different distribution of the ones there already.
 *
 * Bands alternate so the page has a pulse. Two adjacent coloured bands would
 * fight; a coloured band between two cream ones lands.
 */
const TONES = {
  page: "bg-background text-foreground",
  card: "bg-card text-foreground",
  /** The one that carries the headline. Cream type on terracotta. */
  primary: "bg-primary text-primary-foreground",
  /** Reassurance, never action — olive is what the timeline uses for "done". */
  olive: "bg-secondary text-secondary-foreground",
  /** Weight. Used once per page at most. */
  ink: "bg-[#221f1b] text-[#f5ead8]",
} as const

export function Band({
  tone = "page",
  size = "default",
  className,
  innerClassName,
  children,
}: {
  tone?: keyof typeof TONES
  size?: "default" | "tall" | "tight"
  className?: string
  innerClassName?: string
  children: React.ReactNode
}) {
  return (
    <section className={cn("w-full", TONES[tone], className)}>
      <div
        className={cn(
          "mx-auto max-w-5xl px-5 md:px-8",
          size === "tall"
            ? "py-16 md:py-24"
            : size === "tight"
              ? "py-8 md:py-10"
              : "py-12 md:py-16",
          innerClassName
        )}
      >
        {children}
      </div>
    </section>
  )
}
