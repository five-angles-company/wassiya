"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"

import { RiskTable } from "@/features/dashboard/components/risk-table"

export type RiskData = FunctionReturnType<typeof api.admin.risk>

/**
 * Owns the risk query and hands the result to the table.
 *
 * It used to render three stat tiles above the table as well — "no guardian",
 * "never printed", "heirs with nothing" — but those were three of the eleven
 * boxes that made the page unreadable, and each was just a count of the rows
 * directly underneath it. The one number worth keeping, heirs who would receive
 * nothing, moved up into the summary bar; the rest is in the table.
 *
 * The query lives here rather than in the table so that anything else this band
 * grows reads the same rows, and so `admin.risk` — seven index ranges per owner,
 * the most expensive query on the page — is subscribed to exactly once.
 */
export function RiskSection() {
  const risk = useQuery(api.admin.risk, {})

  return <RiskTable risk={risk} />
}
