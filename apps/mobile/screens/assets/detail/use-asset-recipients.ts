/**
 * Who receives one asset, by name.
 *
 * `routing.forAsset` ships ids; the names live on the heir records. Both
 * queries are already open elsewhere on most of these screens, and Convex
 * dedupes them, so this costs nothing beyond the join it exists to do.
 *
 * The two non-person destinations are separated out rather than folded into the
 * name list: "كل الورثة" is a category and must not be drawn with an initial,
 * or a group starts looking like somebody.
 */
import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"

import { useStrings } from "@/i18n/use-strings"

export type AssetRecipients = {
  /** Named people, in routing order. Empty while loading or when unrouted. */
  names: string[]
  /** The shared bucket is among the destinations. */
  allHeirs: boolean
  /** Still loading — distinct from "genuinely nobody". */
  pending: boolean
}

export function useAssetRecipients(assetId: Id<"assets">): AssetRecipients {
  const { t } = useStrings("assets/recipients")
  const rows = useQuery(api.routing.forAsset, { assetId })
  const heirs = useQuery(api.heirs.list)

  return useMemo(() => {
    if (rows === undefined) return { names: [], allHeirs: false, pending: true }
    const names: string[] = []
    let allHeirs = false
    for (const row of rows) {
      // Bound to a `const` first: narrowing on `row.recipient` does not survive
      // into a callback, which reads it from a fresh closure.
      const to = row.recipient
      if (to.kind === "allHeirs") {
        allHeirs = true
        continue
      }
      if (to.kind === "executor") {
        names.push(t.executor!)
        continue
      }
      const name = heirs?.find((heir) => heir.id === to.heirId)?.name
      if (name !== undefined) names.push(name)
    }
    return { names, allHeirs, pending: false }
  }, [rows, heirs, t.executor])
}
