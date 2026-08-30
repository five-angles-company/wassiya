/**
 * The mark: و in a terracotta disc.
 *
 * Its own component because it existed twice — once in `ClaimBrand` at
 * `max-w-5xl` and once copied byte-for-byte into `app/page.tsx` at `max-w-3xl`.
 * Two copies of a logo at two widths is how a site stops looking like one site.
 *
 * The Arabic initial stays Arabic in both languages: it is the mark, not a
 * letter anyone is reading.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={
        "bg-terracotta-200 text-terracotta-700 flex size-9 shrink-0 items-center justify-center rounded-full text-[19px] font-black " +
        (className ?? "")
      }
    >
      و
    </span>
  )
}
