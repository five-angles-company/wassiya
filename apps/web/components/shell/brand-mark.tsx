/**
 * The mark: و in a terracotta tile.
 *
 * A rounded **square**, not a circle — 12px at desktop, 11px on mobile. The
 * design board is specific about it, and it matters: the product is otherwise
 * full of pills and circles, so a squared mark is the one shape that reads as
 * an identity rather than as another control.
 *
 * The Arabic initial stays Arabic in both languages. It is the mark, not a
 * letter anyone is reading.
 */
export function BrandMark({ size = "default" }: { size?: "default" | "sm" }) {
  const desktop = size === "default"

  return (
    <span
      aria-hidden
      className={
        desktop
          ? "bg-primary text-primary-foreground grid size-[38px] shrink-0 place-items-center rounded-[12px] font-heading text-[20px] font-black"
          : "bg-primary text-primary-foreground grid size-[34px] shrink-0 place-items-center rounded-[11px] font-heading text-[18px] font-black"
      }
    >
      و
    </span>
  )
}
