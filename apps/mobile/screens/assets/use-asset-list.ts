/**
 * The ٤.١ data path: fetch, decrypt, filter, sort.
 *
 * Every **label** is decrypted in one pass, and the "decrypt lazily per
 * visible row" is read as the rendering rule it was written as — no row waits on
 * another row's blob. You cannot match text you have not decrypted, and a search
 * that only finds what has been scrolled past is wrong quietly. `assets.list` is
 * capped at 500 rows and a label is two XChaCha operations over a few dozen
 * bytes, so the worst case is ~1000 operations in a `useMemo`, once per unlock.
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
  /** False when the owner kept it private: it dies with them. */
  handedOver: boolean
  createdAt: number
}

/**
 * What the chip row can be set to.
 *
 * `null` is "الكل". `"private"` is not a category — it is the one *state* worth
 * filtering by, because grouping by type scatters private assets across every
 * heading.
 */
export type AssetFilter = AssetType | "private" | null

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
  /** Executor names, for the faces the locked screen shows. Un-gated by MK. */
  executorNames: string[]
  /**
   * How many of the **whole vault** are handed over — never just the current
   * view, so a chip cannot renumber the header.
   */
  handedOverTotal: number
  /**
   * How many assets each category holds, ignoring the search and the active
   * chip — a chip has to report the vault, not the current view, or selecting
   * one would renumber the rest.
   */
  byType: Record<AssetType, number>
  /**
   * The visible rows already split into type sections, in `ASSET_TYPES` order,
   * with empty types dropped. Sections are built from the *filtered* rows, so a
   * search that matches two types yields two sections and a type chip yields
   * one — the screen never has to re-group what this already grouped.
   */
  sections: { type: AssetType; rows: AssetListRow[] }[]
}

export function useAssetList(
  search: string,
  filter: AssetFilter,
  undecryptableLabel: string
): AssetListResult {
  const assets = useQuery(api.assets.list, {})
  const executors = useQuery(api.executors.list)
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
        handedOver: asset.handedOver,
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
  }, [assets, mk, undecryptableLabel])

  const rows = useMemo(() => {
    if (decrypted === undefined) return undefined
    const query = search.trim()
    return decrypted
      .filter((row) =>
        filter === null
          ? true
          : filter === "private"
            ? !row.handedOver
            : row.type === filter
      )
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

  /**
   * Grouped after the sort, so `compareRows` still decides the order *inside* a
   * section. Grouping only decides which heading a row sits under.
   */
  const sections = useMemo(() => {
    if (rows === undefined) return []
    return ASSET_TYPES.map((type) => ({
      type,
      rows: rows.filter((row) => row.type === type),
    })).filter((section) => section.rows.length > 0)
  }, [rows])

  return {
    rows,
    sections,
    total: decrypted?.length ?? 0,
    handedOverTotal: (decrypted ?? []).filter((row) => row.handedOver).length,
    vaultSize: assets?.length ?? 0,
    executorNames: (executors ?? []).map((executor) => executor.name),
    byType,
  }
}

/**
 * Newest first. *Created*, not edited: nothing on `assets` records an edit time,
 * and `_creationTime` is the only timestamp the row carries.
 */
function compareRows(a: AssetListRow, b: AssetListRow): number {
  return b.createdAt - a.createdAt
}
