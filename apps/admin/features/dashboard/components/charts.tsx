"use client"

import dynamic from "next/dynamic"
import { Skeleton } from "@workspace/ui/components/skeleton"

/**
 * The three recharts panels, split out of the first load.
 *
 * Recharts and its d3 dependencies are the largest thing the console ships, and
 * they are drawn on exactly one screen — below the fold, under the queue and
 * the risk table that the dashboard exists for. Loading them with the page put
 * that parse cost on the main thread before anything above the fold was
 * interactive.
 *
 * `ssr: false` because these render a canvas-like tree off measured element
 * widths; there is nothing useful to send from the server, and the skeleton is
 * what the panels show while their own query is in flight anyway.
 */
const panel = () => <Skeleton className="h-72 w-full rounded-xl" />

export const ActivationFunnel = dynamic(
  () =>
    import("@/features/dashboard/components/activation-funnel").then(
      (m) => m.ActivationFunnel
    ),
  { ssr: false, loading: panel }
)

export const SignupsChart = dynamic(
  () =>
    import("@/features/dashboard/components/signups-chart").then(
      (m) => m.SignupsChart
    ),
  { ssr: false, loading: panel }
)

export const StoragePanel = dynamic(
  () =>
    import("@/features/dashboard/components/storage-panel").then(
      (m) => m.StoragePanel
    ),
  { ssr: false, loading: panel }
)
