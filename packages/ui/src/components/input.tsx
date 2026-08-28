import * as React from "react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * `bg-background`, not `bg-transparent`.
 *
 * It matches the outline Button — the shape every filter pill and toolbar
 * control already wears — so a search box and the pills beside it read as one
 * row of controls. Transparent made the input inherit whatever surface it sat
 * on, which is invisible in the stock theme (`--background` and `--card` are
 * both white) and wrong the moment they differ: inside a card, the pills showed
 * the page ground while the input showed the card.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-8 w-full min-w-0 rounded-lg border border-input bg-background px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

export { Input }
