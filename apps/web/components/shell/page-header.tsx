/**
 * The eyebrow / title / lede rhythm, in one place.
 *
 * Every screen had invented its own: `text-[30px] md:text-[40px]` on the
 * landing, `text-[28px] md:text-[34px]` on the status page, `text-[26px]` on
 * its three terminal states, `text-[22px]` on the home page. Four sizes for one
 * role reads as four different products.
 *
 * Headings take Cairo 800 automatically from `.wassiya h1`, so nothing here
 * sets a font.
 */
export function PageHeader({
  eyebrow,
  title,
  lede,
}: {
  eyebrow?: string
  title: string
  lede?: string
}) {
  return (
    <div className="flex flex-col gap-3">
      {eyebrow !== undefined && (
        <span className="text-terracotta-700 text-[13px] font-semibold">
          {eyebrow}
        </span>
      )}
      <h1 className="text-[28px] leading-[1.2] md:text-[36px]">{title}</h1>
      {lede !== undefined && (
        <p className="text-sand-700 max-w-[62ch] text-[15.5px] leading-[1.75]">
          {lede}
        </p>
      )}
    </div>
  )
}
