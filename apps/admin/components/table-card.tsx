import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

/**
 * A table inside a card, with its title and its footnote in the right places.
 *
 * The tables used to sit as bare bordered rectangles on the page ground, which
 * made them read as raw output rather than as a panel — and gave a five-row
 * table the same visual weight as a hundred-row one. The card supplies the
 * surface and the border, so the table inside is drawn flat and the two do not
 * double up on chrome.
 *
 * `footnote` is where "showing 5 of 34" goes: the count belongs under the rows,
 * not in the title, because it describes what you are looking at rather than
 * what the panel is.
 */
export function TableCard({
  title,
  hint,
  action,
  footnote,
  children,
}: {
  title: string
  hint?: string
  action?: ReactNode
  footnote?: string
  children: ReactNode
}) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="flex-row items-start justify-between gap-3 border-b py-4">
        <div className="flex flex-col gap-1">
          <CardTitle className="font-heading text-base">{title}</CardTitle>
          {hint !== undefined && (
            <CardDescription className="text-xs">{hint}</CardDescription>
          )}
        </div>
        {action}
      </CardHeader>
      <CardContent className="px-0 py-0">{children}</CardContent>
      {footnote !== undefined && (
        <div className="border-t px-4 py-2.5 text-xs text-muted-foreground">
          {footnote}
        </div>
      )}
    </Card>
  )
}
