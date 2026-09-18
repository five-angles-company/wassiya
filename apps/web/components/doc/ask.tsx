import type { ReactNode } from "react"

import { SetApart } from "@/components/doc/set-apart"

/**
 * The one thing asked of the reader, set apart by hairlines rather than boxed.
 *
 * **At most one may be on screen.** Two asks is two obligations, and a reader
 * who is grieving will act on neither. Everything not currently owed belongs in
 * the `Ledger` as a row.
 *
 * It is absent, not empty, when nothing is owed — the waiting state is said in
 * prose above, where it reads as an answer rather than as a missing button.
 */
export function Ask({
  eyebrow,
  title,
  children,
}: {
  /** "Asked of you now" — names the block's purpose before its content. */
  eyebrow: string
  title: string
  children: ReactNode
}) {
  return (
    <SetApart className="flex flex-col gap-4">
      <div>
        <p className="text-surface-accent-ink text-[12px] font-bold tracking-wide uppercase">
          {eyebrow}
        </p>
        <h2 className="font-heading mt-1.5 text-[21px] leading-tight font-extrabold">
          {title}
        </h2>
      </div>
      {children}
    </SetApart>
  )
}
