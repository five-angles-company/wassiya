import type { ElementType, ReactNode } from "react"

/**
 * A block lifted out of the letter's flow, closed by a hairline top and bottom.
 *
 * ## Why this is not `DocSection`
 *
 * They look similar and mean opposite things. `DocSection` opens with a rule
 * **above** and nothing below: sections stack, and the run of them reads as one
 * continuous document. This closes on **both** sides with more air, so what sits
 * inside it stops being part of the flow — an interruption rather than a
 * division.
 *
 * Use it for the thing being asked of the reader, or for a diagram that explains
 * the gate they are standing at. Use `DocSection` for the next part of what you
 * are telling them.
 *
 * ## ⚠️ Why it exists as a component at all
 *
 * `border-border border-y py-7` was written out by hand in four places — twice
 * in the file-a-report form, once on the delivery page, once in the
 * mechanism diagram — while `Ask` carried the same string as the only named
 * version of the idea. Four copies of a rule is four places for it to drift by a
 * pixel, and it already had: the headings above them were 19px where `Ask`'s is
 * 21px, so the same block rendered two sizes depending on which page you opened.
 *
 * ⚠️ **Still no shadow and no fill.** `Paper` is for *data* — dates, contents, a
 * list — and this is not that. A block that both boxes and tints would be a card
 * around the page's own argument, which `Paper`'s own docstring refuses.
 */
export function SetApart({
  children,
  as: Tag = "section",
  className,
}: {
  children: ReactNode
  /**
   * `section` by default; `aside` where the block is genuinely beside the
   * argument rather than part of it — the mechanism diagram is the one case.
   */
  as?: ElementType
  className?: string
}) {
  return (
    <Tag className={`border-border border-y py-7 ${className ?? ""}`}>
      {children}
    </Tag>
  )
}
