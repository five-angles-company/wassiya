/**
 * The figure at the growing end of a horizontal bar.
 *
 * ## ⚠️ A reversed axis hands over a NEGATIVE width
 *
 * That is the whole reason this exists. With `reversed`, Recharts gives `x` as
 * the **zero** end and a negative `width` running back to the value — so `x` is
 * the bar's right edge, not its left. `position="left"` reads that sign too and
 * flips its own anchor to compensate, which is why the figure stayed pinned to
 * the zero end and sat on top of the category names.
 *
 * So the rectangle is normalised before anything is decided: the value end is
 * the **left** edge when mirrored and the right edge when not, whatever sign
 * the width arrives with. `textAnchor` flips with it, so the text grows away
 * from the bar rather than back across it.
 *
 * The SVG is pinned to `direction: ltr` by the chart container, so `start` and
 * `end` here mean left and right — see `activation-funnel.tsx`.
 */
type BarRect = {
  x?: string | number
  y?: string | number
  width?: string | number
  height?: string | number
  value?: string | number
}

const GAP = 6

const num = (value: string | number | undefined): number =>
  typeof value === "number" ? value : Number(value ?? 0)

export function barValueLabel(rtl: boolean, format: (value: number) => string) {
  return function BarValueLabel(props: unknown) {
    const { x, y, width, height, value } = (props ?? {}) as BarRect
    const x0 = num(x)
    const y0 = num(y)
    const w = num(width)
    const h = num(height)

    const leftEdge = Math.min(x0, x0 + w)
    const rightEdge = Math.max(x0, x0 + w)
    const middleY = Math.min(y0, y0 + h) + Math.abs(h) / 2

    return (
      <text
        x={rtl ? leftEdge - GAP : rightEdge + GAP}
        y={middleY}
        textAnchor={rtl ? "end" : "start"}
        dominantBaseline="middle"
        className="fill-foreground"
        fontSize={12}
      >
        {format(num(value))}
      </text>
    )
  }
}
