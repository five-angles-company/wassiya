/**
 * One heading and its paragraph, at the rhythm the legal pages share.
 *
 * These pages are read in one pass by someone deciding whether to trust the
 * product, so they are a stack of short claims rather than numbered clauses.
 * The component exists so all three keep the same rhythm without three copies
 * of the same two class strings.
 */
export function ProseSection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="border-border border-t pt-7">
      <h2 className="text-[19px]">{title}</h2>
      <p className="text-sand-700 mt-3 text-[15.5px] leading-[1.8]">
        {children}
      </p>
    </section>
  )
}
