/**
 * The 4.1 data path: fetch, decrypt, filter, sort.
 *
 * ## Why every label is decrypted at once
 *
 * The board's 4.1 note says "decrypt lazily per visible row, never the whole
 * list", and the same screen has a search field over those labels. Both cannot
 * be literally true — you cannot match text you have not decrypted — so the
 * note is read here as the **rendering** rule it was written as: no row waits
 * on another row's blob, and nothing decrypts asset *content*.
 *
 * The labels themselves are opened in one pass. `assets.list` is capped at 500
 * rows and a label is two XChaCha operations over a few dozen bytes, so the
 * worst case is ~1000 operations in a `useMemo` — under a millisecond, once per
 * unlock, against a network round trip that already cost far more. Decrypting
 * them per visible row instead would mean a search that only finds what has
 * been scrolled past, which is worse than useless: it is wrong quietly.
 *
 * Content blobs are the opposite case and stay lazy — they are megabytes, and
 * nothing on this screen shows them.
 */
import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { Id } from "@workspace/backend/dataModel"
import { openLabel } from "@workspace/crypto/label"
import { unwrap } from "@workspace/crypto/wrap"

import { foldedIncludes } from "@/lib/arabic-text"
import { ASSET_TYPES, type AssetType } from "@/lib/asset-types"
import { useVault } from "@/stores/vault"

export type AssetListRow = {
  id: Id<"assets">
  type: AssetType
  /** The decrypted name, or a placeholder when the label would not open. */
  title: string
  subtitle?: string
  /** True when this row's label failed to decrypt. The row still renders. */
  undecryptable: boolean
  recipientCount: number
  /**
   * Who receives it, by name, resolved against `heirs.list`.
   *
   * The vault list draws faces from these. Names rather than a count because
   * "٢ مستلمين" tells an owner nothing they can act on, while seeing who is
   * there lets them notice who isn't — which is the only mistake this screen
   * can help catch.
   */
  recipients: string[]
  /** The shared bucket is routed here; it gets a word, not an initial. */
  allHeirs: boolean
  /** `recipientRule === "explicit"` — the badge and the sort key on the board. */
  routed: boolean
  createdAt: number
}

export type AssetListResult = {
  /** Undefined until the query answers; the screen shows skeletons meanwhile. */
  rows: AssetListRow[] | undefined
  /** Every asset the vault holds, before the search and filter are applied. */
  total: number
  /**
   * The vault's size straight off the row count — **available while locked**.
   *
   * `total` counts decrypted rows and is therefore zero until MK is in memory.
   * The locked screen has to state what is in there without opening anything,
   * and this is the figure it states: the same one the list header carries, so
   * the two screens agree.
   */
  vaultSize: number
  /** Heir names, for the faces the locked screen shows. Also un-gated by MK. */
  heirNames: string[]
  /**
   * How many assets each category holds, ignoring the search and the active
   * chip — a chip has to report the vault, not the current view, or selecting
   * one would renumber the rest.
   */
  byType: Record<AssetType, number>
}

export function useAssetList(
  search: string,
  filter: AssetType | null,
  undecryptableLabel: string,
  /** Copy for the two non-person destinations. */
  routingLabels: { executor: string } = { executor: "" }
): AssetListResult {
  const assets = useQuery(api.assets.list, {})
  // Names live on the heir record, not on the routing row — the deployment
  // ships ids and this is where they become people.
  const heirs = useQuery(api.heirs.list)
  // Subscribing to `mk` rather than reading it off `getState()` is what makes this
  // recompute on unlock: the getter would read the key without telling React
  // anything changed, and the list would stay locked until some other state
  // moved.
  const mk = useVault((s) => s.mk)

  const decrypted = useMemo(() => {
    if (assets === undefined || mk === null) return undefined
    return assets.map((asset): AssetListRow => {
      const base = {
        id: asset.id,
        type: asset.type,
        recipientCount: asset.recipientCount,
        recipients: asset.recipients
          .map((to) => {
            if (to.kind === "executor") return routingLabels.executor
            if (to.kind === "allHeirs") return ""
            return heirs?.find((heir) => heir.id === to.heirId)?.name ?? ""
          })
          .filter((name) => name.length > 0),
        allHeirs: asset.recipients.some((to) => to.kind === "allHeirs"),
        routed: asset.recipientRule === "explicit",
        createdAt: asset.createdAt,
      }
      try {
        const dek = unwrap(new Uint8Array(asset.dekWrappedByMk), mk)
        const label = openLabel(new Uint8Array(asset.labelSealed), dek)
        // The DEK is a live key; drop it as soon as the label is out. Nothing
        // on this screen decrypts content, so nothing else needs it.
        dek.fill(0)
        return {
          ...base,
          title: label.title,
          subtitle: label.subtitle,
          undecryptable: false,
        }
      } catch {
        // One unreadable row must not take the screen down. This is what a
        // half-completed MK rotation looks like from here — the wrapper no
        // longer matches the key — and the honest render is a named row the
        // user can act on, not an error boundary over their whole vault.
        return { ...base, title: undecryptableLabel, undecryptable: true }
      }
    })
  }, [assets, mk, undecryptableLabel, heirs, routingLabels.executor])

  const rows = useMemo(() => {
    if (decrypted === undefined) return undefined
    const query = search.trim()
    return decrypted
      .filter((row) => filter === null || row.type === filter)
      .filter(
        (row) =>
          query.length === 0 ||
          foldedIncludes(row.title, query) ||
          (row.subtitle !== undefined && foldedIncludes(row.subtitle, query))
      )
      .sort(compareRows)
  }, [decrypted, filter, search])

  const byType = useMemo(() => {
    const counts = Object.fromEntries(
      ASSET_TYPES.map((type) => [type, 0])
    ) as Record<AssetType, number>
    for (const row of decrypted ?? []) counts[row.type] += 1
    return counts
  }, [decrypted])

  return {
    rows,
    total: decrypted?.length ?? 0,
    vaultSize: assets?.length ?? 0,
    heirNames: (heirs ?? []).map((heir) => heir.name),
    byType,
  }
}

/**
 * "Sort: unrouted first, then recently edited" — 4.1's own spec.
 *
 * The second key is *created*, not edited: nothing on `assets` records an edit
 * time, and `_creationTime` is the only timestamp the row carries. It orders
 * identically until the first `assets.update` lands, at which point this wants
 * an `updatedAt` column rather than a cleverer comparator.
 */
function compareRows(a: AssetListRow, b: AssetListRow): number {
  if (a.routed !== b.routed) return a.routed ? 1 : -1
  return b.createdAt - a.createdAt
}
