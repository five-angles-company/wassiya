import type { ReactNode } from "react"

/**
 * The top of a screen: a title, a sentence, and whatever action belongs beside
 * them.
 *
 * Application sizes, not the funnel's. The old surface set its headings at
 * 40–66px because each of those pages was opened once, as an argument. A screen
 * here is opened repeatedly by someone checking on something, and a headline
 * that fills a third of the viewport on every visit stops reading as confidence
 * and starts reading as an obstacle between them and the answer.
 *
 * `description` is one sentence. If a screen needs two, the second one belongs
 * next to the thing it describes.
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
        <h1 className="font-heading text-[24px] leading-tight font-extrabold md:text-[28px]">
          {title}
        </h1>
        {description !== undefined && (
          <p className="text-muted-foreground mt-2 max-w-[62ch] text-[14.5px] leading-[1.7]">
            {description}
          </p>
        )}
      </div>
      {action !== undefined && <div className="shrink-0">{action}</div>}
    </header>
  )
}
