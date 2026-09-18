import type { ReactNode } from "react"

/**
 * A division of the page, opened by a hairline and a heading.
 *
 * This is what replaced `Panel`. A card says "this is a separate object"; every
 * one of these is part of the same document, and boxing them drew six frames a
 * reader then had to look past. On a phone the frames also spent most of the
 * width on padding.
 *
 * A box survives in exactly one place — around a secret — where it marks
 * something the reader must not confuse with ordinary page text.
 */
export function DocSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <section className="border-border flex flex-col gap-4 border-t pt-5">
      <h2 className="font-heading text-[19.5px] leading-tight font-extrabold">
        {title}
      </h2>
      {children}
    </section>
  )
}
