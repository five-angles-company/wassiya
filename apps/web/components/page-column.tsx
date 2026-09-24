import type { ReactNode } from "react"

import { cn } from "@workspace/ui/lib/utils"

/** The content column every screen sits in. `narrow` is the auth forms. */
export function PageColumn({ children, narrow = false }: { children: ReactNode; narrow?: boolean }) {
  return (
    <div
      className={cn(
        "mx-auto w-full px-4 pt-10 pb-24 md:px-6 md:pt-14",
        narrow ? "max-w-[480px]" : "max-w-[920px]"
      )}
    >
      {children}
    </div>
  )
}
