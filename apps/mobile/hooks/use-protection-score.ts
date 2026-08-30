/**
 * The one protection model, rendered three ways.
 *
 * The board is explicit: *"The 4/5 ring is the same protection-score object
 * built in 2.6 — Home renders it as a summary, 6.1 as a to-do list."* If the
 * two computed it separately they would eventually disagree about how safe the
 * vault is, which is the one thing a security summary may never do. So it is
 * computed here and both screens read it.
 *
 * ## Why seven items rather than the board's five
 *
 * 3.1 draws five chips — الهوية، المفتاح، الوثيقة، الورثة، التحقق من الحياة —
 * and `protection-score.tsx` says "five, **at time of writing**", which
 * anticipates exactly this. Two have been added since that drawing, and both
 * are load-bearing rather than cosmetic:
 *
 *  - **الوصي.** Not for recovery any more — `K_rec = S_paper`, so the printed
 *    sheet recovers the vault on its own. The guardian is what makes *delivery*
 *    work: `K_h = S_server_h ⊕ S_guardian_h`, so a vault with heirs, routing
 *    and no guardian releases a box nobody can open. Still load-bearing, but
 *    it now ranks below the sheet rather than above it.
 *  - **التوجيه.** A vault with heirs but no routing delivers nothing to any of
 *    them. "Has heirs" and "reaches someone" are different facts.
 *
 * ## Ranking, and the one-amber rule
 *
 * `protection-score-list` allows exactly one `needed` item at a time; the rest
 * fall to `later`. A screen where six things are urgent ranks nothing. The
 * array order below **is** the ranking.
 *
 * ## An item the owner cannot close is never the amber one
 *
 * `blocked` marks an outstanding item that is waiting on somebody else. The
 * guardian is the live case: the owner sends an invitation from this app, but
 * *accepting* happens on the web, where the invited person mints their own key.
 * Promoting that to the single amber row would accuse the owner, every time
 * they open the app, of a step only somebody else can take — so a blocked item
 * stays `later`, wears the waiting pill, and is skipped for `topGap`. It still
 * counts against the score, because the vault really is incomplete.
 *
 * ## This hook never needs the vault unlocked
 *
 * Every input is server metadata — a status, a row's existence, a count. That
 * matters because 3.1's own spec says the home screen *"renders before any
 * decryption"*, and a protection summary that demanded a fingerprint to draw
 * would defeat the point of being the resting state.
 */
import { useMemo } from "react"
import { useQuery } from "convex/react"
import { api } from "@workspace/backend/api"
import type { ProtectionItem } from "@workspace/ui-native/components/wassiya/protection-score-list"
import type { Href } from "expo-router"

import { isGuardianLive, isGuardianPending } from "@/lib/guardian"

export type ProtectionId =
  | "identity"
  | "key"
  | "guardian"
  | "sheet"
  | "heirs"
  | "routing"
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
  const guardians = useQuery(api.guardians.list)
  const heirs = useQuery(api.heirs.list)
  const checkin = useQuery(api.checkin.get)

  const items = useMemo((): ProtectionEntry[] => {
    // Shared with the plan tab — see `lib/guardian.ts` for why this predicate
    // may exist in exactly one place.
    const guardianLive = isGuardianLive(guardians) === true
    const guardianPending = isGuardianPending(guardians) === true

    return [
      {
        id: "identity",
        label: labels.identity,
        done: me?.identityStatus === "verified",
        href: "/setup/kyc",
      },
      { id: "key", label: labels.key, done: keyring !== null },
      // The sheet outranks the guardian now: it is the whole of recovery, while
      // the guardian is delivery, which only matters after there are heirs.
      {
        id: "sheet",
        label: labels.sheet,
        done: keyring?.paperPrintedAt != null,
        href: "/setup/recovery-kit",
      },
      {
        id: "guardian",
        label: labels.guardian,
        done: guardianLive,
        blocked: guardianPending,
        href: "/protection/guardian",
      },
      {
        id: "heirs",
        label: labels.heirs,
        done: (heirs?.length ?? 0) > 0,
        href: "/heirs/new",
      },
      {
        id: "routing",
        label: labels.routing,
        done: heirs?.some((heir) => heir.routedAssetCount > 0) === true,
        // ٤.١ with its "بلا مستلم" chip set — the routing overview screen was
        // that same list, grouped and filtered, and ٤.١ now does both itself.
        href: "/assets?filter=unrouted",
      },
      {
        id: "checkin",
        label: labels.checkin,
        done: checkin !== null,
        href: "/protection/checkin",
      },
    ]
  }, [me, keyring, guardians, heirs, checkin, labels])

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
      guardians === undefined ||
      heirs === undefined ||
      checkin === undefined,
  }
}
