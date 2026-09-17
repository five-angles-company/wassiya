/**
 * The vault, grouped by where things go rather than by type. The question an
 * owner actually has is "did I forget to route something?", and a flat list
 * sorted unrouted-first answers it while making you count; a pinned group with
 * a number on it does not. Type stays available as a filter, which is a way to
 * *find* a thing — a different job from seeing whether the vault is complete.
 *
 * Grouped by kind, not by recipient name: `assets.list` returns `recipientRule`
 * and `recipientCount`, never which people. "Does Fahmini receive anything?" is
 * answered on the plan tab; the inverse — which assets reach nobody — is what
 * only the vault can answer, and it needs no names.
 */
import type { AssetListRow } from "@/screens/assets/use-asset-list"

export type DestinationKind =
  /** Reaches nobody. The gap this product exists to prevent. */
  | "none"
  /** Follows the default rule, so every heir receives it. */
  | "all"
  /** Routed to named recipients. */
  | "explicit"

export type AssetGroup = {
  kind: DestinationKind
  rows: AssetListRow[]
}

/**
 * Order is the ranking, and it is deliberate: `none` first, always, however few
 * of them there are. Everything below it is working as intended and can wait.
 */
const ORDER: readonly DestinationKind[] = ["none", "all", "explicit"]

export function destinationOf(row: AssetListRow): DestinationKind {
  // Checked before `routed`: an asset can carry an explicit rule and still
  // reach nobody, if every recipient it named has since been removed. That is
  // the most dangerous state in the vault — it *looks* routed on its own row —
  // so the count decides, not the rule.
  if (row.recipientCount === 0) return "none"
  return row.routed ? "explicit" : "all"
}

/** Non-empty groups only, in ranked order. */
export function groupByDestination(rows: AssetListRow[]): AssetGroup[] {
  const buckets = new Map<DestinationKind, AssetListRow[]>()
  for (const row of rows) {
    const kind = destinationOf(row)
    const bucket = buckets.get(kind)
    if (bucket === undefined) buckets.set(kind, [row])
    else bucket.push(row)
  }
  return ORDER.filter((kind) => buckets.has(kind)).map((kind) => ({
    kind,
    rows: buckets.get(kind)!,
  }))
}
