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
 *  - **الوصي.** Without a guardian, `K_rec = S_paper ⊕ S_guardian` can only be
 *    rebuilt on the device that made it, so the printed sheet — which is
 *    already counted here — does not actually recover anything. Counting the
 *    sheet and not the guardian would report a recovery path that does not
 *    exist.
 *  - **التوجيه.** A vault with heirs but no routing delivers nothing to any of
 *    them. "Has heirs" and "reaches someone" are different facts.
 *
 * ## Ranking, and the one-amber rule
 *
 * `protection-score-list` allows exactly one `needed` item at a time; the rest
 * fall to `later`. A screen where six things are urgent ranks nothing. The
 * array order below **is** the ranking, and the guardian sits high for the
 * reason above.
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

import { isGuardianLive } from "@/lib/guardian"

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
    const guardianLive = isGuardianLive(guardians, keyring) === true

    return [
      {
        id: "identity",
        label: labels.identity,
        done: me?.identityStatus === "verified",
        href: "/setup/kyc",
      },
      { id: "key", label: labels.key, done: keyring !== null },
      {
        id: "guardian",
        label: labels.guardian,
        done: guardianLive,
        href: "/protection/guardian",
      },
      {
        id: "sheet",
        label: labels.sheet,
        done: keyring?.paperPrintedAt != null,
        href: "/setup/recovery-kit",
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
        href: "/plan/routing",
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
      if (!promoted) {
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
    topGap: items.find((item) => !item.done) ?? null,
    loading:
      me === undefined ||
      keyring === undefined ||
      guardians === undefined ||
      heirs === undefined ||
      checkin === undefined,
  }
}
