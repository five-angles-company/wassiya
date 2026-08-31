import type { ReactNode } from "react"

/**
 * The top of a screen: a title, a sentence, and whatever action belongs beside
 * them.
 *
 * ## One page title, at one size
 *
 * There were ten `h1` treatments across the app — 22, 24, 26, 28, 30, 32, 34,
 * 36 — because most screens wrote their own instead of using this. The guardian
 * page had gone furthest, wrapping its title in a hero card with a medallion
 * and a bespoke pair of figures, so it no longer looked like the home screen it
 * sits one click from. Every app screen uses this now, at 26/30.
 *
 * The exception is deliberate and small: the accept ceremony and the box gate
 * are one-time, full-screen moments rather than screens someone returns to, and
 * they carry a display scale of their own. Two scales, both written down, is a
 * system; ten is not.
 *
 * ## Application sizes, not the funnel's
 *
 * The old surface set headings at 40–66px because each of those pages was
 * opened once, as an argument. A screen here is opened repeatedly by someone
 * checking on something, and a headline filling a third of the viewport on
 * every visit stops reading as confidence and starts reading as an obstacle
 * between them and the answer.
 *
 * `description` is one sentence. If a screen needs two, the second belongs next
 * to the thing it describes.
 */
export function PageHeader({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div className="min-w-0">
        <h1 className="font-heading text-[26px] leading-tight font-extrabold md:text-[30px]">
          {title}
        </h1>
        {description !== undefined && (
          <p className="text-muted-foreground mt-3 max-w-[62ch] text-[14.5px] leading-[1.75]">
            {description}
          </p>
        )}
      </div>
      {action !== undefined && <div className="shrink-0">{action}</div>}
    </header>
  )
}
