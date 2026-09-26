/**
 * The one protection model, read by both Home (as a summary) and 6.1 (as a
 * to-do list) — computed once here so the two can never disagree about how safe
 * the vault is.
 *
 * The array order below is the ranking: exactly one `needed` item is promoted
 * to amber and the rest fall to `later`, because a screen where six things are
 * urgent ranks nothing. A `blocked` item is waiting on somebody else, so it
 * stays `later` and is skipped for `topGap`, never accusing the owner of a
 * step that is not theirs. It still counts against the score.
 *
 * The order is `admin.ts`'s `PROTECTION_ITEMS`; the console and this screen
 * must name the same six gaps in the same order.
 *
 * Every input is server metadata, so this renders before any decryption.
 */
import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { ProtectionItem } from "@workspace/ui-native/components/wassiya/protection-score-list"
import type { Href } from "expo-router"

export type ProtectionId =
  | "identity"
  | "key"
  | "sheet"
  | "executors"
  | "delivery"
  | "checkin"

export type ProtectionEntry = ProtectionItem & {
  id: ProtectionId
  /** Where to go to close this gap, when there is somewhere to go. */
  href?: Href
  /** Outstanding, but waiting on someone else — never the amber row. */
  blocked?: boolean
}

export type ProtectionScoreResult = {
  items: ProtectionEntry[]
  /** Same items, with exactly one `needed` and the rest `later`. */
  ranked: ProtectionEntry[]
  earned: number
  total: number
  /** The highest-ranked incomplete item — 3.1's single amber row. */
  topGap: ProtectionEntry | null
  /** Undefined until every source has answered. */
  loading: boolean
}

export function useProtectionScore(
  labels: Record<ProtectionId, string>
): ProtectionScoreResult {
  const me = useQuery(api.users.me)
  const keyring = useQuery(api.keyring.get)
  const executors = useQuery(api.executors.list)
  const checkin = useQuery(api.checkin.get)

  const items = useMemo((): ProtectionEntry[] => {
    return [
      {
        id: "identity",
        label: labels.identity,
        done: me?.identityStatus === "verified",
        href: "/setup/kyc",
      },
      { id: "key", label: labels.key, done: keyring !== null },
      {
        id: "sheet",
        label: labels.sheet,
        done: keyring?.paperPrintedAt != null,
        href: "/setup/recovery-kit",
      },
      {
        id: "executors",
        label: labels.executors,
        done: (executors?.length ?? 0) > 0,
        href: "/executors/new",
      },
      // Every executor holds a printed sheet. Without one an executor could
      // open nothing at release.
      {
        id: "delivery",
        label: labels.delivery,
        done:
          executors !== undefined &&
          executors.length > 0 &&
          executors.every((executor) => executor.sheetPrintedAt !== null),
        href: "/executors",
      },
      {
        id: "checkin",
        label: labels.checkin,
        done: checkin !== null,
        href: "/protection/checkin",
      },
    ]
  }, [me, keyring, executors, checkin, labels])

  const ranked = useMemo(() => {
    let promoted = false
    return items.map((item) => {
      if (item.done) return item
      // A blocked item is outstanding but not actionable, so it can never be
      // the one amber row — see the header.
      if (!promoted && item.blocked !== true) {
        promoted = true
        return { ...item, priority: "needed" as const }
      }
      return { ...item, priority: "later" as const }
    })
  }, [items])

  return {
    items,
    ranked,
    earned: items.filter((item) => item.done).length,
    total: items.length,
    topGap: items.find((item) => !item.done && item.blocked !== true) ?? null,
    loading:
      me === undefined ||
      keyring === undefined ||
      executors === undefined ||
      checkin === undefined,
  }
}
