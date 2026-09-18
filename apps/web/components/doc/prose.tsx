/**
 * The body of the letter.
 *
 * **66ch, and it is the app's only reading measure.** Prose is capped while the
 * column around it is not: a line of text stays readable at a fixed number of
 * characters, but rows, records and headings want the full width. Widening the
 * column without this would have made every paragraph a long thin line.
 *
 * Capped at all because this is read, not scanned — every screen in this
 * product is someone's first, and there is no second visit in which they pick
 * up what they skimmed.
 */
export function Prose({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[66ch] space-y-3.5 text-[15px] leading-[1.75]">
      {children}
    </div>
  )
}
