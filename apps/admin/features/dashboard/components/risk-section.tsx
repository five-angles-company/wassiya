"use client"

import { api } from "@workspace/backend/api"
import { useQuery } from "convex/react"
import type { FunctionReturnType } from "convex/server"

import { RiskTable } from "@/features/dashboard/components/risk-table"

export type RiskData = FunctionReturnType<typeof api.admin.risk>

/**
 * Owns the risk query and hands the result to the table.
 *
 * The query lives here rather than in the table so that anything else this band
 * grows reads the same rows, and so `admin.risk` — several index ranges per
 * owner, the most expensive query on the page — is subscribed to once here.
 * The summary bar's executors tile is the only other reader.
 */
export function RiskSection() {
  const risk = useQuery(api.admin.risk, {})

  return <RiskTable risk={risk} />
}
