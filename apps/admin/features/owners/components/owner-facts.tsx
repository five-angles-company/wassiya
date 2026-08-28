"use client"

import type { ReactNode } from "react"
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@workspace/ui/components/card"

/**
 * A titled card of label-over-value rows.
 *
 * Four sections of the owner screen are the same shape — a heading and a short
 * list of facts — and writing each one out separately is how they end up with
 * four slightly different paddings. The vault board's grammar, in the console:
 * hairline rows, label above value, no boxes inside boxes.
 */
export function OwnerFacts({
  title,
  action,
  children,
}: {
  title: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex-row items-center justify-between gap-3 border-b py-3">
        <CardTitle className="font-heading text-sm">{title}</CardTitle>
        {action}
      </CardHeader>
      <CardContent className="flex flex-col px-0 py-0">{children}</CardContent>
    </Card>
  )
}

/** One fact. `value` is a node so a badge or a link can stand in for text. */
export function Fact({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b px-4 py-2.5 last:border-b-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-end text-sm">{value}</span>
    </div>
  )
}

/** An empty section, worded rather than left blank. */
export function FactsEmpty({ children }: { children: ReactNode }) {
  return (
    <p className="px-4 py-4 text-sm text-muted-foreground">{children}</p>
  )
}
