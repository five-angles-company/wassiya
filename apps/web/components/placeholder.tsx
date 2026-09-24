import { cn } from "@workspace/ui/lib/utils"

/**
 * Where content will be once it loads.
 *
 * ⚠️ Static on purpose — no pulse. These sit on the report and delivery
 * screens, and a shimmering block reads as something happening to a person who
 * is waiting on news.
 */
export function Placeholder({ className, label }: { className?: string; label: string }) {
  return (
    <div
      role="status"
      aria-busy="true"
      aria-label={label}
      className={cn("bg-foreground/[0.05] rounded-card h-40 w-full", className)}
    />
  )
}
